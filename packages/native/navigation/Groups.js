// Library Imports
import { useContext, useEffect, useState, } from "react";
import { Alert, Image, Modal, Pressable, View,  } from "react-native";
import { ScrollView, } from "react-native-gesture-handler";
import { createStackNavigator, } from "@react-navigation/stack";

// Component Imports
import { AvatarIcon, AvatarList, GroupRelationAmounts, } from "../components/Avatar";
import { AddButton, LeaveGroupPill, NewTransactionPill, PersonAddPill, SettingsPill, StyledButton, StyledCheckbox, } from "../components/Button";
import { GradientCard, } from "../components/Card";
import { Entry, SearchBarFull, SearchBarShort, } from "../components/Input";
import { CenteredTitle, EmojiBar, GroupLabel, RelationHistoryLabel, StyledText, TransactionLabel, } from "../components/Text";
import TransactionDetail from "../components/TransactionDetail";
import { CardWrapper, ListScroll, PageWrapper, ScrollPage, StyledModalContent, TrayWrapper, } from "../components/Wrapper";

// Context Imports
import { CurrentUserContext, DarkContext, FocusContext, GroupsContext, NewTransactionContext, TransactionsContext, UsersContext, } from "../Context";

// API Imports
import { DBManager, } from "../api/dbManager";
import { emojiCurrencies, legalCurrencies, notificationTypes, } from "../api/enum";
import { NotificationFactory, } from "../api/notification";
import { getDateString, } from "../api/strings";

// Style Imports
import { darkTheme, globalColors, lightTheme, } from "../assets/styles";

// todo: PUT THIS IN SETTINGS!
const legacyGroupDetail = false;

/**
 * Component for wrapping the enire groups stack navigator
 * @param {ReactNavigation} navigation navigation object from main tabs page 
 */
export default function Groups({navigation}) {

  /** Create a stack navigator to hold all group screens */
  const GroupStack = createStackNavigator();

  return (
    <GroupStack.Navigator
      initialRouteName="list"
      screenOptions={{
        headerShown: false
      }}
    >
      <GroupStack.Screen name="default"     component={GroupsList}        />
      <GroupStack.Screen name="list"        component={GroupsList}        />
      <GroupStack.Screen name="invite"      component={InviteMembers}     />
      <GroupStack.Screen name="detail"      component={DetailPage}        />
      <GroupStack.Screen name="settings"    component={Settings}          />
      <GroupStack.Screen name="transaction" component={TransactionDetail} />
    </GroupStack.Navigator> 
  )
}

/**
 * Component for rending a list of all of the currentUser's groups
 * @param {ReactNavigation} navigation navigation object from {@link Groups} page
 */
function GroupsList({navigation}) {

  // Get context
  const { currentUserManager } = useContext(CurrentUserContext);
  const { groupsData, setGroupsData } = useContext(GroupsContext);
  const { focus, setFocus } = useContext(FocusContext);
  const { newTransactionData, setNewTransactionData } = useContext(NewTransactionContext);
  const { dark } = useContext(DarkContext);
  
  // Create states
  const [ search, setSearch ] = useState("");                       // Keep track of the current value of search box
  const [ createModalOpen, setCreateModalOpen ] = useState(false);  // Keep track of whether or not createGroup modal is open
  const [ newName, setNewName ] = useState("");                     // Keep track of any new group's name
  const [ inviteGroups, setInviteGroups ] = useState([]);           // Keep track of any incoming group invitations
  const [ groups, setGroups ] = useState([]);                       // Keep track of the currentUser's groups

  /**
   * Create a new group with the {@link newName}
   * @async
   */
  async function handleCreate() {
    // Create group
    const groupManager = DBManager.getGroupManager();
    groupManager.setName(newName);
    groupManager.setCreatedAt(new Date());
    groupManager.setCreatedBy(currentUserManager.documentId);
    groupManager.addUser(currentUserManager.documentId);
    await groupManager.push();

    // Save group data locally
    const newData = {...groupsData};
    newData[groupManager.documentId] = groupManager.data;
    setGroupsData(newData);

    // Add group to current user
    currentUserManager.addGroup(groupManager.documentId);
    currentUserManager.push();

    // Set focus
    const newFocus = {...focus};
    newFocus.group = groupManager.documentId;
    setFocus(newFocus);

    // Go to group detail
    navigation.navigate("detail");
  }

  /**
   * A component to display under a group card when swiping left
   * @const
   */
  const newTransactionSwipeIndicator = (
    <View display="flex" flexDirection="row" alignItems="center" justifyContent="flex-start" style={{width: "100%", paddingLeft: 20 }}>
        <Image source={dark ? require("../assets/images/AddButton.png") : require("../assets/images/AddButtonLight.png")} style={{width: 20, height: 20, borderWidth: 1, borderRadius: 15, borderColor: dark ? darkTheme.buttonBorder : lightTheme.buttonBorder}}/>
        <StyledText text="New Transaction" marginLeft={10} />
    </View>
  );

  // Whenever groupsData or currentUserManager changes, fetch data on all groups
  useEffect(() => { fetchGroupData(); }, [groupsData, currentUserManager]);

  /**
   * Fetch data for all of the current user's groups and update the {@link groups} state
   */
  async function fetchGroupData() {
    // Guard clauses:
    if (!currentUserManager) { return; } // No current user

    // Fetch all groups from groupsData
    let newGroups = [];
    for (const groupId of Object.keys(groupsData)) {
      if (currentUserManager.data.groups.includes(groupId)) {
        const g = {...groupsData[groupId]};
        g['id'] = groupId;
        newGroups.push(g);
      }
    }
    setGroups(newGroups); // Set state

    // Fetch all groups that user has been invited to
    let newInviteGroups = [];
    for (const groupId of currentUserManager.data.groupInvitations) {
      if (groupsData[groupId]) {
        const groupData = groupsData[groupId];
        groupData["id"] = groupId;
        newInviteGroups.push(groupData);
      } else {
        // If we don't have data on this group, look it up from DB
        const inviteGroupManager = DBManager.getGroupManager(groupId);
        await inviteGroupManager.fetchData();
        const groupData = inviteGroupManager.data;
        groupData["id"] = groupId;
        newInviteGroups.push(groupData);
        // Might as well store this group's data too
        const newData = {...groupsData};
        newData[groupId] = groupData;
        setGroupsData(newData);
      }
    }
    setInviteGroups(newInviteGroups);
  }

  /**
   * Render a gradient card for each current user's group 
   */
  function renderGroups() {
    // Guard clauses:
    if (!currentUserManager) { return; } // No current user

    // Map groups to GradientCards
    return groups.map((group, index) => {
      // Guard clauses:
      if (!groupsData[group.id]) { return; }  // We don't have data on this group
      if (!groupInSearch()) { return; }       // Group filtered out by search

      // First, calculate the group's total balance
      let bal = 0;
  
      for (const userId of Object.keys(currentUserManager.data.relations)) {
        // For every relation
        if (currentUserManager.data.relations[userId].groupBalances[group.id]) {
          // User has a bal with this person in this group
          if (currentUserManager.data.relations[userId].groupBalances[group.id]["USD"]) {
            // Add the USD bal
            bal += currentUserManager.data.relations[userId].groupBalances[group.id]["USD"];
          }
        }
      }

      /**
       * Get gradient based on the sign on the balance
       * @returns gradient key
       */
      function getGradient() {
        if (bal.toFixed(2) > 0) {
          return "green";
        }
        if (bal.toFixed(2) < 0) {
          return "red";
        }
        return "white";
      }

      /**
       * On click, navigate to group's detail page
       */
      function focusGroup() {
        // Update focus
        const newFocus = {...focus};
        newFocus.group = group.id;
        setFocus(newFocus);
        // Navigate
        navigation.navigate("detail");
      }

      /**
       * Get whether or not this group is within search params
       * @returns boolean in search
       */
      function groupInSearch() {
        // Guard cluases:
        if (!group.name) { return false; };

        return group.name.toLocaleLowerCase().includes(search.toLocaleLowerCase().replace(" ", ""));
      }

      /**
       * Set up a new transction with this group and navigate to new transcation amount screen
       */
      function handleNewTransactionClick() {
        const newUsers = {};
        for (const u of group.users) {
          newUsers[u] =  {
            id: u,
            paid: false,
            split: true,
            paidManual: null,
            splitManual: null,
          };
        }
        newUsers[currentUserManager.documentId] = {
          id: currentUserManager.documentId,
          paid: true,
          split: true,
          paidManual: null,
          splitManual: null,
        };
        setNewTransactionData({
          users: newUsers,
          group: group.id,
          total: null,
          legalType: legalCurrencies.USD,
          emojiType: emojiCurrencies.BEER,
          currencyMenuOpen: false,
          currencyLegal: true,
          split: "even",
          splitPercent: false,
          paidBy: "even",
          paidByPercent: false,
          title: null,
          isIOU: false,
          firstPage: false,
          paidByModalState: {
            evenPayers: [currentUserManager.documentId],
            manualValues: {},
            percent: false,
          },
          splitModalState: {
            evenSplitters: group.users,
            manualValues: {},
            percent: false,
          }
        });
        navigation.navigate("New Transaction", {screen: "amount-entry"});
      }

      // Render the card
      return (
        <GradientCard key={index} gradient={getGradient()} onClick={focusGroup} leftSwipeComponent={newTransactionSwipeIndicator} onLeftSwipe={handleNewTransactionClick}>
          <View display="flex" flexDirection="column" alignItems="flex-start" justifyContent="space-between">
            <StyledText text={group.name} marginTop={0.01} onClick={focusGroup} marginBottom={10}/>
            <AvatarList users={group.users} size={40} marginRight={-10}/>
          </View>
          <View display="flex" flexDirection="column" alignItems="flex-end" justifyContent="space-between">
            <GroupLabel group={group} marginBottom={20} onClick={focusGroup}/>
            <EmojiBar group={group} />
          </View>
        </GradientCard>
      )
    })
  }

  /**
   * Render GradientCards for all of the currentUser's group invitations
   */
  function renderInvitations() {
    // Guard clauses:
    if (!currentUserManager) { return; } // No current user

    /** Indicator for declining invites to render under group invite */
    const declineSwipeIndicator = (
      <View display="flex" flexDirection="row" alignItems="center" justifyContent="flex-start" style={{width: "100%", paddingLeft: 20 }}>
        <Image source={dark ? require("../assets/images/TrashDark.png") : require("../assets/images/TrashLight.png")} style={{width: 20, height: 20}}/>
        <StyledText text="Decline Invitation" marginLeft={10} />
      </View>
    )

    // Map invitations
    return inviteGroups.map((group, index) => {

      /**
       * Ignore this invitation and update both current user + sender's docs
       */
      function ignoreInvite() {
        currentUserManager.removeGroupInvitation(group.id);
        const groupManager = DBManager.getGroupManager(group.id);
        groupManager.removeInvitedUser(currentUserManager.documentId);
        currentUserManager.push();
        groupManager.push();
      }
      
      /**
       * Accept this invitation and update both current user + sender's docs
       * @async
       */
      async function acceptInvite() {
        const incomingGroupInviteSenderManager = DBManager.getUserManager(group.createdBy);
        const invitedGroupManager = DBManager.getGroupManager(group.id);
        const groupName = group.name;
        const incomingGroupInviteSenderNotif = NotificationFactory.createUserJoinedGroup(currentUserManager.data.personalData.displayName, groupName, group.id);
        incomingGroupInviteSenderManager.addNotification(incomingGroupInviteSenderNotif);
        incomingGroupInviteSenderManager.push();
        invitedGroupManager.removeInvitedUser(currentUserManager.documentId);
        invitedGroupManager.addUser(currentUserManager.documentId);
        await invitedGroupManager.push();
        currentUserManager.removeGroupInvitation(group.id);
        currentUserManager.addGroup(group.id);
        const pseudoNotif = {
          type: notificationTypes.INCOMINGGROUPINVITE,
          target: group.id
        }
        currentUserManager.removeNotification(pseudoNotif);
        currentUserManager.push();
        const incomingGroupInviteUpdate = {...groupsData};
        incomingGroupInviteUpdate[group.id] = invitedGroupManager.data;
        setGroupsData(incomingGroupInviteUpdate);
      }

      /**
       * Display a popup allowing user to confirm accepting a group invite
       */
      function alertAcceptInvite() {
        Alert.alert(group.name, `Accept group invite?`, [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Add Group',
            onPress: () => acceptInvite(),
            style: 'default',
          },
        ],)
      }

      // Render the card
      return (
        <GradientCard key={index} gradient="white" leftSwipeComponent={declineSwipeIndicator} onLeftSwipe={ignoreInvite} onClick={alertAcceptInvite}>
          <View style={{flex: 6}}>
            <StyledText text={group.name} fontSize={14} />
          </View>
          <View style={{flex: 4}}>
            <AvatarList users={group.users} size={40} marginRight={-10} />
          </View>
        </GradientCard>
      )
    });
  }

  /**
   * A centered title for invitations that only appears if tue user has incoming invitations
   */
  function InvitationsTitle() {
    // Guard clauses:
    if (!currentUserManager)                                    { return; } // No current user
    if (currentUserManager.data.groupInvitations.length === 0)  { return; } // No invitations to render   

    // Return the title
    return <CenteredTitle text="Invitations" />;
  }

  return (
    <PageWrapper>
     <Modal
        animationType="slide"
        transparent={true}
        visible={createModalOpen}
        onRequestClose={() => {
          setCreateModalOpen(!createModalOpen);
        }}
      >
        <StyledModalContent>
          <CenteredTitle text="New Group" marginBottom={20} fontSize={20}/>
          <Entry placeholderText="Group Name" width="75%" value={newName} marginBottom={20} onChange={(text) => setNewName(text)}/>
          <StyledButton text="Create" onClick={handleCreate} />
        </StyledModalContent>
      </Modal>
      <CenteredTitle text="Groups" />
      <View display="flex" flexDirection="row" justifyContent="space-between" style={{width: "100%", marginBottom: 20}}>
        <SearchBarShort setSearch={(text) => setSearch(text)} />
        <AddButton onClick={() => setCreateModalOpen(true)}/>
      </View>
      <ScrollView style={{width: "100%"}} keyboardShouldPersistTaps="handled">
        { renderGroups() }
        <InvitationsTitle />
        { renderInvitations() }
      </ScrollView>
    </PageWrapper>
  )
}

/**
 * Component to render a detailed view of a group
 * @param {ReactNavigation} navigation navigation object from {@link Groups} 
 */
function DetailPage({navigation}) {

  // Get Context
  const { focus, setFocus } = useContext(FocusContext);
  const { currentUserManager } = useContext(CurrentUserContext);
  const { groupsData } = useContext(GroupsContext);
  const { transactionsData } = useContext(TransactionsContext);
  const { newTransactionData, setNewTransactionData } = useContext(NewTransactionContext);
  const { dark } = useContext(DarkContext);
  
  // Create states
  const [ search, setSearch ] = useState("");                       // Current value of search bar
  const [ currentGroupData, setCurrentGroupData ] = useState(null); // Data on the focued group
  const [ relationHistories, setRelationHistories ] = useState([]); // All histories in this group

  // Fetch group relations whenever the currentUserManager changes
  useEffect(getHistory, [currentUserManager]);
  // Fetch current whenever groupsData changes
  useEffect(getGroup, [groupsData]);

  /**
   * Get all UserRelationHistories related to this group and update {@link relationHistories} state
   */
  function getHistory() {
    // Guard clauses
    if (!currentUserManager) { return; } // No current user

    // Find all relation histories that have this group listed
    let newRelationHistories = [];
    // Make sure not to duplicate transactions
    let transactionsFound = [];
    for (const userId of Object.keys(currentUserManager.data.relations)) {
      for (const history of currentUserManager.data.relations[userId].history) {
        if (history.group === focus.group || Object.keys(history.settleGroups).includes(focus.group)) {
          if (!transactionsFound.includes(history.transaction)) {
            newRelationHistories.push(history);
            transactionsFound.push(history.transaction);
          }
        }
      }
    }
    // Sort them by date
    newRelationHistories.sort((a, b) => { return b.date - a.date; });
    setRelationHistories(newRelationHistories); // Set state
  }

  /**
   * Get data on this group and set {@link currentGroupData} state
   */
  function getGroup() {
    if (groupsData[focus.group]) {
      setCurrentGroupData(groupsData[focus.group]);
    }
  }

  /**
   * A component to show that you can invite users to this group. Only renders if the group is otherwise empty.
   */
  function InviteHint() {
    // Guard clauses:
    if (currentGroupData.users.length !== 1)        { return; } // This group has already had users added
    if (currentGroupData.transactions.length !== 0) { return; } // This group has already had transactions added

    return (
      <Pressable display="flex" android_ripple={{color: globalColors.greenAlpha}} flexDirection="column" alignItems="center" justifyContent="center" onPress={() => navigation.navigate("invite")}>
        <CenteredTitle text="Press" color={dark ? darkTheme.textSecondary : lightTheme.textSecondary}/>
        <Image source={dark ? require("../assets/images/PersonAddHintDark.png") : require("../assets/images/PersonAddHintLight.png")} style={{width: 40, height: 40}} />
        <CenteredTitle text="to invite your friends" color={dark ? darkTheme.textSecondary : lightTheme.textSecondary}/>
      </Pressable>
    )
  }

  /**
   * Component for letting users know how to make a transcations (only if this group has none)
   */
  function TransactionHint() {
    // Guard clauses:
    if (currentGroupData.users.length < 2) { return; }          // No users to make a transaction for
    if (currentGroupData.transactions.length !== 0) { return; } // There are already transactions in this group

    return (
      <Pressable display="flex" android_ripple={{color: globalColors.greenAlpha}} flexDirection="column" alignItems="center" justifyContent="center" onPress={handleNewTransactionClick}>
        <CenteredTitle text="Press" color={dark ? darkTheme.textSecondary : lightTheme.textSecondary}/>
        <Image source={dark ? require("../assets/images/NewTransactionHintDark.png") : require("../assets/images/NewTransactionHintLight.png")} style={{width: 40, height: 40}} />
        <CenteredTitle text="to add a transaction" color={dark ? darkTheme.textSecondary : lightTheme.textSecondary}/>
      </Pressable>
    )
  }

  /**
   * Create a new transaction with this group and naviagate to new transcation amount entry screen
   */
  function handleNewTransactionClick() {
    const newUsers = {};
    for (const u of currentGroupData.users) {
      newUsers[u] =  {
        id: u,
        paid: false,
        split: true,
        paidManual: null,
        splitManual: null,
      };
    }
    newUsers[currentUserManager.documentId] = {
      id: currentUserManager.documentId,
      paid: true,
      split: true,
      paidManual: null,
      splitManual: null,
    };
    setNewTransactionData({
      users: newUsers,
      group: focus.group,
      total: null,
      legalType: legalCurrencies.USD,
      emojiType: emojiCurrencies.BEER,
      currencyMenuOpen: false,
      currencyLegal: true,
      split: "even",
      splitPercent: false,
      paidBy: "even",
      paidByPercent: false,
      title: null,
      isIOU: false,
      firstPage: false,
      paidByModalState: {
        evenPayers: [currentUserManager.documentId],
        manualValues: {},
        percent: false,
      },
      splitModalState: {
        evenSplitters: currentGroupData.users,
        manualValues: {},
        percent: false,
      }
    });
    navigation.navigate("New Transaction", {screen: "amount-entry"});
  }

  /**
   * Leave this group and update both currentUser + group's documents
   */
  function leaveGroup() {
    const groupManager = DBManager.getGroupManager(focus.group);
    groupManager.removeUser(currentUserManager.documentId);
    currentUserManager.removeGroup(focus.group);
    if (currentGroupData.users.length === 1) {
      groupManager.deleteDocument();
    } else {
      groupManager.push();
    }
    currentUserManager.push();
    navigation.navigate("list");
  }

  /**
   * Render GradientCards for each relation history
   */
  function renderHistory() {

    // Map histories
    return relationHistories.map((history, index) => {
      // Guard clauses:
      if (!historyInSearch()) { return; } // History filtered out by search

      /**
       * Set focus and redirect to transaction detail
       */
      function goToTransaction() {
        // Update focus
        const newFocus = {...focus};
        newFocus.transaction = history.transaction;
        setFocus(newFocus);
        // Navigate
        navigation.navigate("transaction");
      }

      /* Get balance truncated at 2 decimals */
      const bal = history.amount.toFixed(2);

      /**
       * Get the gradient by balance sign
       * @returns gradient key
       */
      function getGradient() {
        if (bal > 0) {
          return "green";
        }
        if (bal < 0) {
          return "red";
        }
        return "white";
      }

      /**
       * Get whether or not this history is within search
       * @returns boolean in search
       */
      function historyInSearch() {
        const simplifiedTitle = history.transactionTitle.toLocaleLowerCase().replace(" ", "");
        const simplifiedSearch = search.toLocaleLowerCase().replace(" ", "");
        return simplifiedTitle.includes(simplifiedSearch);
      }

      return (
        <View key={index} display="flex" flexDirection="row" alignItems="center" justifyContent="center">
          { !history.group && <Image source={dark ? require("../assets/images/HandshakeDark.png") : require("../assets/images/HandshakeLight.png")} style={{height: 20, width: 20, marginHorizontal: 10}} /> }
          <GradientCard gradient={getGradient()} onClick={goToTransaction} selected={!history.group}>
            <View pointerEvents="none" display="flex" flexDirection="column" alignItems="flex-start">
              <View pointerEvents="none" display="flex" flexDirection="row" alignItems="center" justifyContent="flex-start">
                { history.group && <Image source={dark ? require("../assets/images/GroupsUnselected.png") : require("../assets/images/GroupsUnselectedLight.png")} style={{height: 20, width: 20}} /> }
                <StyledText text={history.transactionTitle} fontSize={14} marginLeft={history.group ? 10 : 0} onClick={goToTransaction} />
              </View>
              <StyledText text={getDateString(history.date)} fontSize={12} color={dark ? darkTheme.textSecondary : lightTheme.textSecondary} onClick={goToTransaction} />
            </View>
            <View pointerEvents="none" display="flex" flexDirection="column" alignItems="flex-end" justifyContent="space-between" >
              { legacyGroupDetail && history.group  && <TransactionLabel current={true} transaction={transactionsData[history.transaction]} /> }
              { legacyGroupDetail && !history.group  && <RelationHistoryLabel group={focus.group} history={history}/> }
              { !legacyGroupDetail && <GroupRelationAmounts transaction={history.transaction} /> } 
            </View>
          </GradientCard>
        </View>
      )
    })
  }

  /** Size of avatars in this group based on number of users */
  const avatarSize = 100 - (currentGroupData ? currentGroupData.users.length * 5 : 0);
  /** Avatar margin in this group based on number of users */
  const avatarMargin =  (avatarSize/6);

  // So long as we have a currentUser, currentGroup, and data on that group
  return (groupsData[focus.group] && currentGroupData && currentUserManager && 
    <ScrollPage>
      <CardWrapper display="flex" flexDirection="column" justifyContent="center" alignItems="center" marginBottom={10}>  
        <CenteredTitle text={currentGroupData.name} fontSize={24}/>
        <AvatarList users={currentGroupData ? currentGroupData.users : []} size={avatarSize} marginLeft={-1 * avatarMargin}/>
        <GroupLabel group={{id: focus.group}} fontSize={30}/>
        <EmojiBar group={{id: focus.group}} justifyContent="center" size="large" marginTop={20} marginBottom={20} />
      </CardWrapper>
      <TrayWrapper>
        <NewTransactionPill onClick={handleNewTransactionClick}/>
        <PersonAddPill onClick={() => navigation.navigate("invite")}/>
        <SettingsPill onClick={() => navigation.navigate("settings")}/>
        <LeaveGroupPill onClick={() => 
          Alert.alert(
            "Leave Group?", 
            `Leave ${currentGroupData.name}?`, 
            [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Leave Group',
                onPress: () => leaveGroup(),
                style: 'destructive',
              },
            ],
          )}
        />
      </TrayWrapper>
      <View display="flex" flexDirection="row" justifyContent="space-between" alignItems="center" style={{width: "100%"}} size="large">
        <SearchBarFull setSearch={(text) => setSearch(text)} />
      </View>
      <View style={{marginTop: 20, width: "100%"}} keyboardShouldPersistTaps="handled">
        { renderHistory() }
        <TransactionHint />
        <InviteHint />
      </View>
    </ScrollPage>      
  )
}

/**
 * Component to edit focused group settings 
 * @param {ReactNavigation} navigation navigation object from {@link Groups}
 */
function Settings({navigation}) {

  // Get context
  const { focus } = useContext(FocusContext);
  const { currentUserManager } = useContext(CurrentUserContext);
  const { groupsData } = useContext(GroupsContext);
  const { usersData } = useContext(UsersContext);
  
  // Make states
  const [ currentGroupData, setCurrentGroupData ] = useState(null); // Data on the current group
  const [ newName, setNewName ] = useState("");                     // New name to set group (if you want i guess)
  const [ familyMultipliers, setFamilyMultipliers ] = useState({}); // Value of family multipliers in this group (if applicable)

  // Get current group when groupsData changes
  useEffect(getGroup, [groupsData]);

  /**
   * Set {@link currentGroupData} state to {@link usersData} entry for current group
   */
  function getGroup() {
    if (groupsData[focus.group]) {
      setCurrentGroupData(groupsData[focus.group]);
      setFamilyMultipliers(groupsData[focus.group].familyMultipliers);
    }
  }

  /**
   * Change the name of this group on the database to the value of {@link newName} state
   */
  function changeName() {
    // Guard clauses:
    if (newName.length < 1) { return; } // No name to set 

    /** Actually go update the name lol */
    function confirmChange() {
      const groupManager = DBManager.getGroupManager(focus.group);
      groupManager.setName(newName);
      groupManager.push();
    }

    Alert.alert("Rename Group?", `Are you sure you want to rename this group to "${newName}"?`,
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Yes',
        onPress: () => confirmChange(),
        style: 'destructive',
      },
    ],)
  }

  /**
   * Toggle currentUser's mutedGroups for this group
   */
  function toggleMute() {
    if (currentUserManager.data.mutedGroups.includes(focus.group)) {
      currentUserManager.removeMutedGroup(focus.group);
    } else {
      currentUserManager.addMutedGroup(focus.group);
    }
    currentUserManager.push();
  }

  /**
   * Toggle family mode on this group
   */
  function toggleFamilyMode() {
    const groupManager = DBManager.getGroupManager(focus.group);
    if (currentGroupData.familyMode) {
      groupManager.setFamilyMode(false);
    } else {
      groupManager.setFamilyMode(true);
    }
    groupManager.push();
  }

  /**
   * Change the familyMultiplier for a user in this group
   * @param {number} amt new familyMultiplier for this user
   * @param {string} uid id of user to update familyMultiplier on
   */
  function handleMultiplierChange(amt, uid) {
    const newMult = {...familyMultipliers};
    newMult[uid] = parseInt(amt);
    if (amt.length < 1) {
      delete newMult[uid];
    }
    setFamilyMultipliers(newMult);
  }

  /**
   * Render cards for each familyMultiplier in this group
   */
  function renderFamilyMultipliers() {
    // Guard clauses:
    if (!currentGroupData.familyMode) { return; } // Family mode is off

    return currentGroupData.users.map((userId, index) => {
      return (
        <GradientCard gradient="white" key={index} onClick={() => {}}>
          <View 
            display="flex"
            flexDirection="row"
            style={{
              alignItems: "center",
            }}
          >
            <AvatarIcon src={userId === currentUserManager.documentId ? currentUserManager.data.personalData.pfpUrl : usersData[userId].personalData.pfpUrl} size={40}/>
            <StyledText text={userId === currentUserManager.documentId ? currentUserManager.data.personalData.displayName : usersData[userId].personalData.displayName} marginLeft={10}/>
          </View>
          <Entry numeric={true} width={100} placeholderText={`x ${currentGroupData.familyMultipliers[userId] ? currentGroupData.familyMultipliers[userId] : "1"}`} height={40} onChange={(text) => handleMultiplierChange(text, userId)} value={familyMultipliers[userId]}/>
        </GradientCard>
        )
    })
  }

  /**
   * Update familyMultiipliers in this group
   */
  function applyMultipilers() {
    const groupManager = DBManager.getGroupManager(focus.group);
    groupManager.setFamilyMultipliers(familyMultipliers);
    groupManager.push();
  }

  // So long as we have a currentUser, currentGroup, and data on that group
  return ( groupsData[focus.group] && currentGroupData && currentUserManager && 
    <ScrollPage>
      <CenteredTitle text={currentGroupData.name} fontSize={24}/>
      <CardWrapper display="flex" flexDirection="column" justifyContent="center" alignItems="center" marginBottom={10} paddingTop={20} paddingBottom={20}>  
        {currentGroupData.createdBy === currentUserManager.documentId && <Entry value={newName} placeholderText={currentGroupData.name} onChange={(text) => setNewName(text)}/>}
        {currentGroupData.createdBy === currentUserManager.documentId && <StyledButton text="Change Name" marginTop={20} onClick={changeName}/>}
        <Pressable display="flex" flexDirection="row" alignItems="center" justifyContent="center" marginTop={30} onPress={toggleMute} style={{padding: 5}}>
          <StyledCheckbox checked={currentUserManager.data.mutedGroups.includes(focus.group)} onChange={toggleMute}/>
          <StyledText text="Mute Group" marginLeft={10}/>
        </Pressable>
        <Pressable display="flex" flexDirection="row" alignItems="center" justifyContent="center" marginTop={10} onPress={toggleFamilyMode} style={{padding: 5}}>
          <StyledCheckbox checked={currentGroupData.familyMode} onChange={toggleFamilyMode}/>
          <StyledText text="Family Mode" marginLeft={10}/>
        </Pressable>
        { renderFamilyMultipliers() }
        { currentGroupData.familyMode && <StyledButton text="Apply Multipliers" onClick={applyMultipilers}/> /* Render familyMultiplier title if there are multipliers on */ }
      </CardWrapper>
      <StyledButton text="Done" onClick={() => navigation.navigate("detail")} />
    </ScrollPage>      
  )
}

/**
 * Component to invite users to focused group
 * @param {ReactNavigation} navigation navigation object from {@link Groups}
 */
function InviteMembers({navigation}) {
  
  // Get context
  const { currentUserManager } = useContext(CurrentUserContext);
  const { usersData } = useContext(UsersContext);
  const { groupsData } = useContext(GroupsContext);
  const { dark } = useContext(DarkContext);
  const { focus } = useContext(FocusContext);
  
  // Create states
  const [ search, setSearch ] = useState("");                       // Value of current search
  const [ friends, setFriends ] = useState([]);                     // List of currentUser's friends
  const [ currentGroupData, setCurrentGroupData ] = useState(null); // Data on this current group

  // Update current group state on groupsData change
  useEffect(getGroup, [groupsData])
  // Update friends on usersData change
  useEffect(getFriends, [usersData]);

  /**
   * Update {@link currentGroupData} from {@link groupsData}
   */
  function getGroup() {
    if (groupsData[focus.group]) {
      setCurrentGroupData(groupsData[focus.group]);
    }
  }
  
  /**
   * Get all of the current user's friends
   */
  function getFriends() {
    // Guard clauses:
    if (!currentUserManager) { return; } // No current user

    // Get all friends
    let newFriends = [];
    for (const userId of Object.keys(usersData)) {
      if (currentUserManager.data.friends.includes(userId)) {
        newFriends.push(userId);
      }
    }
    // Set state
    setFriends(newFriends);
  }

  /**
   * Render GradientCards for all of the user's friends
   */
  function renderFriends() {
    // Guard clauses:
    if (!currentUserManager) { return; } // No current user

    // Map friends
    return friends.map((friendId, index) => {
      // Guard clauses:
      if (!currentUserManager.data.friends.includes(friendId))  { return; } // This isn't a friend of currentUser
      if (!usersData[friendId])                                 { return; } // No data on this user

      /**
       * Get green gradient if user is in group or already invited, othwerise white
       * @returns gradient key
       */
      function getGradient() {
        if (currentGroupData.users.includes(friendId)) {
          return "green";
        }
        if (currentGroupData.invitedUsers.includes(friendId)) {
          return "green";
        }
        return "white";
      }

      /**
       * Invite a user and update group + invite target's documents
       * @async
       */
      async function inviteUser() {
        // Guard clauses:
        if (currentGroupData.users.includes(friendId)) { return; } // This user is already in the group

        const friendManager = DBManager.getUserManager(friendId);
        const groupManager = DBManager.getGroupManager(focus.group);
        if (currentGroupData.invitedUsers.includes(friendId)) {
          // Undo the group invite if they're already invited
          await friendManager.fetchData();
          const newNotifs = friendManager.data.notifications.filter(n => (n.type !== notificationTypes.INCOMINGGROUPINVITE) || (n.target !== focus.group));
          friendManager.setNotifications(newNotifs);
          friendManager.removeGroupInvitation(focus.group);
          groupManager.removeInvitedUser(friendId);
          friendManager.push();
          groupManager.push();
          return;
        }
        // Create a group invite
        friendManager.addGroupInvitation(focus.group);
        const notif = NotificationFactory.createIncomingGroupInvite(currentGroupData.name, focus.group, currentUserManager.documentId);
        friendManager.addNotification(notif);
        groupManager.addInvitedUser(friendId);
        friendManager.push();
        groupManager.push();
        return;
      }

      /**
       * Get right side text for whether or not invite is pending, unsent, or user is in group
       * @returns invite status string
       */
      function getInviteText() {
        if (currentGroupData.users.includes(friendId)) {
          return "Joined";
        }
        if (currentGroupData.invitedUsers.includes(friendId)) {
          return "Pending...";
        }
        return "Invite";
      }

      /**
       * Get text color based on whether or not user is in group
       * @returns color key
       */
      function getColor() {
        if (currentGroupData.users.includes(friendId)) {
          return dark ? darkTheme.textPrimary : lightTheme.textPrimary;
        }
        return dark ? darkTheme.textSecondary : lightTheme.textSecondary;
      }

      return (
        <GradientCard key={index} gradient={getGradient()} selected={currentGroupData.users.includes(friendId)} onClick={inviteUser}>
            <View 
            display="flex"
            pointerEvents="none"
            flexDirection="row"
            JustifyContent="start">
              <AvatarIcon id={friendId} size={40} marginRight={10}/>
              <StyledText text={usersData[friendId].personalData.displayName} onClick={inviteUser}/>
            </View>
            <StyledText color={getColor()} text={getInviteText()} onClick={inviteUser}/>
        </GradientCard>
      )
    })
  }

  // So long as there's a currentUser and currentGroupData, render settings page
  return ( currentUserManager && currentGroupData && 
    <PageWrapper justifyContent="space-between">
      <CenteredTitle text={`Invite Friends: ${currentGroupData.name}`} />
      <SearchBarFull setSearch={setSearch} />
      <ListScroll>
        <CenteredTitle text="Friends" />
        { currentUserManager.data.friends.length === 0 && <CenteredTitle text="You don't have any friends." fontSize={14} color={dark ? darkTheme.textSecondary : lightTheme.textSecondary} /> }
        { renderFriends() }
      </ListScroll>
    </PageWrapper>
  )
}