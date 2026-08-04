// Library Imports
import { useContext, useEffect, useState, } from "react";
import { Alert, Image, Keyboard, Pressable, View, } from "react-native";
import firestore from "@react-native-firebase/firestore";
import { ScrollView, } from "react-native-gesture-handler";
import { createStackNavigator, } from "@react-navigation/stack";

// Component Imports
import { AvatarIcon, AvatarList, } from "../components/Avatar";
import { AddButton, GroupAddPill, HandoffPill, NewTransactionPill, SettingsPill, StyledButton, StyledCheckbox, } from "../components/Button";
import { GradientCard, } from "../components/Card";
import { SearchBarFull, SearchBarShort, } from "../components/Input";
import { CenteredTitle, EmojiBar, RelationLabel, RelationHistoryLabel, StyledText, } from "../components/Text";
import TransactionDetail from "../components/TransactionDetail";
import { CardWrapper, ListScroll, PageWrapper, ScrollPage, TrayWrapper, } from "../components/Wrapper";

// Context Imports
import { CurrentUserContext, DarkContext, FocusContext, GroupsContext, NewTransactionContext, UsersContext, } from "../Context";

// API Imports
import { DBManager, UserRelation, } from "../api/dbManager";
import { emojiCurrencies, legalCurrencies, notificationTypes, } from "../api/enum";
import { NotificationFactory, } from "../api/notification";
import { getDateString, } from "../api/strings";

// Style Imports
import { darkTheme, globalColors, lightTheme } from "../assets/styles"

/**
 * Component to render for people page
 * @param {ReactNavigation} navigation navigation object from main tabs 
 */
export default function People({navigation}) {
  
  /**
   * Stack navigator for all screens in the People tab
   */
  const PeopleStack = createStackNavigator();

  return (
    <PeopleStack.Navigator
      initialRouteName="relations"
      screenOptions={{
        headerShown: false
      }}
    >
      <PeopleStack.Screen name="default"      component={RelationsPage} />
      <PeopleStack.Screen name="relations"    component={RelationsPage} />
      <PeopleStack.Screen name="add"          component={AddPage} />
      <PeopleStack.Screen name="detail"       component={DetailPage} />
      <PeopleStack.Screen name="settings"     component={SettingsPage} />
      <PeopleStack.Screen name="transaction"  component={TransactionDetail} />
      <PeopleStack.Screen name="invite"       component={InvitePage} />
    </PeopleStack.Navigator>     
  )
}

/**
 * Component for displaying a list of all currentUser's relations
 * @param {ReactNavigation} navigation navigation object from {@link People} tab Stack Navigator
 */
function RelationsPage({navigation}) {
  
  // Get context 
  const { usersData, setUsersData } = useContext(UsersContext);
  const { currentUserManager } = useContext(CurrentUserContext);
  const { focus, setFocus } = useContext(FocusContext);
  const { newTransactionData, setNewTransactionData } = useContext(NewTransactionContext);
  const { dark } = useContext(DarkContext);
  
  // Create states
  const [ requestUsers, setRequestUsers ] = useState([]);   // List of all users that have sent friend requests
  const [ search, setSearch ] = useState("");               // Current value of the search box
  const [ relations, setRelations ] = useState([]);         // List of all relations on the currentUser
  
  // Get user data when usersData or currentUserManager change
  useEffect(() => { getUserData(); }, [usersData, currentUserManager]);

  /**
   * Get data on all relation users and set the {@link relations} and {@link requestUsers} states
   * @async
   */
  async function getUserData() {
    // Guard clauses:
    if (!currentUserManager) { return; } // No current user

    // Get user's realations
    let sortedRelations = [];
    for (const userId of Object.keys(usersData)) {
      if (Object.keys(currentUserManager.data.relations).includes(userId)) {
        sortedRelations.push([userId, currentUserManager.data.relations[userId]]);
      }
    }
    // Sort relations by USD balance
    sortedRelations.sort(function(a, b) {
        return (b[1].balances["USD"] ? b[1].balances["USD"] : 0) - (a[1].balances["USD"] ? a[1].balances["USD"] : 0);
    });

    // Pick out all relations with a USD balance of 0
    let zeroRelations = sortedRelations.filter(r => (!r[1].balances["USD"]) || (r[1].balances["USD"] === 0));
    sortedRelations = sortedRelations.filter(r => (r[1].balances["USD"]) && (r[1].balances["USD"] !== 0));
    
    // Place zeros at the end
    sortedRelations = sortedRelations.concat(zeroRelations);

    // Set state
    setRelations(sortedRelations);

    // Find all users who sent a friend request
    let newRequestUsers = [];
    for (const userId of currentUserManager.data.incomingFriendRequests) {
      if (usersData[userId]) {
        // Harvest data from usersData if we have them saved
        const userData = usersData[userId];
        userData["id"] = userId;
        newRequestUsers.push(userData);
      } else {
        // Fetch data from DB if we don't have them saved
        const userManager = DBManager.getUserManager(userId);
        const userData = await userManager.fetchData();
        userData["id"] = userId;
        newRequestUsers.push(userData);
      }
      // Set state
      setRequestUsers(newRequestUsers);
    }
  }

  /** Indicator to render under relation on left swipe */
  const newTransactionSwipeIndicator = (
    <View display="flex" flexDirection="row" alignItems="center" justifyContent="flex-start" style={{width: "100%", paddingLeft: 20 }}>
      <Image source={dark ? require("../assets/images/AddButton.png") : require("../assets/images/AddButtonLight.png")} style={{width: 20, height: 20, borderWidth: 1, borderRadius: 15, borderColor: dark ? darkTheme.buttonBorder : lightTheme.buttonBorder}}/>
      <StyledText text="New Transaction" marginLeft={10} />
    </View>
  )

    /** Indicator to render under relation on right swipe */
  const handoffSwipeIndicator = (
    <View display="flex" flexDirection="row" alignItems="center" justifyContent="flex-end" style={{width: "100%", paddingLeft: 20 }}>
      <StyledText text="New Handoff" marginRight={10} />
      <Image source={dark ? require("../assets/images/HandoffDark.png") : require("../assets/images/HandoffLight.png")} style={{width: 20, height: 20}}/>
    </View>
  )

  /** 
   * Render all relations for current user from {@link relations} state 
   * */
  function renderRelations() {
    // Guard clauses
    if (!currentUserManager) { return; } // There is no current user manager
    
    // Map relations to GradientCards
    return relations.map((key, index) => {
      const userId = key[0];

      // Guard caluses:
      if (!usersData[userId])   { return; } // We don't have data on this user
      if (!userInSearch())      { return; } // User has been filtered out by search box

      
      /**
       * Get the right gradient for this relation (green if positive, red if negative, otherwise white)
       * @returns gradient key string
       */
      function getGradient() {
        if (currentUserManager.data.relations[userId].balances["USD"].toFixed(2) > 0) {
          return "green";
        }
        if (currentUserManager.data.relations[userId].balances["USD"].toFixed(2) < 0) {
          return "red";
        }
        return "white";
      }

      /**
       * Go to the user's detail page on click
       */
      function focusUser() {
        const newFocus = {...focus};
        newFocus.user = userId;
        setFocus(newFocus);
        navigation.navigate("detail");
      }

      /**
       * Get boolean whether or not current user is in the search
       * @returns user in search or not boolean
       */
      function userInSearch() {
        return usersData[userId].personalData.displayNameSearchable.includes(search.toLocaleLowerCase().replace(" ", ""));
      }

      /**
       * When new transaction button is clicked, create new transcation context and redirect to new transcation amount entry screen
       */
      function handleNewTransactionClick() {
        const newUsers = {};
        newUsers[userId] =  {
          id: userId,
          paid: false,
          split: true,
          paidManual: null,
          splitManual: null,
        };
        newUsers[currentUserManager.documentId] = {
          id: currentUserManager.documentId,
          paid: true,
          split: true,
          paidManual: null,
          splitManual: null,
        };
        setNewTransactionData({
          users: newUsers,
          group: null,
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
            evenSplitters: [currentUserManager.documentId, userId],
            manualValues: {},
            percent: false,
          }
        });
        navigation.navigate("New Transaction", {screen: "amount-entry"});
      }

      /**
       * Create a new handoff and navigate to new transaction amount entry screen
       */
      function handleHandoffClick() {
        const newUsers = {};
        newUsers[focus.user] =  {
          id: focus.user,
          paid: false,
          split: true,
          paidManual: null,
          splitManual: null,
        };
        newUsers[currentUserManager.documentId] = {
          id: currentUserManager.documentId,
          paid: true,
          split: true,
          paidManual: null,
          splitManual: null,
        };
        setNewTransactionData({
          users: newUsers,
          group: null,
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
          isIOU: true,
          firstPage: false,
          paidByModalState: {
            evenPayers: [currentUserManager.documentId],
            manualValues: {},
            percent: false,
          },
          splitModalState: {
            evenSplitters: [currentUserManager.documentId, focus.user],
            manualValues: {},
            percent: false,
          }
        });
        navigation.navigate("New Transaction", {screen: "amount-entry"});
      }

      /**
       * If the user is muted, return an indicator
       */
      function NotificationsOffIndicator() {
        // Guard clauses
        if (!currentUserManager.data.mutedUsers.includes(userId)) { return; } // This user is not muted

        return (
          <View style={{marginTop: -10, opacity: .2, display: "flex", alignItems: "center", justifyContent: "center"}}>
            <Image 
              source={dark ? require("../assets/images/NotificationOffIconDark.png") : require("../assets/images/NotificationOffIconLight.png")} 
              style={{
                width: 16, 
                height: 16,
              }}
            />
          </View>
        )
      }
      
      // Render the relation card
      return (
        <GradientCard key={index} gradient={getGradient()} onClick={focusUser} leftSwipeComponent={newTransactionSwipeIndicator} onLeftSwipe={handleNewTransactionClick} rightSwipeComponent={handoffSwipeIndicator} onRightSwipe={handleHandoffClick}>
          <View display="flex" flexDirection="row" alignItems="center">
            <AvatarIcon id={userId} />
            <View display="flex" flexDirection="column" alignItems="flex-start" justifyContent="space-between" onClick={focusUser}>
              <View display="flex" flexDirection="row" alignItems="center">
                <StyledText marginLeft={10} marginRight={5} marginBottom={10} text={usersData[userId].personalData.displayName} onClick={focusUser}/>
                <NotificationsOffIndicator />
              </View>
              <EmojiBar transform={[{translateY: 2}]} relation={currentUserManager.data.relations[userId]} onClick={focusUser}/>
            </View>
          </View>
          <RelationLabel relation={currentUserManager.data.relations[userId]} onClick={focusUser}/>
        </GradientCard>
      )
    })
  }

  /**
   * Render gradient cards for each of the current user's incoming friend requests
   */
  function renderInvites() {
    // Guard clauses:
    if (!currentUserManager) { return; } // There's no current user

    /** A component to display under the invitation on a left swipe */
    const declineSwipeIndicator = (
      <View display="flex" flexDirection="row" alignItems="center" justifyContent="flex-start" style={{width: "100%", paddingLeft: 20 }}>
        <Image source={dark ? require("../assets/images/TrashDark.png") : require("../assets/images/TrashLight.png")} style={{width: 20, height: 20}}/>
        <StyledText text="Decline Invitation" marginLeft={10} />
      </View>
    )
    
    // Map incoming invitations
    return requestUsers.map((user, index) => {
      
      /**
       * Declien a friend invite
       */
      function ignoreInvite() {
        currentUserManager.removeIncomingFriendRequest(user.id);  // Remove incoming
        const userManager = DBManager.getUserManager(user.id);
        userManager.removeOutgoingFriendRequest(currentUserManager.documentId); // Remove outgoing
        currentUserManager.push();  // Push
        userManager.push();         // Push
      }
      
      /**
       * Accept a friend invite
       * @async
       */
      async function acceptInvite() {
        // Get UserManagers
        const incomingFriendRequestSenderManager = DBManager.getUserManager(user.id);
        const incomingFriendRequestSenderNotif = NotificationFactory.createFriendRequestAccepted(currentUserManager.data.personalData.displayName, currentUserManager.documentId);
        // Handle friend add
        currentUserManager.addFriend(user.id);
        currentUserManager.removeIncomingFriendRequest(user.id);
        if (!currentUserManager.data.relations[user.id]) {
          // Add a relation if needed
          currentUserManager.updateRelation(user.id, new UserRelation());
        }
        const pseudoNotif = {
          type: notificationTypes.INCOMINGFRIENDREQUEST,
          target: user.id
        }
        currentUserManager.removeNotification(pseudoNotif);
        currentUserManager.push();  // Push
        // Update sender's manger to add friend and send them a notification
        await incomingFriendRequestSenderManager.fetchData();
        incomingFriendRequestSenderManager.addNotification(incomingFriendRequestSenderNotif);
        incomingFriendRequestSenderManager.addFriend(currentUserManager.documentId);
        incomingFriendRequestSenderManager.removeOutgoingFriendRequest(currentUserManager.documentId);
        if (!incomingFriendRequestSenderManager.data.relations[currentUserManager.documentId]) {
          // Add a relation if needed
          incomingFriendRequestSenderManager.updateRelation(currentUserManager.documentId, new UserRelation());
        }
        // Get new friend data and save it to usersData
        incomingFriendRequestSenderManager.push();
        const newUsersData = {...usersData};
        newUsersData[user.id] = incomingFriendRequestSenderManager.data;
        setUsersData(newUsersData);
      }

      /**
       * Display a popup allowing user to confirm accepting a friend request
       */
      function alertAcceptInvite() {
        Alert.alert(user.personalData.displayName, `Accept friend request?`, [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Add Friend',
            onPress: () => acceptInvite(),
            style: 'default',
          },
        ],)
      }

      // Render card
      return (
        <GradientCard key={index} gradient="white" leftSwipeComponent={declineSwipeIndicator} onLeftSwipe={ignoreInvite} onClick={alertAcceptInvite}>
          <View style={{flex: 2}} display="flex" flexDirection="row" justifyContent="flex-start" alignItems="center">
            <AvatarIcon src={user.personalData.pfpUrl} />
          </View>
          <View style={{flex: 8}} display="flex" flexDirection="row" alignItems="center" justifyContent="center">
            <StyledText text={`${user.personalData.displayName} wants to be your friend`} fontSize={14} />
          </View>
        </GradientCard>
      )
    })
  }

  /**
   * Component to introduce incoming friend requests if there are any
   */
  function FriendRequestsTitle() {
    // Guard clauses:
    if (!currentUserManager) { return; }                                          // No current user
    if (currentUserManager.data.incomingFriendRequests.length === 0) { return; }  // No friend requests!
    
    // Render title
    return <CenteredTitle text="Friend Requests" />;
  }

  return (
    <PageWrapper>
      <CenteredTitle text="People" />
      <View display="flex" flexDirection="row" justifyContent="space-between" style={{width: "100%"}}>
        <SearchBarShort setSearch={(text) => setSearch(text)} />
        <AddButton onClick={() => navigation.navigate("add")}/>
      </View>
      <ScrollView style={{marginTop: 20, width: "100%"}} keyboardShouldPersistTaps="handled">
        { renderRelations() }
        <FriendRequestsTitle />
        { renderInvites() }
      </ScrollView>
    </PageWrapper>      
  );
}

/**
 * Component for displaying friend adding page
 * @param {ReactNavigation} navigation navigation object from {@link People} tab Stack Navigator
 */
function AddPage({navigation}) {

  // Get Context
  const { dark } = useContext(DarkContext);
  const { currentUserManager } = useContext(CurrentUserContext);

  // Set up states
  const [ search, setSearch ] = useState([]);               // Keep track of the value of the search box
  const [ searchResults, setSearchResults ] = useState([]); // Keep track of all search results returned from DB

  /**
   * Render a Gradientcard for each of the results returned from DB query
   */
  function renderSearchResults() {
    // Guard clauses:
    if (!currentUserManager) { return; } // No current user

    // Map search results
    return searchResults.map((result, index) => {
      
      /**
       * Get the color of a result's gradient.
       * Green if incoming request or already friends. White otherwise.
       * @returns gradient key string
       */
      function getGradient() {
        if (currentUserManager.data.incomingFriendRequests.includes(result.documentId)) {
          return "green";
        }
        if (currentUserManager.data.friends.includes(result.documentId)) {
          return "green";
        }
        return "white";
      }

      /**
       * Get the right side text (pending, incoming request, already friends, or number of mutuals)
       * @returns right text string
       */
      function getRightText() {
        if (currentUserManager.data.outgoingFriendRequests.includes(result.documentId)) {
          return "Pending..."
        }
        if (currentUserManager.data.incomingFriendRequests.includes(result.documentId)) {
          return "Incoming Request";
        }
        if (currentUserManager.data.friends.includes(result.documentId)) {
          return "Friends ✓";
        }
        // Count the number of mutual friends
        let mutuals = 0;
        for (const friendId of currentUserManager.data.friends) {
          for (const otherPersonFriend of result.data.friends) {
            if (friendId === otherPersonFriend) {
              mutuals++;
            }
          }
        }
        return `${mutuals} mutual friend${mutuals != 1 ? "s" : ""}`;
      }

      /**
       * Get the color of the right text (green if already friends or incoming request, otherwise white)
       * @returns color string
       */
      function getRightColor() {
        if (currentUserManager.data.friends.includes(result.documentId)) {
          return globalColors.green;
        }
        if (currentUserManager.data.incomingFriendRequests.includes(result.documentId)) {
          return globalColors.green;
        }
        return dark ? darkTheme.textSecondary : lightTheme.textSecondary;
      }

      /**
       * Handle a search result click. Either add the friend, send a request, or do nothing
       * @async 
       */
      async function handleUserClick() {
        Keyboard.dismiss(); // Put the keyboard down no matter what
        // Guard clauses:
        if (currentUserManager.data.friends.includes(result.documentId))                { return; } // We're already friends
        if (currentUserManager.data.outgoingFriendRequests.includes(result.documentId)) { return; } // We already sent a request

        // Ok, handle the click
        if (currentUserManager.data.incomingFriendRequests.includes(result.documentId)) {
          // This person already wants to be out friend!
          // Accept the request
          currentUserManager.removeIncomingFriendRequest(result.documentId);
          currentUserManager.addFriend(result.documentId);
          currentUserManager.updateRelation(result.documentId, new UserRelation());
          result.removeOutgoingFriendRequest(currentUserManager.documentId);
          result.addFriend(currentUserManager.documentId);
          // Send a notification
          const notif = NotificationFactory.createFriendRequestAccepted(currentUserManager.data.personalData.displayName, currentUserManager.documentId);
          result.addNotification(notif);
          result.updateRelation(currentUserManager.documentId, new UserRelation());
          result.push();
          currentUserManager.push();
          return;
        }
        // Otherwise, we send a friend request
        currentUserManager.addOutgoingFriendRequest(result.documentId);
        const notif = NotificationFactory.createFriendInvitation(currentUserManager.data.personalData.displayName, currentUserManager.documentId);
        result.addNotification(notif);
        result.addIncomingFriendRequest(currentUserManager.documentId);
        currentUserManager.push();
        result.push();
      }

      // Render the card
      return (
      <GradientCard key={index} gradient={getGradient()} onClick={handleUserClick}>
        <View display="flex" flexDirection="row" alignItems="center">
          <AvatarIcon src={result.data.personalData.pfpUrl} />
          <StyledText marginLeft={10} text={result.data.personalData.displayName}/>
        </View>
        <StyledText text={getRightText()} color={getRightColor()} fontSize={14}/>
      </GradientCard>
      )
    })
  }

  /**
   * Set the {@link search} state with formatted search value
   */
  function handleSearchChange(text) {
    if (text.length < 1) {
      // No text. Remove results and return
      setSearchResults([])
      return;
    }
    // Remove spaces and caps
    let newSearch = text.toLowerCase().replace(" ", "");
    setSearch(newSearch);
  }

  /**
   * Query the database for matches in order of email, then phoneNumber, then displayName. If we find someone by email,
   * don't bother searching phone number. If we find someone by phone number, don't bother searching displayName.
   * Set {@link searchResults} state to returned users
   */
  async function executeSearch() {
    /** Create a query by displayName */
    const displayNameQuery = firestore().collection("users")
    .where('personalData.displayNameSearchable', '>=', search)
    .where('personalData.displayNameSearchable', '<=', search + '\uf8ff');
    
    /** Create a query by email */
    const emailQuery = firestore().collection("users")
    .where("personalData.email", "==", search);
    /** Create a query by phoneNumber */
    const phoneQuery = firestore().collection("users")
    .where("personalData.phoneNumber", "==", search);
    
    /** Create a list to save search results */
    let newResults = [];

    // Check email query
    const emailData = await emailQuery.get();
    if (emailData.docs.length > 0) {
      // We found a user by email!
      specificSearch = true;
      const userManager = DBManager.getUserManager(emailData.docs[0].id, emailData.docs[0].data());
      newResults.push(userManager);
      setSearchResults(newResults); // Set state
      return; // Stop searching
    }

    // Check phone query
    const phoneData = await phoneQuery.get();
    if (phoneData.docs.length > 0) {
      // We found a user by phone!
      specificSearch = true;
      const userManager = DBManager.getUserManager(phoneData.docs[0].id, phoneData.docs[0].data());
      newResults.push(userManager);
      setSearchResults(newResults); // Set state
      return; // Stop searching
    }

    // Check displayName query
    const displayNameData = await displayNameQuery.get();
    for (const doc of displayNameData.docs) {
      if (doc.id !== currentUserManager.documentId) {
        const userManager = DBManager.getUserManager(doc.id, doc.data());
        newResults.push(userManager); // Add all results
      }
    }
    setSearchResults(newResults); // Set displayName results
    return; // Stop searching
  }

  /**
   * Component to display a hint if the user has not searched for anyone yet
   */
  function SearchHint() {
    // Guard clauses:
    if (searchResults.length > 0) { return; } // We have results. Don't show hint

    // Render hint
    return <CenteredTitle text="Search and hit enter for results." color="secondary" />;
  }

  // Render the page
  return (
    <PageWrapper>
      <CenteredTitle text="Add Friends" />
      <View display="flex" flexDirection="row" justifyContent="space-between" alignItems="center" style={{width: "100%"}}>
        <SearchBarFull setSearch={handleSearchChange} onEnter={executeSearch} placeholder="Name, Phone Number, or Email" />
      </View>
      <ScrollView style={{marginTop: 20, width: "100%"}} keyboardShouldPersistTaps="handled">
        <SearchHint />
        { renderSearchResults() }
      </ScrollView>
    </PageWrapper>      
  )
}

/**
 * Component to display detailed information on a relation with a specific user
 * @param {ReactNavigation} navigation navigation object from {@link People} tab Stack Navigator
 * @returns 
 */
function DetailPage({navigation}) {

  // Get context
  const { dark } = useContext(DarkContext);
  const { usersData } = useContext(UsersContext);
  const { currentUserManager } = useContext(CurrentUserContext);
  const { focus, setFocus } = useContext(FocusContext);
  const { newTransactionData, setNewTransactionData } = useContext(NewTransactionContext)

  // Set up states
  const [search, setSearch] = useState(""); // Current value of search box

  /**
   * Render GradientCards for each of the UserRelationHistories in this UserRelation
   */
  function renderHistory() {
    // Map histories to GradientCards
    return currentUserManager.data.relations[focus.user].history.map((history, index) => {
      // Guard clauses
      if (!historyInSearch()) { return; } // This history is fiiltered out by search

      /**
       * Find out whether or not a history is included within the constraints of the current search
       * @returns boolean whether or not to display history
       */
      function historyInSearch() {
        const formattedTitle = history.transactionTitle.toLowerCase().replace(" ", "");
        const formattedSearch = search.toLowerCase().replace(" ", "");
        return formattedTitle.includes(formattedSearch);
      }
      
      /**
       * Get the color of the relation by the sign of the amount
       * @returns color string
       */
      function getGradient() {
        if (history.amount.toFixed(2) > 0) {
          return "green";
        }
        if (history.amount.toFixed(2) < 0) {
          return "red";
        }
        return "white";
      } 

      /**
       * Navigate to the transcation associated with this UserRelationHistory
       */
      function goToTranscation() {
        // Update focus
        const newFocus = {...focus};
        newFocus.transaction = history.transaction;
        setFocus(newFocus);
        // And navigate
        navigation.navigate("transaction");
      }

      // Render history card
      return (
        <GradientCard key={index} gradient={getGradient()} onClick={goToTranscation}>
            <View display="flex" flexDirection="column" alignItems="flex-start" justifyContent="space-between">
              <View display="flex" flexDirection="row" alignItems="center" justifyContent="flex-start">
                <Image source={history.group ? (dark ? require("../assets/images/GroupsUnselected.png") : require("../assets/images/GroupsUnselectedLight.png")) : (dark ? require("../assets/images/PersonUnselected.png") : require("../assets/images/PersonUnselectedLight.png"))} style={{height: 20, width: 20}} />
                <StyledText text={history.transactionTitle} fontSize={14} onClick={goToTranscation} marginLeft={10}/>
              </View>
              <StyledText marginTop={0.001} fontSize={12} color={dark ? darkTheme.textSecondary : lightTheme.textSecondary} text={getDateString(history.date)} onClick={goToTranscation}/>
            </View>
          <RelationHistoryLabel history={history} onClick={goToTranscation}/>
        </GradientCard>
      )
    })
  }

  /**
   * Get the icon to display in the friend status badge overtop the user's avatar
   * @returns img source
   */
  function getFriendIcon() {
    if (currentUserManager.data.friends.includes(focus.user)) {
      return dark ? require("../assets/images/HeartDark.png") : require("../assets/images/HeartLight.png"); 
    }
    if (currentUserManager.data.incomingFriendRequests.includes(focus.user)) {
      return dark ? require("../assets/images/HeartPlusDark.png") : require("../assets/images/HeartPlusLight.png"); 
    }
    if (currentUserManager.data.outgoingFriendRequests.includes(focus.user)) {
      return dark ? require("../assets/images/PendingDark.png") : require("../assets/images/PendingLight.png"); 
    }
    return dark ? require("../assets/images/AddFriendDark.png") : require("../assets/images/AddFriendLight.png"); 
  }
  
  /**
   * Handle the add friend button click. Either add the friend or send a friend request
   * @async
   */
  async function handleAddFriendClick() {
    // Guard clauses:
    if (currentUserManager.data.friends.includes(focus.user))                 { return; } // We're already friends
    if (currentUserManager.data.outgoingFriendRequests.includes(focus.user))  { return; } // We already sent a request

    if (currentUserManager.data.incomingFriendRequests.includes(focus.user)) {
      // This person already wants to be out friend!
      // Accept the request
      currentUserManager.removeIncomingFriendRequest(focus.user);
      currentUserManager.addFriend(focus.user);
      currentUserManager.updateRelation(focus.user, new UserRelation());
      const otherPersonManager = DBManager.getUserManager(focus.user, usersData[focus.user]);
      otherPersonManager.removeOutgoingFriendRequest(currentUserManager.documentId);
      otherPersonManager.addFriend(currentUserManager.documentId);
      otherPersonManager.updateRelation(currentUserManager.documentId, new UserRelation());
      // Send a notif
      const notif = NotificationFactory.createFriendRequestAccepted(currentUserManager.data.personalData.displayName, currentUserManager.documentId);
      otherPersonManager.addNotification(notif);
      otherPersonManager.push();
      currentUserManager.push();
      return;
    }
    // Otherwise, we send a friend request
    const otherPersonManager = DBManager.getUserManager(focus.user, usersData[focus.user]);
    currentUserManager.addOutgoingFriendRequest(focus.user);
    otherPersonManager.addIncomingFriendRequest(currentUserManager.documentId);
    // Send a notif
    const notif = NotificationFactory.createFriendInvitation(currentUserManager.data.personalData.displayName, currentUserManager.documentId);
    otherPersonManager.addNotification(notif);
    currentUserManager.push();
    otherPersonManager.push();
  }

  /**
   * Get the border of the friend button based on friend status. If friends, green. Otherwise primary border color.
   * @returns border string
   */
  function getFriendButtonBorder() {
    if (currentUserManager.data.friends.includes(focus.user)) {
      return globalColors.green;
    }
    return dark ? darkTheme.buttonBorder : lightTheme.buttonBorder;
  }

  /**
   * Set up a new transaction with this user and navigate to new transcation screen
   */
  function handleNewTransactionClick() {
    const newUsers = {};
    newUsers[focus.user] =  {
      id: focus.user,
      paid: false,
      split: true,
      paidManual: null,
      splitManual: null,
    };
    newUsers[currentUserManager.documentId] = {
      id: currentUserManager.documentId,
      paid: true,
      split: true,
      paidManual: null,
      splitManual: null,
    };
    setNewTransactionData({
      users: newUsers,
      group: null,
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
        evenSplitters: [currentUserManager.documentId, focus.user],
        manualValues: {},
        percent: false,
      }
    });
    navigation.navigate("New Transaction", {screen: "amount-entry"});
  }

  /**
   * Set up a new handoff transcation with this user and navigate to new transaction screen
   */
  function handleHandoffClick() {
    const newUsers = {};
    newUsers[focus.user] =  {
      id: focus.user,
      paid: false,
      split: true,
      paidManual: null,
      splitManual: null,
    };
    newUsers[currentUserManager.documentId] = {
      id: currentUserManager.documentId,
      paid: true,
      split: true,
      paidManual: null,
      splitManual: null,
    };
    setNewTransactionData({
      users: newUsers,
      group: null,
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
      isIOU: true,
      firstPage: false,
      paidByModalState: {
        evenPayers: [currentUserManager.documentId],
        manualValues: {},
        percent: false,
      },
      splitModalState: {
        evenSplitters: [currentUserManager.documentId, focus.user],
        manualValues: {},
        percent: false,
      }
    });
    navigation.navigate("New Transaction", {screen: "amount-entry"});
  }
  
  /**
   * A component to display a hint to create a new transaction if there is no history
   */
  function NewTranasactionHint() {
    if (currentUserManager.data.relations[focus.user].history.length !== 0) { return; } // We have history!

    return (
      <Pressable display="flex" android_ripple={{color: globalColors.greenAlpha}} flexDirection="column" alignItems="center" justifyContent="center" onPress={handleNewTransactionClick}>
        <CenteredTitle text="Press" color={dark ? darkTheme.textSecondary : lightTheme.textSecondary}/>
        <Image source={dark ? require("../assets/images/NewTransactionHintDark.png") : require("../assets/images/NewTransactionHintLight.png")} style={{width: 40, height: 40}} />
        <CenteredTitle text="to add a transaction" color={dark ? darkTheme.textSecondary : lightTheme.textSecondary}/>
      </Pressable>
    )
  }

  // Render page as long as there is a currentUserManager and we have data on this focused user
  return ( usersData[focus.user] && currentUserManager && 
    <ScrollPage>
      <CardWrapper display="flex" flexDirection="row" justifyContent="space-between" alignItems="center" height={150} marginBottom={10}>
        <View>
          <AvatarIcon id={focus.user} size={120}/>
          <Pressable style={{width: 30, height: 30, position: 'absolute', bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: (dark ? darkTheme.buttonFill : lightTheme.buttonFill), borderRadius: 20, borderColor: getFriendButtonBorder(), borderWidth: 1}} onPress={handleAddFriendClick}>
            <Image source={getFriendIcon()} style={{width: 20, height: 20}}/>
          </Pressable>
        </View>
        <View display="flex" flexDirection="column" justifyContent="space-around" alignItems="center">
          <CenteredTitle text={usersData[focus.user].personalData.displayName} fontSize={24}/>
          <RelationLabel relation={currentUserManager.data.relations[focus.user]} fontSize={30}/>
          <EmojiBar relation={currentUserManager.data.relations[focus.user]} justifyContent="center" size="large" marginTop={20} marginBottom={20}/>
        </View>
      </CardWrapper>

      <TrayWrapper>
        <NewTransactionPill onClick={handleNewTransactionClick}/>
        <HandoffPill onClick={handleHandoffClick}/>
        <SettingsPill onClick={() => navigation.navigate("settings")}/>
        <GroupAddPill onClick={() => navigation.navigate("invite")}/>
      </TrayWrapper>

      <View display="flex" flexDirection="row" justifyContent="space-between" alignItems="center" style={{width: "100%"}} size="large">
        <SearchBarFull setSearch={(text) => setSearch(text)} />
      </View>
      
      <View style={{marginTop: 20, width: "100%"}} keyboardShouldPersistTaps="handled">
        <NewTranasactionHint />
        { renderHistory() }
      </View>
    </ScrollPage>      
  )

}

/**
 * A user settings page component desperately in need of a re-make
 * @param {ReactNavigation} navigation navigation object from {@link People} tab Stack Navigator
 */
function SettingsPage({navigation}) {

  // Get context
  const { usersData, setUsersData } = useContext(UsersContext);
  const { currentUserManager } = useContext(CurrentUserContext);
  const { focus } = useContext(FocusContext);

  /**
   * Toggle whether or not to mute notifications from this user
   */
  function toggleNotification() {
    if (currentUserManager.data.mutedUsers.includes(focus.user)) {
      currentUserManager.removeMutedUser(focus.user);
    } else {
      currentUserManager.addMutedUser(focus.user);
    }
    currentUserManager.push();
  }

  /**
   * Remove this user as a friend on currentUser and target user
   */
  function removeFriend() {
    currentUserManager.removeFriend(focus.user);
    const friendManager = DBManager.getUserManager(focus.user);
    friendManager.removeFriend(currentUserManager.documentId);
    currentUserManager.push();
    friendManager.push();
  }
  
  /**
   * A remove friend button component that only renders if the current user is friends with the focused user
   */
  function RemoveFriendButton() {
    // Guard clauses:
    if (!currentUserManager.data.friends.includes(focus.user)) { return; } // We're not friends
    return (
      <StyledButton 
        marginTop={40} 
        color={"red"} 
        text="Remove Friend" 
        onClick={() => 
          Alert.alert(
            "Remove Friend?", 
            `Remove ${usersData[focus.user].personalData.displayName} as a Friend?`, 
            [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Remove Friend',
                onPress: () => removeFriend(),
                style: 'destructive',
              },
            ],
          )
        }
      />
    )
  }

  // So long as we have userData on this focused user, render the settings page
  return ( usersData[focus.user] && 
    <PageWrapper justifyContent="space-between">
      <View display="flex" flexDirection="column" alignItems="center" marginTop={20}>
        <AvatarIcon src={usersData[focus.user].personalData.pfpUrl} size={120}/>
        <CenteredTitle text={usersData[focus.user].personalData.displayName} fontSize={24}/>
        <CenteredTitle text="Settings:" fontSize={24} />
      </View>
      <View display="flex" flexDirection="column" alignItems="center">
        <Pressable display="flex" flexDirection="row" alignItems="center" onPress={toggleNotification} style={{padding: 5}}>
          <StyledCheckbox checked={currentUserManager.data.mutedUsers.includes(focus.user)} onChange={toggleNotification}/>
          <StyledText text="Mute notifications" marginLeft={10} onClick={toggleNotification}/>
        </Pressable>
        <RemoveFriendButton />
      </View>
      <StyledButton text="Done" onClick={() => navigation.navigate("detail")} />
    </PageWrapper>      
  )

}

/**
 * A component to render a page for the currentUser to invite a focused user to groups
 * @param {ReactNavigation} navigation navigation object from {@link People} tab Stack Navigator
 */
function InvitePage({navigation}) {
  
  // Get context
  const { currentUserManager } = useContext(CurrentUserContext);
  const { usersData } = useContext(UsersContext);
  const { groupsData } = useContext(GroupsContext);
  const { dark } = useContext(DarkContext);
  const { focus, setFocus } = useContext(FocusContext);
  
  // Create states
  const [ search, setSearch ] = useState(""); // Keep track of current search box value
  const [ groups, setGroups ] = useState([]); // Keep track of all groups the user belongs to

  // Update the groups state when groupsData changes
  useEffect(getGroups, [groupsData]);

  /**
   * Update the {@link groups} state with data on every group the current user belongs to
   */
  function getGroups() {
    // Guard clauses:
    if (!currentUserManager) { return; } // No current user manager
    
    // Get all loaded groups that current user belongs to and set state
    let newGroups = [];
    for (const groupId of Object.keys(groupsData)) {
      if (currentUserManager.data.groups.includes(groupId)) {
        newGroups.push(groupId);
      }
    }
    setGroups(newGroups);
  }

  /**
   * Render GradientCards for each group the currentUser is in
   */
  function renderGroups() {
    // Guard clauses:
    if (!currentUserManager) { return; } // No current user manager!

    // Map groups
    return groups.map((groupId, index) => {
      // Guard clauses:
      if (!currentUserManager.data.groups.includes(groupId))  { return; } // Current user is not in this group
      if (!groupsData[groupId])                               { return; } // We don't have data on this group

      /**
       * If the focused user is in a group, make the border green. Otherwise make it white.
       * @returns gradient key
       */
      function getGradient() {
        if (groupsData[groupId].users.includes(focus.user)) {
          return "green";
        }
        return "white";
      }

      /**
       * Invite this user to join this grou
       * @async
       */
      async function inviteUser() {
        // Guard clauses:
        if (groupsData[groupId].users.includes(focus.user)) { return; } // User is already in this group

        // Get managers
        const friendManager = DBManager.getUserManager(focus.user);
        const groupManager = DBManager.getGroupManager(groupId);
        if (groupsData[groupId].invitedUsers.includes(focus.user)) {
          // Remove group invite if user is invited
          await friendManager.fetchData();
          const newNotifs = friendManager.data.notifications.filter(n => (n.type !== notificationTypes.INCOMINGGROUPINVITE) || (n.target !== groupId));
          friendManager.setNotifications(newNotifs);
          friendManager.removeGroupInvitation(groupId);
          groupManager.removeInvitedUser(focus.user);
          friendManager.push();
          groupManager.push();
          return;
        }
        // Otherwise invite this user
        friendManager.addGroupInvitation(groupId);
        const notif = NotificationFactory.createIncomingGroupInvite(groupsData[groupId].name, groupId, currentUserManager.documentId);
        friendManager.addNotification(notif);
        groupManager.addInvitedUser(focus.user);
        friendManager.push();
        groupManager.push();
        return;
      }

      /**
       * Get the status of this user's invitation to any given group
       * @returns status string
       */
      function getInviteText() {
        if (groupsData[groupId].users.includes(focus.user)) {
          return "Joined";
        }
        if (groupsData[groupId].invitedUsers.includes(focus.user)) {
          return "Pending...";
        }
        return "Invite";
      }

      /**
       * Text should be secondary unless the user is in the group
       * @returns color string
       */
      function getColor() {
        if (groupsData[groupId].users.includes(focus.user)) {
          return dark ? darkTheme.textPrimary : lightTheme.textPrimary;
        }
        return dark ? darkTheme.textSecondary : lightTheme.textSecondary;
      }

      // Render the group card
      return (
        <GradientCard key={index} gradient={getGradient()} selected={groupsData[groupId].users.includes(focus.user)} onClick={inviteUser}>
            <View 
            display="flex"
            pointerEvents="none"
            flexDirection="column"
            JustifyContent="center"
            alignItems="flex-start">
              <StyledText text={groupsData[groupId].name} onClick={inviteUser} marginBottom={10}/>
              <AvatarList users={groupsData[groupId].users} size={40} marginRight={-10} />
            </View>
            <StyledText color={getColor()} text={getInviteText()} onClick={inviteUser}/>
        </GradientCard>
      )
    })
  }

  /**
   * A component to tell the user they aren't in any groups
   */
  function NoGroupsHint() {
    // Guard clauses:
    if (currentUserManager.data.groups.length !== 0) { return; } // User has groups
    
    // Render hint
    return <CenteredTitle text="You aren't in any groups." fontSize={14} color={dark ? darkTheme.textSecondary : lightTheme.textSecondary} />;
  }

  // So long as there's a currentUserManager, render the user's groups
  return ( currentUserManager &&  
    <PageWrapper justifyContent="space-between">
      <CenteredTitle text={`Invite To Groups:`} />
      <SearchBarFull setSearch={setSearch} />
      <ListScroll>
        <CenteredTitle text="Groups" />
        <NoGroupsHint />
        { renderGroups() }
      </ListScroll>
    </PageWrapper>
  )
}