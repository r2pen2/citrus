// Library Imports
import { useContext, useEffect, useState, } from "react";
import { Keyboard, Modal, Pressable, View, } from "react-native";
import { ScrollView, } from "react-native-gesture-handler";
import { createStackNavigator, } from "@react-navigation/stack";

// Context Imports
import { 
  CurrentUserContext, 
  FocusContext, 
  GroupsContext, 
  NewTransactionContext, 
  TransactionsContext, 
  UsersContext, 
} from "../Context";

// Component Imports
import { AvatarIcon, AvatarList, } from "../components/Avatar";
import { CurrencyLegalButton, CurrencyTypeButton, StyledButton, StyledCheckbox, DropDownButton, } from "../components/Button";
import { GradientCard, } from "../components/Card";
import { Entry, SearchBarFull, } from "../components/Input";
import { CenteredTitle, StyledText, } from "../components/Text";
import TransactionDetail from "../components/TransactionDetail";
import { CardWrapper, ListScroll, PageWrapper, StyledModalContent, } from "../components/Wrapper";

// Api Imports
import { CurrencyManager, } from "../api/currency";
import { DBManager, UserRelationHistory, } from "../api/dbManager";
import { emojiCurrencies, legalCurrencies, } from "../api/enum";

// Style Imports
import { globalColors, } from "../assets/styles";

/**
 * NewTransaction Tab content consisting of a stack navigator. Contains a the {@link AddPeople} screen, 
 * {@link AmountEntry} screen, {@link TransactionDetail} screen.
 * details after creation.
 * @param {ReactNavigation.Navigation} navigation Unused navigation object from MainTabs
 */
export default function NewTransaction({navigation}) {

  // Create stack to render screens in
  const NewTransactionStack = createStackNavigator();

  // Return navigator with screens populated
  return (
    <NewTransactionStack.Navigator 
      initialRouteName={"add-people"} // Default to add-people screen
      screenOptions={{
        headerShown: false            // Disable the header (eww!)
      }}
    >
      <NewTransactionStack.Screen name="add-people"   component={AddPeople}         />
      <NewTransactionStack.Screen name="amount-entry" component={AmountEntry}       />
      <NewTransactionStack.Screen name="transaction"  component={TransactionDetail} />
    </NewTransactionStack.Navigator>
  )
}

/**
 * AddPeople screen for {@link NewTransaction} Tab. Displays a list of the current user's groups and friends.
 * Multiple friends or one group may be selected, activating the "Continue" button. When the continue
 * button is pressed, the user is brought to the {@link AmountEntry} screen.
 * @param {ReactNavigation.Navigation} navigation Navigation object from {@link NewTransaction} 
 */
function AddPeople({navigation}) {

  // Get app context
  const { newTransactionData, setNewTransactionData } = useContext(NewTransactionContext);
  const { currentUserManager } = useContext(CurrentUserContext);
  const { usersData } = useContext(UsersContext);
  const { groupsData } = useContext(GroupsContext);
  
  // Create states for this screen
  const [ search, setSearch ] = useState("");                 // {string} Current value of search bar
  const [ selectedGroup, setSelectedGroup ] = useState(null); // {string?} ID of group selcted for this transaction
  const [ selectedUsers, setSelectedUsers ] = useState([]);   // {List<string>} Ids of all users selected for this transaction
  const [ friends, setFriends ] = useState([]);               // {List<string>} Ids of the current user's friends (that have been loaded)
  const [ groups, setGroups ] = useState([]);                 // {List<string>} Ids of the current user's groups (that have been loaded)
  const [ keyboardOpen, setKeyboardOpen ] = useState(false);  // {boolean} Whether or not the keyboard is open (used to hide continue button while typing)
  
  // When usersData or currentUserManager update, fetch all of the current user's loaded friends
  useEffect(getFriends, [usersData, currentUserManager]);
  // When groupsData or currentUserManager update, fetch all of the current user's loaded groups
  useEffect(getGroups, [groupsData, currentUserManager]);
  // Set keyboardOpen state when keyboard shows or hides
  useEffect(getKeyboardState, []);

  /**
   * Update {@link friends} state with current user's loaded friends
   */
  function getFriends() {
    // Guard clauses: 
    if (!currentUserManager) { return; } // currentUserManager is null— panic!

    // Get all friends
    let newFriends = [];
    for (const userId of Object.keys(usersData)) {
      // For each user that we have data on
      if (currentUserManager.data.friends.includes(userId)) {
        // If they're a friend of the currentUser, add them to the list
        newFriends.push(userId);
      }
    }

    // Sort friends by displayName
    newFriends.sort((a, b) => { return usersData[a].personalData.displayName > usersData[b].personalData.displayName; });

    // Update friends state
    setFriends(newFriends);
  }

  /**
   * Update {@link groups} state with current user's loaded groups
   */
  function getGroups() {
    // Guard clauses: 
    if (!currentUserManager) { return; } // currentUserManager is null— panic!
    
    // Get all groups
    let newGroups = [];
    for (const groupId of Object.keys(groupsData)) {
      // For each group that we have data on
      if (currentUserManager.data.groups.includes(groupId)) {
        // If the currentUser blongs to this group,add it to the list
        newGroups.push(groupId);
      }
    }

    // Sort groups by name
    newGroups.sort((a, b) => { return groupsData[a].name > groupsData[b].name; });

    // Update groups state
    setGroups(newGroups);
  }

  /**
  * Update {@link keyboardOpen} state with whether or not keyboard is up
  */
  function getKeyboardState() {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardOpen(true); // or some other action
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardOpen(false); // or some other action
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }
    
  /**
   * Make sure that there's a current user and then render cards for each of the current user's groups
   */
  function renderGroups() {
    // Guard clauses: 
    if (!currentUserManager) { return; } // currentUserManager is null— panic!

    // Return a card for each loaded group
    return groups.map((groupId, index) => {
      // Guard clauses
      if (!groupsData[groupId]) { return; } // somehow we lost the group's data

      // Return the group's card
      return <AddPeopleGroupCard groupId={groupId} key={index} />;
    });
  }

  /**
   * Component for toggling a group in the {@link AddPeople} screen. Displays group only if data is
   * present and group is included in user's search
   * @param {string} groupId id of the group to render
   */
  function AddPeopleGroupCard({groupId}) {
    // Guard clauses:
    if (groupsData[groupId].users.length < 2) { return; } // This group only has one person in it! Don't display it.
    if (!groupInSearch())                     { return; } // Group is not within the constraints of the current search. Don't display it.
    
    /**
     * Determine whether or not this group is within the constraints of the current search
     * @returns {boolean} group in search or not
     */
    function groupInSearch() {
      // Set both search and group name to lowercase, then remove all spaces
      const searchReduced = search.toLocaleLowerCase().replace(" ", "");
      const groupNameReduced = groupsData[groupId].name.toLocaleLowerCase().replace(" ", ""); 
      return groupNameReduced.includes(searchReduced)
    }

    /**
     * When a group is clicked, either set it as the current group select all of it's
     * members or deselect it as the current group and clear selected users
     */
    function handleClick() {
      if (selectedGroup) {
        // There is a selected group
        if (selectedGroup === groupId) {
          // This group is the one selected! Deselect it and set selected users to an empty list.
          setSelectedGroup(null);
          setSelectedUsers([]);
        }
      } else {
        // There is no selected group. 
        setSelectedGroup(groupId); // Set selectedGroup to this group
        // Get a list of all users in the group that aren't the currentUser
        const newUsers = groupsData[groupId].users.filter(user => user !== currentUserManager.documentId);
        setSelectedUsers(newUsers); // Set the selectedUsers to this new list
      }
    }

    /**
     * Disable this card if there's a selected group, but it's not this one
     * @returns {boolean} disabled or not
     */
    function cardDisabled() {
      return (selectedGroup && (selectedGroup !== groupId));
    }

    /**
     * Display this card as selected if it represents the current group
     * @returns {boolean} selected or not
     */
    function cardSelected() {
      return selectedGroup === groupId;
    }

    // Render the card
    return (
      <GradientCard gradient="white" disabled={cardDisabled()} selected={cardSelected()} onClick={handleClick}>
        <AvatarList users={groupsData[groupId].users} size={40} marginRight={-10} />
        <StyledText text={groupsData[groupId].name} />
      </GradientCard>
    )
  }

  /**
   * Make sure that there's a current user and then render cards for each of the current user's friends
   * @returns 
   */
  function renderFriends() {
    // Guard clauses:
    if (!currentUserManager) { return; } // currentUserManager is null— panic!
    
    return friends.map((friendId, index) => {
      return <AddPeopleFriendCard key={index} friendId={friendId} />;
    })
  }

  /**
   * Component for toggling a user in the {@link AddPeople} screen. Displays user only if data is
   * present, the displayName matches the search, and user is included in currentUser's friends list
   * @param {string} groupId id of the group to render
   */
  function AddPeopleFriendCard({friendId}) {
    // Guard clauses:
    if (!currentUserManager.data.friends.includes(friendId))  { return; } // This isn't one of our friends
    if (!usersData[friendId])                                 { return; } // Somehow we lost this user's data
    if (!friendInSearch())                                    { return; } // Friend is not in search— don't display

    /**
     * Determine whether or not this user is within the constraints of the current search
     * @returns {boolean} user in search or not
     */
    function friendInSearch() {
      // Set both search and displayName to lowercase, then remove all spaces
      const simplifiedDisplayName = usersData[friendId].personalData.displayName.toLocaleLowerCase().replace(" ", "");
      const simplifiedSearch = search.toLocaleLowerCase().replace(" ", "");
      return simplifiedDisplayName.includes(simplifiedSearch)
    }
    
    /**
     * When a user is clicked, add them to the selectedUsers
     * so long as there is no selected group
     */
    function toggleSelectedUser() {
      // Guard clauses:
      if (selectedGroup) { return; } // There's a selected group! Don't do anything.

      if (selectedUsers.includes(friendId)) {
        // User is selected. Filter the list and remove this user
        const newSelectedUsers = selectedUsers.filter(uid => uid !== friendId);
        setSelectedUsers(newSelectedUsers);
      } else {
        // User is not selected. Create a new list including this user
        const newSelectedUsers = [];
        for (const user of selectedUsers) { // Clone list of newSelectedUsers
          newSelectedUsers.push(user);
        }
        newSelectedUsers.push(friendId); // Add this user
        setSelectedUsers(newSelectedUsers); // Set state
      }
  
      // User changed— let's reset newTransactionData
      // We do this because there's a chance the user was editing a transaction and then returned to this screen.
      // If the users in a transaction change, we're best off just restarting
      setNewTransactionData({
        users: {},                        // Empty map of user data
        group: null,                      // Set group to null
        total: null,                      // Set total to null
        legalType: legalCurrencies.USD,   // Default legalCurrency is USD
        emojiType: emojiCurrencies.BEER,  // Default emojiCurrency is BEER
        currencyLegal: true,              // Default to legal currency units
        currencyMenuOpen: false,          // The currency dropdown menu should be closed
        split: "even",                    // Default to an even split
        splitPercent: false,              // Default to not using percent for splitting
        paidBy: "even",                   // Default to even payment
        paidByPercent: false,             // Default to not using percent for payment
        title: null,                      // Set title to null
        isIOU: false,                     // Default to not being an IOU
        paidByModalState: {               // Create empty paidByModalState
          evenPayers: [],                 // -- We don't have any payers yet
          manualValues: {},               // -- Nobody has manually assigned payment values yet
          percent: false,                 // -- Default to not using percent for payment
        },
        splitModalState: {                // Create empty splitModalState
          evenSplitters: [],              // -- We don't have any splitters yet
          manualValues: {},               // -- Nobody has manually assigned split values yet
          percent: false,                 // -- Default to not using percent for split
        },  
      });
    }

    /**
     * Disable this card if there is a currently selected group
     * @returns {boolean} disabled or not
     */
    function cardDisabled() {
      return selectedGroup;
    }

    /**
     * Display the card as selected if it's in the selectedUsers and there is no selected group
     * @returns {boolean} selected or not
     */
    function cardSelected() {
      return selectedUsers.includes(friendId) && !selectedGroup;
    }

    // Render the card
    return (
      <GradientCard gradient="white" disabled={cardDisabled()} selected={cardSelected()} onClick={toggleSelectedUser}>
          <View 
            pointerEvents="none"
            display="flex"
            flexDirection="row"
            JustifyContent="start"
          >
            <AvatarIcon id={friendId} size={40} marginRight={10}/>
            <View display="flex" flexDirection="column" alignItems="flex-start" justifyContent="center">
              <StyledText text={usersData[friendId].personalData.displayName} />
            </View>
          </View>
          <StyledCheckbox checked={selectedUsers.includes(friendId)}/>
      </GradientCard>
    )
  }

  /**
   * Save data from selected users/group and move to {@link AmountEntry}
   */
  function moveToAmountScreen() {
    // Clone transactionData to make edits
    const newData = {...newTransactionData};
    newData.users = {}; // Create map of userIds to their profile in this new transaction
    newData.group = selectedGroup;    // Set the group (or null if selectedGroup is null)

    // Create lists for userIds of payers and splitters
    let splitterList = [];
    let payerList = [];

    for (const uid of selectedUsers) {
      // For everyone selected, create a user
      const newUser = {
        id: uid,
        paid: false,        // Default user to not having paid
        split: true,        // Default uset to being part of the split
        paidManual: null,   // No manual paid value yet
        splitManual: null,  // No manual split value yet
      };
      newData.users[uid] = newUser; // Add this user to map
      splitterList.push(uid);       // Add this user's ID to the list of people splitting the payment 
    }

    // Now add the currentUser to the users map
    const self = {
      id: currentUserManager.documentId,
      paid: true,           // Default to having paid
      split: true,          // Default to being part of the split
      paidManual: null,     // No manual paid value yet
      splitManual: null,    // No manual split value yet
    };
    newData.users[currentUserManager.documentId] = self;  // Add current user to map
    payerList.push(currentUserManager.documentId);        // Add current user to payersList
    splitterList.push(currentUserManager.documentId);     // Add current user to splittersList

    // Create default modal states
    newData.paidByModalState = {
      evenPayers: payerList,        // People who paid evenly (defaulted to all payers / just the currentUser)
      manualValues: {},             // Init a map for storing manual paid values (if needed)
      percent: false,               // Whether or not payers paid by percent (defaulted to false)
    };
    newData.splitModalState = {
      evenSplitters: splitterList,  // People who split evenly (defaulted to all users)
      manualValues: {},             // Init a map for storing manual split values (if needed)
      percent: false,               // Whether or not to split by percent (defaulted to false)
    };
    
    setNewTransactionData(newData);       // Set state
    navigation.navigate("amount-entry");  // Navigate to amount-entry screen
  }

  /**
   * Enable the submit button if there is a selected user or a selected group
   * @returns {boolean} enabled or not
   */
  function continueEnabled() {
    return (selectedUsers.length >= 1) || selectedGroup;
  }

  // Render the AddPeople screen
  return (
    <PageWrapper justifyContent="space-between">
      <CenteredTitle text="New Transaction" />
      <SearchBarFull setSearch={setSearch} />
      <ListScroll>
        <CenteredTitle text="Groups" />
        { groups.length === 0 && <CenteredTitle text="You aren't in any valid groups." fontSize={14} color="secondary" /> }
        { renderGroups() }
        <CenteredTitle text="Friends" />
        { friends.length === 0 && <CenteredTitle text="You don't have any friends." fontSize={14} color="secondary" /> }
        { renderFriends() }
      </ListScroll>
      { !keyboardOpen && <StyledButton disabled={!continueEnabled()} text="Continue" onClick={moveToAmountScreen}/> }
    </PageWrapper>
  )
}

/**
 * Component for finalizing transaction data, then sending it to the database
 * @param {ReactNavigation} navigation navigation objecy from {@link NewTransaction} 
 */
function AmountEntry({navigation}) {

  // Get Context
  const { currentUserManager } = useContext(CurrentUserContext);
  const { usersData } = useContext(UsersContext);
  const { groupsData } = useContext(GroupsContext);
  const { focus, setFocus } = useContext(FocusContext);
  const { transactionsData, setTransactionsData } = useContext(TransactionsContext);
  const { newTransactionData, setNewTransactionData } = useContext(NewTransactionContext);
  
  // Create states
  const [ paidByModalOpen, setPaidByModalOpen ] = useState(false);  // Whether or not the paid by modal is open
  const [ splitModalOpen, setSplitModalOpen ] = useState(false);    // Whether or not the split with modal is open
  
  // Check if we have enough users for this transcation on component mount
  useEffect(checkUsers, []);
  
  /**
   * Navigate to the "add-people" screen if there's nobody in this transaction
   */
  function checkUsers() {
    if (newTransactionData.users.length < 2) {
      navigation.navigate("add-people");
    }
  }
  
  /**
   * Get the title of this transaction to display before the user enters their own
   * @returns title string
   */
  function getTitle() {
    if (newTransactionData.group) {
      return `Group: ${groupsData[newTransactionData.group].name}`;
    }
    if (Object.keys(newTransactionData.users).length > 2) {
      return "With Friends";
    }
    const otherUsers = Object.keys(newTransactionData.users).filter(uid => uid !== currentUserManager.documentId);
    if (otherUsers.length >= 1) {
      return `With ${usersData[otherUsers[0]].personalData.displayName}`;
    }
  }
  
  /**
   * Set the {@link NewTransactionData} to have a new title.
   * @param {string} text text from title entry
   */
  function handleTitleChange(text) {
    const newData = {...newTransactionData};
    if (newTransactionData.isIOU) {
      newData.title = "Handoff: " + text;
    } else {
      newData.title = text;
    }
    setNewTransactionData(newData);
  }

  /**
   * Set the {@link NewTransactionData} to have a new total
   * @param {string} text string representing new total amount
   */
  function handleTotalChange(text) {
    const newData = {...newTransactionData};
    const shortenedText = text.indexOf('.') > -1 ? text.substring(0, text.indexOf('.') + 3) : text;
    const newTotal = parseInt(shortenedText); 
    newData.total = newTotal;

    if (!newTransactionData.currencyLegal) {
      const canBeEven = newTotal % Object.keys(newTransactionData.users).length === 0;
      if (text.length > 0) {        
        newData.split = canBeEven ? "even" : "manual";
      }
    }
    setNewTransactionData(newData);
  }

  /**
   * Get text for the paid by dropdown button based on paidByModalState
   * @returns string for paid by button
   */
  function getPaidByText() {
    let paidUsers = 0;
    for (const u of Object.values(newTransactionData.users)) {
      if (u.paid) {
        paidUsers++;
      }
    }

    if (paidUsers === 1) {
      return newTransactionData.users[currentUserManager.documentId].paid ? "You" : "Someone Else";
    }
    return `${paidUsers} People`;
  }

  /**
   * Get text for the split by dropdown button based on splitModalState
   * @returns string for split by button
   */
  function getSplitText() {
    if (newTransactionData.isIOU) {
      return "IOU";
    }

    let splitters = 0;
    for (const user of Object.values(newTransactionData.users)) {
      if (user.split) {
        splitters++;
      }
    }

    if (newTransactionData.split === "even") {
      return `Even${splitters !== Object.keys(newTransactionData.users).length ? ` (${splitters}/${Object.keys(newTransactionData.users).length})` : ""}`;
    }
    return `Manual${splitters !== Object.keys(newTransactionData.users).length ? ` (${splitters}/${Object.keys(newTransactionData.users).length})` : ""}`;
  }

  /**
   * Set paid by string in {@link NewTransactionData}
   * @param {string} newValue "even" or "manual" 
   */
  function setPaidBy(newValue) {
    const newData = {...newTransactionData};
    newData.paidBy = newValue;
    setNewTransactionData(newData);
  }

  /**
   * Set spkit string in {@link NewTransactionData}
   * @param {string} newValue "even", "manual", or "IOU" 
   */
  function setSplitWith(newValue) {
    const newData = {...newTransactionData};
    newData.split = newValue;
    setNewTransactionData(newData);
  }

  /**
   * Render a GradientCard for each of the users in the paidByModal
   */
  function renderPaidByUsers() {

    /**
     * Toggle whether or not a user is included in an even paidBy
     * @param {string} uid id of user to toggle 
     */
    function togglePaidEven(uid) {
      const newState = {...newTransactionData};
      let newList = [];
      if (newTransactionData.paidByModalState.evenPayers.includes(uid)) {
        newList = newTransactionData.paidByModalState.evenPayers.filter(u => u != uid);
      } else {
        for (const u of newTransactionData.paidByModalState.evenPayers) {
          newList.push(u);
        }
        newList.push(uid);
      }
      newState.paidByModalState.evenPayers = newList;
      setNewTransactionData(newState);
    }

    /**
     * Set the manual paid by amount of a user
     * @param {string} text string representation of new amount
     * @param {string} uid id of user to edit manual amount on 
     */
    function handleManualAmountChange(text, uid) {
      const newState = {...newTransactionData};
      if (text.length > 0) {
        newState.paidByModalState.manualValues[uid] = parseInt(text);
      } else {
        delete newState.paidByModalState.manualValues[uid];
      }
      setNewTransactionData(newState);
    }

    /**
     * Get the placeholder string for any manual amount based on the {@link NewTransactionData} currency
     * @returns placeholder string
     */
    function getPaidByManualPlaceholder() {
      if (newTransactionData.paidByModalState.percent) {
        return "0%";
      }
      return newTransactionData.currencyLegal ? "$0.00" : "x 0";
    }

    if (newTransactionData.paidBy === "even") { 
      // This is an even split
      return Object.keys(newTransactionData.users).map((userId, index) => {
        return (
          <GradientCard gradient="white" key={index} onClick={() => togglePaidEven(userId)} selected={newTransactionData.paidByModalState.evenPayers.includes(userId)}>
            <View 
              display="flex"
              flexDirection="row"
              style={{
                alignItems: "center"
              }}
            >
              <AvatarIcon 
                src={userId === currentUserManager.documentId ? currentUserManager.data.personalData.pfpUrl : usersData[userId].personalData.pfpUrl} 
                size={40}
              />
              <StyledText 
                text={userId === currentUserManager.documentId ? currentUserManager.data.personalData.displayName : usersData[userId].personalData.displayName} 
                marginLeft={10} 
                onClick={() => togglePaidEven(userId)}
              />
            </View>
            <StyledCheckbox checked={newTransactionData.paidByModalState.evenPayers.includes(userId)} onChange={() => togglePaidEven(userId)} />
          </GradientCard>
        )
      })
    }

    // This is a manual split
    return Object.keys(newTransactionData.users).map((userId, index) => {
      return (
        <GradientCard gradient="white" key={index} onClick={() => togglePaidEven(userId)}>
          <View 
            display="flex"
            flexDirection="row"
            style={{
              alignItems: "center",
            }}
          >
            <AvatarIcon 
              src={userId === currentUserManager.documentId ? currentUserManager.data.personalData.pfpUrl : usersData[userId].personalData.pfpUrl} 
              size={40}
            />
            <StyledText 
              text={userId === currentUserManager.documentId ? currentUserManager.data.personalData.displayName : usersData[userId].personalData.displayName} 
              marginLeft={10}
            />
          </View>
          <Entry 
            numeric={true} 
            width={100} 
            placeholderText={getPaidByManualPlaceholder()} 
            height={40} 
            onChange={(text) => handleManualAmountChange(text, userId)} 
            value={newTransactionData.paidByModalState.manualValues[userId] ? ("" + newTransactionData.paidByModalState.manualValues[userId]) : ""}
          />
        </GradientCard>
      )
    })
  }

  function renderSplitUsers() {

    /**
     * Toggle whether or not a user is included in an even split
     * @param {string} uid id of user to toggle 
     */
    function toggleSplitEven(uid) {
      const newState = {...newTransactionData};
      let newList = [];
      if (newTransactionData.splitModalState.evenSplitters.includes(uid)) {
        newList = newTransactionData.splitModalState.evenSplitters.filter(u => u != uid);
      } else {
        for (const u of newTransactionData.splitModalState.evenSplitters) {
          newList.push(u);
        }
        newList.push(uid);
      }
      newState.splitModalState.evenSplitters = newList;
      setNewTransactionData(newState);
    }

    /**
     * Set the manual split amount of a user
     * @param {string} text string representation of new amount
     * @param {string} uid id of user to edit manual amount on 
     */
    function handleManualAmountChange(text, uid) {
      const newState = {...newTransactionData};
      if (text.length > 0) {
        newState.splitModalState.manualValues[uid] = parseInt(text);
      } else {
        delete newState.splitModalState.manualValues[uid];
      }
      setNewTransactionData(newState);
    }

    /**
     * Get the placeholder string for any manual amount based on the {@link NewTransactionData} currency
     * @returns placeholder string
     */
    function getSplitManualPlaceholder() {
      if (newTransactionData.splitModalState.percent) {
        return "0%";
      }
      return newTransactionData.currencyLegal ? "$0.00" : "x 0";
    }

    if (newTransactionData.split === "even") {
      // This is an even split
      return Object.keys(newTransactionData.users).map((userId, index) => {
        return (
          <GradientCard 
            gradient="white" 
            key={index} 
            onClick={() => toggleSplitEven(userId)} 
            selected={newTransactionData.splitModalState.evenSplitters.includes(userId)}
          >
            <View 
              display="flex"
              flexDirection="row"
              style={{
                alignItems: "center"
              }}
            >
              <AvatarIcon 
              src={userId === currentUserManager.documentId ? currentUserManager.data.personalData.pfpUrl : usersData[userId].personalData.pfpUrl} 
              size={40}
            />
              <StyledText 
              text={userId === currentUserManager.documentId ? currentUserManager.data.personalData.displayName : usersData[userId].personalData.displayName} 
              marginLeft={10} 
              onClick={() => toggleSplitEven(userId)}
            />
            </View>
            <StyledCheckbox checked={newTransactionData.splitModalState.evenSplitters.includes(userId)} onChange={() => toggleSplitEven(userId)} />
          </GradientCard>
        )
      })
    } 

    // This is a manual split
    return Object.keys(newTransactionData.users).map((userId, index) => {
      return (
        <GradientCard gradient="white" key={index} onClick={() => toggleSplitEven(userId)}>
          <View 
            display="flex"
            flexDirection="row"
            style={{
              alignItems: "center",
            }}
          >
            <AvatarIcon 
              src={userId === currentUserManager.documentId ? currentUserManager.data.personalData.pfpUrl : usersData[userId].personalData.pfpUrl} 
              size={40}
            />
            <StyledText 
            text={userId === currentUserManager.documentId ? currentUserManager.data.personalData.displayName : usersData[userId].personalData.displayName} 
            marginLeft={10} 
            onClick={() => toggleSplitEven(userId)}
          />
          </View>
          <Entry 
            numeric={true} 
            width={100} 
            placeholderText={getSplitManualPlaceholder()} 
            height={40} 
            onChange={(text) => handleManualAmountChange(text, userId)} 
            value={newTransactionData.splitModalState.manualValues[userId] ? ("" + newTransactionData.splitModalState.manualValues[userId]) : ""}
          />
        </GradientCard>
      )
    })
  }

  /**
   * Check paid users and split users to determine if this is a handoff/IOU
   * @return boolean transcation is IOU
   */
  function checkIOU() {
    let numPayers = 0;
    let numSplitters = 0;
    let payerId = "";
    let splitterId = "";
    for (const u of  Object.values(newTransactionData.users)) {
      if (u.paid) {
        numPayers++;
        payerId = u.id;
      }
      if (u.split) {
        numSplitters++;
        splitterId = u.id;
      }
    }

    const onlyTwoUsers = Object.keys(newTransactionData.users).length == 2;
    const onlyOnePayer = numPayers === 1;
    const onlyOneSplitter = numSplitters === 1;
    return onlyTwoUsers && onlyOnePayer && onlyOneSplitter && (payerId !== splitterId);
  }

  /**
   * Harvest data from the paidByModal and place it into the {@link NewTransactionData}
   */
  function confirmPaidByModal() {
    const newData = {...newTransactionData};
    if (newTransactionData.paidBy === "even") {
      for (const userId of Object.keys(newTransactionData.users)) {
        newData.users[userId].paid = newTransactionData.paidByModalState.evenPayers.includes(userId);
      }
    } else {
      for (const userId of Object.keys(newTransactionData.users)) {
        newData.users[userId].paidManual = Object.keys(newTransactionData.paidByModalState.manualValues).includes(userId) ? newTransactionData.paidByModalState.manualValues[userId] : 0;
        newData.users[userId].paid = Object.keys(newTransactionData.paidByModalState.manualValues).includes(userId);
      }
    }
    newData.paidByPercent = newTransactionData.paidByModalState.percent;
    newData.isIOU = checkIOU();
    // Set new data
    setNewTransactionData(newData);
    // Close the modal
    setPaidByModalOpen(false);
  }

  /**
   * Harvest data from the splitModal and place it into the {@link NewTransactionData}
   */
  function confirmSplitModal() {
    const newData = {...newTransactionData};

    if (newTransactionData.split === "even") {
      for (const userId of Object.keys(newTransactionData.users)) {
        newData.users[userId].split = newTransactionData.splitModalState.evenSplitters.includes(userId);
      }
    } else {
      for (const userId of Object.keys(newTransactionData.users)) {
        newData.users[userId].splitManual = Object.keys(newTransactionData.splitModalState.manualValues).includes(userId) ? newTransactionData.splitModalState.manualValues[userId] : 0;
        newData.users[userId].split = Object.keys(newTransactionData.splitModalState.manualValues).includes(userId);
      }
    }
    newData.splitPercent = newTransactionData.splitModalState.percent;
    newData.isIOU = checkIOU();
    // Set new data
    setNewTransactionData(newData);
    // Close the modal
    setSplitModalOpen(false);
  }

  /**
   * Decide whether or not the paidByModal's data is valid and can be pushed to {@link NewTransactionData}
   */
  function getPaidByModalConfirmEnable() {
    if (newTransactionData.paidBy === "even") {
      // We're even
      if (!newTransactionData.currencyLegal) {
        // If not legal currency, make sure the right number of people are selected to avoid fractions
        return newTransactionData.paidByModalState.evenPayers.length === 0 || (newTransactionData.total % newTransactionData.paidByModalState.evenPayers.length) !== 0;
      }
      // Just check that there are people selected, otherwise
      return newTransactionData.paidByModalState.evenPayers.length === 0;
    }

    // If there's a percent, check that percents add up to 100
    if (newTransactionData.paidByModalState.percent) {
      let manualTotal = 0;
      for (const manualValue of Object.values(newTransactionData.paidByModalState.manualValues)) {
        manualTotal += manualValue;
      }
      return manualTotal !== 100;
    }

    // Otherwise just check that manual totals add up to transaction total
    let manualTotal = 0;
    for (const manualValue of Object.values(newTransactionData.paidByModalState.manualValues)) {
      manualTotal += manualValue;
    }

    return manualTotal != newTransactionData.total;
  }

  /**
   * Decide whether or not the splitModal's data is valid and can be pushed to {@link NewTransactionData}
   */
  function getSplitModalConfirmEnable() {
    if (newTransactionData.split === "even") {
      // If we're even, just make sure that there are even splitters selected
      return newTransactionData.splitModalState.evenSplitters.length === 0;
    }

    // If percent, make sure percents add up to 100
    if (newTransactionData.splitModalState.percent) {
      let manualTotal = 0;
      for (const manualValue of Object.values(newTransactionData.splitModalState.manualValues)) {
        manualTotal += manualValue;
      }
      return manualTotal !== 100;
    }

    // If not, make sure the split ammount add up to the transaction total
    let manualTotal = 0;
    for (const manualValue of Object.values(newTransactionData.splitModalState.manualValues)) {
      manualTotal += manualValue;
    }

    return manualTotal != newTransactionData.total;
  }

  /**
   * Set {@link NewTransactionData} to open the paidByModal
   */
  function openPaidByModal() {
    const newState = {...newTransactionData};
    newState.paidByModalState.manualValues = {};
    for (const uid of Object.keys(newTransactionData.users)) {
      if (newTransactionData.users[uid].paidManual) {
        newState.paidByModalState.manualValues[uid] = newTransactionData.users[uid].paidManual;
      }
    }
    setNewTransactionData(newState);
    setPaidByModalOpen(true);
  }

  /**
   * Set {@link NewTransactionData} to open the splitModal
   */
  function openSplitModal() {
    const newState = {...newTransactionData};
    newState.splitModalState.manualValues = {};
    for (const uid of Object.keys(newTransactionData.users)) {
      if (newTransactionData.users[uid].splitManual) {
        newState.splitModalState.manualValues[uid] = newTransactionData.users[uid].splitManual;
      }
    }
    setNewTransactionData(newState);
    setSplitModalOpen(true);
  }

  /**
   * Get the text for the paid by confirm button by paidByModalState
   * @returns Paid by confirm string
   */
  function getPaidByConfirmText() {
    if (newTransactionData.paidBy === "even") {
      return "Confirm";
    }

    if (newTransactionData.paidByModalState.percent) {
      let manualTotal = 0;
      for (const manualValue of Object.values(newTransactionData.paidByModalState.manualValues)) {
        manualTotal += manualValue;
      }
      return `${manualTotal}%`;
    }

    let manualTotal = 0;
    for (const manualValue of Object.values(newTransactionData.paidByModalState.manualValues)) {
      manualTotal += manualValue;
    }
    return `${manualTotal} / ${newTransactionData.total}`;
  }

  /**
   * Get the text for the split confirm button by splitModalState
   * @returns split confirm string
   */
  function getSplitConfirmText() {
    if (newTransactionData.split === "even") {
      return "Confirm";
    }

    if (newTransactionData.splitModalState.percent) {
      let manualTotal = 0;
      for (const manualValue of Object.values(newTransactionData.splitModalState.manualValues)) {
        manualTotal += manualValue;
      }
      return `${manualTotal}%`;
    }

    let manualTotal = 0;
    for (const manualValue of Object.values(newTransactionData.splitModalState.manualValues)) {
      manualTotal += manualValue;
    }
    return `${manualTotal} / ${newTransactionData.total}`;
  }

  /**
   * Handle percent boolean change in paidByModal and update {@link NewTransactionData}
   */
  function handlePaidByPercentChange() {
    const newState = {...newTransactionData};
    newState.paidByModalState.percent = !newTransactionData.paidByModalState.percent;
    setNewTransactionData(newState);
  }

  /**
   * Handle percent boolean change in paidByModal and update {@link NewTransactionData}
   */
  function handleSplitPercentChange() {
    const newState = {...newTransactionData};
    newState.splitModalState.percent = !newTransactionData.splitModalState.percent;
    setNewTransactionData(newState);
  }

  /**
   * Handle isIOU change and update {@link NewTransactionData}
   * @param {boolean} val new IOU value
   */
  function setIOU(val) {
    const newData = {...newTransactionData};
    newData.isIOU = val;
    setNewTransactionData(newData);
  }

  /**
   * Check if all information in a new transaction is valid and ready to create database document
   * @returns boolean transaction valid
   */
  function checkTransactionValid() {
    const hasAmount = newTransactionData.total ? (newTransactionData.total > 0) : false;
    
    let hasPayer = false;
    let hasSplitter = false;
    let splitters = 0;
    // Find a splitter and a payer
    for (const u of Object.values(newTransactionData.users)) {
      if (u.paid) {
        hasPayer = true;
      }
      if (u.split) {
        hasSplitter = true;
        splitters++;
      }
    }
    
    const amountValid = (newTransactionData.total % splitters === 0) || (newTransactionData.currencyLegal);
    
    return hasAmount && hasPayer && hasSplitter && amountValid;
  }

  /**
   * Create the transaction on the database, update all users, update group, and navigate to the new transaction
   * @async
   */
  async function makeTransaction(tData) {
    
    // Create TransactionManager and set transaction data
    const transactionTitle = tData.title ? tData.title : getPlaceholderName();
    const transactionManager = DBManager.getTransactionManager();
    transactionManager.setAmount(tData.total);
    transactionManager.setCurrencyLegal(tData.currencyLegal);
    transactionManager.setCurrencyType(tData.currencyLegal ? tData.legalType : tData.emojiType);
    transactionManager.setCreatedBy(currentUserManager.documentId);
    transactionManager.setDate(new Date());
    transactionManager.setGroup(tData.group);
    transactionManager.setIsIOU(tData.isIOU);
    transactionManager.setTitle(transactionTitle);

    // Get everyone's debts
    let finalUsers = [];
    let volume = 0;
    let fronterId = null;
    let payerId = null;
    let splitters = 0;
    let payers = 0;
    for (const u of Object.values(tData.users)) {
      if (u.paid) {
        payers++;
        if (tData.isIOU && Object.keys(tData.users).length === 2) {          
          fronterId = u.id;
        }
      }
      if (u.split) {
        splitters++;
        if (tData.isIOU && Object.keys(tData.users).length === 2) { 
          payerId = u.id;
        }
      }
    }

    let multiplierTotal = 0;
    if (tData.group) {
      if (groupsData[tData.group]) {
        for (const mult of Object.values(groupsData[tData.group].familyMultipliers)) {
          multiplierTotal += mult;
        }
      }
    }
    
    for (const u of Object.values(tData.users)) {
        if (fronterId && payerId) { // This should only happen if this is an IOU
            if (u.id === fronterId) {
                u.splitManual = 0;
                u.paidManual = tData.total;
            } else {
                u.splitManual = tData.total;
                u.paidManual = 0;
            }
        } else {
            if (tData.paidBy === "even") {
                // Paid by was even: If this user is one of the payers, their paidByManualAmount will be 1/n the total price
                u.paidManual = u.paid ? (tData.total / payers) : 0;
            } else {
                // Might be percentage split
                if (tData.paidByPercent) {
                    u.paidManual = tData.total * (u.paidManual / 100);
                }
            }
            if (tData.split === "even") {
                // Do the same thing for split
                let splitAmt = 0;
                if (tData.group) {
                  if (groupsData[tData.group]) {
                    if (groupsData[tData.group].familyMode) {
                      splitAmt = (tData.total * (groupsData[tData.group].familyMultipliers[u.id] / multiplierTotal));
                    } else {
                      splitAmt = (tData.total / splitters);
                    }
                  } else {
                    splitAmt = (tData.total / splitters);
                  }
                } else {
                  splitAmt = (tData.total / splitters)
                }
                u.splitManual = u.split ? splitAmt : 0;
            } else {
                if (tData.splitPercent) {
                    u.splitManual = tData.total * (u.splitManual / 100);
                }
            }
        }
        u["delta"] = u.paidManual - u.splitManual; // Add delta field 
        finalUsers.push(u); // Push user to final array
        volume += Math.abs(u.delta);
    }
    volume = volume / 2;

      for (const u of finalUsers) {
          transactionManager.updateBalance(u.id, u.delta);
      }
      
      await transactionManager.push();
      const currencyKey = tData.currencyLegal ? tData.legalType : tData.emojiType;

      // Save transaction locally
      const newD = {...transactionsData};
      newD[transactionManager.documentId] = transactionManager.data;
      setTransactionsData(newD);

      let userManagers = {};

      // Now we create all of the relations
      for (const user1 of finalUsers) {
          if (user1.delta < 0) {
              // Delta_i is less than zero, so we owe all users who have a delta > 0 their share
              for (const user2 of finalUsers) {
                  if (user2.delta > 0) {
                      // Found a user who paid more than their share
                      // Create a relationHistory for user 1
                      const h1 = new UserRelationHistory();
                      h1.setAmount(user1.delta * (user2.delta / volume));
                      h1.setCurrencyLegal(tData.currencyLegal);
                      h1.setCurrencyType(tData.currencyLegal ? tData.legalType : tData.emojiType);
                      h1.setGroup(tData.group);
                      h1.setTransaction(transactionManager.documentId);
                      h1.setTransactionTitle(transactionTitle);
                      
                      // Create a relationHistory for user2
                      const h2 = new UserRelationHistory();
                      h2.setAmount((user1.delta * (user2.delta / volume)) * -1);
                      h2.setCurrencyLegal(tData.currencyLegal);
                      h2.setCurrencyType(tData.currencyLegal ? tData.legalType : tData.emojiType);
                      h2.setGroup(tData.group);
                      h2.setTransaction(transactionManager.documentId);
                      h2.setTransactionTitle(transactionTitle);

                      // Add this relation to both users
                      const user1Manager = userManagers[user1.id] ? userManagers[user1.id] : DBManager.getUserManager(user1.id, usersData[user1.id]);
                      const user2Manager = userManagers[user2.id] ? userManagers[user2.id] : DBManager.getUserManager(user2.id, usersData[user2.id]);
                      let user1Relation = await user1Manager.getRelationWithUser(user2.id);
                      let user2Relation = await user2Manager.getRelationWithUser(user1.id);

                      // Apply changes
                      user1Relation.addHistory(h1);
                      user2Relation.addHistory(h2);
                      user1Manager.updateRelation(user2.id, user1Relation);
                      user2Manager.updateRelation(user1.id, user2Relation);
                      userManagers[user1.id] = user1Manager;
                      userManagers[user2.id] = user2Manager;
                  }
              } 
          }
      }
      
      // Push all userManagers
      for (const manager of Object.values(userManagers)) {
        // Add transaction first!
        manager.addTransaction(transactionManager.documentId);
        manager.push();
      }

    if (tData.group) {
      // If there's a group, add data to group
      const groupManager = DBManager.getGroupManager(tData.group);
      groupManager.addTransaction(transactionManager.documentId);
      groupManager.push();
    }
    
    // Clear data
    setNewTransactionData({
      users: {},                        // Empty map of user data
      group: null,                      // Set group to null
      total: null,                      // Set total to null
      legalType: legalCurrencies.USD,   // Default legalCurrency is USD
      emojiType: emojiCurrencies.BEER,  // Default emojiCurrency is BEER
      currencyLegal: true,              // Default to legal currency units
      currencyMenuOpen: false,          // The currency dropdown menu should be closed
      split: "even",                    // Default to an even split
      splitPercent: false,              // Default to not using percent for splitting
      paidBy: "even",                   // Default to even payment
      paidByPercent: false,             // Default to not using percent for payment
      title: null,                      // Set title to null
      isIOU: false,                     // Default to not being an IOU
      paidByModalState: {               // Create empty paidByModalState
        evenPayers: [],                 // -- We don't have any payers yet
        manualValues: {},               // -- Nobody has manually assigned payment values yet
        percent: false,                 // -- Default to not using percent for payment
      },
      splitModalState: {                // Create empty splitModalState
        evenSplitters: [],              // -- We don't have any splitters yet
        manualValues: {},               // -- Nobody has manually assigned split values yet
        percent: false,                 // -- Default to not using percent for split
      },  
    });
    const newFocus = {...focus};
    newFocus.transaction = transactionManager.documentId;
    setFocus(newFocus);
    navigation.navigate("add-people");
    navigation.navigate("transaction");
  }

  /**
   * Get a name for this transaction by the isIOU, currency, and ammount
   * @returns name string
   */
  function getPlaceholderName() {
    if (!newTransactionData.total) {
      return newTransactionData.isIOU ? "New Handoff" : "New Transaction";
    }
    const currency = newTransactionData.currencyLegal ? newTransactionData.legalType : newTransactionData.emojiType;
    const currencyName = CurrencyManager.getCurrencyName(currency, newTransactionData.total !== 1);
    const capitalizedCurrency = currencyName.substring(0, 1).toUpperCase() + currencyName.substring(1);
    return `${newTransactionData.isIOU ? "Handoff: " : ""}${newTransactionData.total} ${capitalizedCurrency}`;
  }

  /**
   * Make the split button red if split weights are invalid
   * @returns boolean split red
   */
  function getSplitButtonRed() {
    let splitters = 0;
    for (const user of Object.keys(newTransactionData.users)) {
      if (newTransactionData.users[user].split) {
        splitters++;
      }
    }
    return (newTransactionData.total % splitters !== 0) && !newTransactionData.currencyLegal
  }

  // Render amount-entry screen so long as there is a currentUserManager
  return ( currentUserManager && 
    <PageWrapper justifyContent="space-between">
      <Modal
        animationType="slide"
        transparent={true}
        visible={paidByModalOpen}
        onRequestClose={() => {
          setPaidByModalOpen(!paidByModalOpen);
        }}
      >
        <StyledModalContent>
          <CenteredTitle text="Paid By" fontSize={20} />
          <View 
            display="flex" 
            flexDirection="row"
            style={{
              width: '100%',
              justifyContent: "space-evenly",
            }}
          >
            <StyledButton text="Even" width={150} selected={newTransactionData.paidBy === "even"} onClick={() => setPaidBy("even")}/>
            <StyledButton text="Manual" width={150} selected={newTransactionData.paidBy === "manual"} onClick={() => setPaidBy("manual")}/>
          </View>
            { newTransactionData.paidBy === "manual" && <Pressable display="flex" flexDirection="row" alignItems="center" style={{marginTop: 10}} onPress={handlePaidByPercentChange} android_ripple={{color: globalColors.greenAlpha, radius: 20}}>
            <StyledCheckbox onChange={handlePaidByPercentChange} checked={newTransactionData.paidByModalState.percent}/>
            <StyledText text="Percent" marginLeft={10} onClick={handlePaidByPercentChange} />
          </Pressable> }
          <ScrollView style={{width: '100%', paddingHorizontal: 20, marginTop: 10}}>
            { renderPaidByUsers() }
          </ScrollView>
          <StyledButton text={getPaidByConfirmText()} marginBottom={10} disabled={getPaidByModalConfirmEnable()} onClick={confirmPaidByModal}/>
        </StyledModalContent>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={splitModalOpen}
        onRequestClose={() => {
          setSplitModalOpen(!splitModalOpen);
        }}
      >
        <StyledModalContent>
          <CenteredTitle text="Split" fontSize={20} />
          <View 
            display="flex" 
            flexDirection="row"
            style={{
              width: '100%',
              justifyContent: "space-evenly",
            }}
          >
            <StyledButton text="Even" width={150} selected={newTransactionData.split === "even"} onClick={() => setSplitWith("even")}/>
            <StyledButton text="Manual" width={150} selected={newTransactionData.split === "manual"} onClick={() => setSplitWith("manual")}/>
          </View>
            { newTransactionData.split === "manual" && <Pressable display="flex" flexDirection="row" alignItems="center" style={{marginTop: 10, padding: 5}} onPress={handleSplitPercentChange} android_ripple={{color: globalColors.greenAlpha, radius: 20}}>
            <StyledCheckbox onChange={handleSplitPercentChange} checked={newTransactionData.splitModalState.percent}/>
            <StyledText text="Percent" marginLeft={10} onClick={handleSplitPercentChange}/>
          </Pressable> }
          <ScrollView style={{width: '100%', paddingHorizontal: 20, marginTop: 10}}>
            { renderSplitUsers() }
          </ScrollView>
          <StyledButton text={getSplitConfirmText()} marginBottom={10} disabled={getSplitModalConfirmEnable()} onClick={confirmSplitModal}/>
        </StyledModalContent>
      </Modal>
      
      <CenteredTitle text={newTransactionData.title ? `"${newTransactionData.title}"` : "New Transaction"} marginBottom={0}/>
      <CenteredTitle text={getTitle()} marginTop={-10}/>
      <AvatarList users={Object.keys(newTransactionData.users)} size={100} marginRight={-20} />
      <CardWrapper paddingTop={20} paddingBottom={20}>
        <Entry placeholderText={getPlaceholderName()} marginBottom={20} value={newTransactionData.title ? newTransactionData.title : ""} onChange={handleTitleChange} />
        <View display="flex" flexDirection="row">
          <CurrencyLegalButton />
          <Entry width="50%" marginLeft={20} marginBottom={20} marginRight={20} numeric={true} placeholderText={"Total"} value={newTransactionData.total ? "" + newTransactionData.total : ""} onChange={handleTotalChange} />
          <CurrencyTypeButton />
        </View>
        <View display="flex" flexDirection="row" alignItems="center" style={{marginTop: 10, opacity: newTransactionData.isIOU ? .5 : 1}}>
          <StyledText text="Paid By:" />
          <DropDownButton text={getPaidByText()} onClick={openPaidByModal} disabled={!newTransactionData.total}/>
        </View>
        <View display="flex" flexDirection="row" alignItems="center" style={{marginTop: 10, opacity: newTransactionData.isIOU ? .5 : 1}}>
          <StyledText text="Split:" />
          <DropDownButton text={getSplitText()} onClick={openSplitModal} disabled={!newTransactionData.total} red={getSplitButtonRed()}/>
        </View>
      </CardWrapper>
        { Object.keys(newTransactionData.users).length == 2 && (
          <Pressable display="flex" flexDirection="row" alignItems="center" onPress={() => setIOU(!newTransactionData.isIOU)} style={{padding: 5, marginTop: -10}}>
            <StyledCheckbox checked={newTransactionData.isIOU} onChange={() => setIOU(!newTransactionData.isIOU)}/>
            <StyledText text="This Is A Handoff" marginLeft={10} onClick={() => setIOU(!newTransactionData.isIOU)}/>
          </Pressable>
        ) }
      <StyledButton text="Submit" disabled={!checkTransactionValid()} onClick={() => makeTransaction(newTransactionData)}/>
    </PageWrapper>
  )
}