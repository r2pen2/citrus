// Libray Imports
import { useContext, useEffect, useState, } from 'react';
import { Image, View, } from "react-native";
import { createBottomTabNavigator, } from "@react-navigation/bottom-tabs"; 
import { createStackNavigator, } from "@react-navigation/stack"; 

// Component Imports
import Groups from "./Groups";
import NewTransaction from "./NewTranscation";
import People from "./People";
import Settings from "./Settings";
import Topbar from "../components/Topbar"

// Context Imports
import { 
  CurrentUserContext, 
  DarkContext, 
  GroupsContext, 
  ListenedGroupsContext, 
  ListenedTransactionsContext,
  ListenedUsersContext, 
  TransactionsContext, 
  UnsubscribeCurrentUserContext, 
  UsersContext, 
} from '../Context';

// API Imports
import { DBManager, } from '../api/dbManager';
import { NotificationModal, } from '../components/Notifications';

// Style Imports
import { darkTheme, globalColors, lightTheme, } from '../assets/styles';

/**
 * Enum for keeping track of the names on the bottom tabs of the application.
 * There are capitalized (unlike other screen names) because they are shown on UI
 * @enum {string}
 */
const tabNames = {
    people: "People",
    newTranscation: "New Transaction",
    groups: "Groups",
  }

/** Navigator for main tab page */
const Tab = createBottomTabNavigator();
/** Navigator for main tab page, settings, and login */
const Stack = createStackNavigator();

/**
 * Component for handling the entire application. Fetches / listens to data on mount and keeps
 * all context up-to-date.
 * @param {ReactNavigation} navigation navigation object from the full app wrapper 
 */
export default function Dashboard({navigation}) {

  // Get all context
  const { currentUserManager, setCurrentUserManager } = useContext(CurrentUserContext);
  const { usersData, setUsersData } = useContext(UsersContext);
  const { groupsData, setGroupsData } = useContext(GroupsContext);
  const { transactionsData, setTransactionsData } = useContext(TransactionsContext);
  const { listenedUsers, setListenedUsers } = useContext(ListenedUsersContext);
  const { listenedGroups, setListenedGroups } = useContext(ListenedGroupsContext);
  const { listenedTransactions, setListenedTransactions } = useContext(ListenedTransactionsContext);
  const { unsubscribeCurrentUser, setUnsubscribeCurrentUser } = useContext(UnsubscribeCurrentUserContext);

  // When currentUserManager changes, either subscribe to their users, groups, and transactions, or redirect to login if currentUserManager is null
  useEffect(() => {
    if (!currentUserManager) {
      navigation.navigate("login");
    } else {
      subscribeToUsers();
      subscribeToGroups();
      subscribeToTransactions();
    }
  }, [currentUserManager]);

  // Subscribe to realtime updates for the currentUserManager on component mount
  useEffect(() => { subscribeToSelf(); }, []);

  /**
   * If there's already a listener on the currentUserManager, unsubscribe it.
   * Then we attach a listener to the currentUserManager that updates its data whenever the document changes in Firestore.
   * Save the unsubscribe function into {@link UnsubscribeCurrentUserContext} so that we can stop listening on sign-out.
   * @async
   */
  async function subscribeToSelf() {
    // If we're already listening to a currentUserManager, stop. We'll replace the listener here.
    if (unsubscribeCurrentUser) {
      await unsubscribeCurrentUser();
    }
    // Set up a listener and save the function
    const unsubscribe = currentUserManager.docRef.onSnapshot((snap) => {
      // When a change is detected for currentUser's document, create a new currentUserManager with the document data
      const newUserManager = DBManager.getUserManager(currentUserManager.documentId, snap.data());
      // Filter out muted notifications
      let newNotifs = {...newUserManager.data.notifications};
      for (const notificationType of Object.keys(newNotifs)) {
        for (const notifTarget of Object.keys(notificationType)) {
          if (currentUserManager.data.mutedUsers.includes(notifTarget)) {
            delete newNotifs[notificationType][notifTarget];
          }
          if (currentUserManager.data.mutedGroups.includes(notifTarget)) {
            delete newNotifs[notificationType][notifTarget];
          }
        }
      }
      
      newUserManager.data.notifications = newNotifs;
      // Set currentUserManager
      setCurrentUserManager(newUserManager);

    });
    // Set the UnsubscribeCurrentUserContext so that we can stop listening on sign-out.
    setUnsubscribeCurrentUser(() => unsubscribe);
  }

  /**
   * If there's a currentUserManager, subscribe to live Firestore updates for every user
   * they have a relation with. All friends have relations, even if they're empty. This
   * should be plenty to have information on anyone we want.
   * @async 
   */
  async function subscribeToUsers() {
    // Guard clauses:
    if (!currentUserManager) { return; }  // We don't have a currentUserManager! Don't bother.

    // Make a copy of the UsersContext
    const newData = {...usersData};

    for (const userId of Object.keys(currentUserManager.data.relations)) {
      // For everyone that the currentUser has relations with...
      if (!listenedUsers.includes(userId)) {
        // We're not already listening to this user
        // Clone listened users array
        let newListenedUsers = []; 
        for (const listenedUser of listenedUsers) {
          newListenedUsers.push(listenedUser);
        }
        // Get a userManager for this new person
        const relationUserManager = DBManager.getUserManager(userId);
        relationUserManager.docRef.onSnapshot((snap) => {
          // And set up a listener for changes
          if (snap.data()) {                
            // So long as the change includes data, update the UsersContext with this person's information
            relationUserManager.data = snap.data();
            newData[userId] = relationUserManager.data;
            setUsersData(newData);
          }
        });
        // Add this user to listened array so we don't duplicate listeners
        newListenedUsers.push(userId);
        setListenedUsers(newListenedUsers);
      }
    }
    // Set UsersContext to reflect changes
    setUsersData(newData);
  }

  /**
   * If there's a currentUserManager, subscribe to live Firestore updates for every 
   * one of their groups.
   * @async 
   */
  async function subscribeToGroups() {
    // Guard clauses:
    if (!currentUserManager) { return; } // There's no current user! Run.

    // Clone groups data
    const newData = {...groupsData};
    for (const groupId of currentUserManager.data.groups) {
      // For each of the current user's groups
      if (!listenedGroups.includes(groupId)) {
        // If we're not already listening to this group
        // Clone the listenedGroupsArray
        let newListenedGroups = [];
        for (const listenedGroup of listenedGroups) {
          newListenedGroups.push(listenedGroup);
        }
        // Get a groupManager
        const groupManager = DBManager.getGroupManager(groupId);
        groupManager.docRef.onSnapshot((snap) => {
          // On document update, if there's data, save it to the GroupsContext
          if (snap.data()) {                
            groupManager.data = snap.data();
            newData[groupId] = groupManager.data;
            setGroupsData(newData);
          }
        });
        // Add this group to the listenedGroupsArray so that we don't duplicate listeners
        newListenedGroups.push(groupId);
        setListenedGroups(newListenedGroups);
      }
    }
    // Update groups data accordingly
    setGroupsData(newData);
  }

  /**
  * If there's a currentUserManager, subscribe to live Firestore updates for every 
  * one of their transactions.
  * @async 
  */
  async function subscribeToTransactions() {
  // Guard clauses:
  if (!currentUserManager) { return; } // No current user!?!
  
  // Clone the transaction data so we can make changes that update the state
  const newData = {...transactionsData};
  for (const transactionId of currentUserManager.data.transactions) {
    // For each of the current user's transactions
    if (!listenedTransactions.includes(transactionId)) {
      // If we're not already listening
      // Clone listened array so we can make changes
      let newListenedTransactions = [];
      for (const listenedTransaction of listenedTransactions) {
        newListenedTransactions.push(listenedTransaction);
      }
      // Get a transaction manager
      const transactionManager = DBManager.getTransactionManager(transactionId);
      transactionManager.docRef.onSnapshot((snap) => {
        // Add a listener that updates transcation data with change data
        if (snap.data()) {
          transactionManager.data = snap.data();
          newData[transactionId] = transactionManager.data;
          setTransactionsData(newData);
        }
      });
      // Add this transcation to list of listenedTranscations so we don't duplicate listeners later
      newListenedTransactions.push(transactionId);
      setListenedTransactions(newListenedTransactions);
    }
  }
  // Update context
  setTransactionsData(newData)
}

  // Stop user from going back to login unless they are already signed out
  navigation.addListener('beforeRemove', (e) => {
    if (currentUserManager) {
      e.preventDefault(); // Don't navigate
    } else {
      navigation.dispatch(e.data.action); // Ok fine. Navigate.
    }
  });

  return (
    <View style={{height: "100%"}}>
      <Stack.Navigator
        initialRouteName="main"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="main"     component={MainTabs} />
        <Stack.Screen name="settings" component={Settings} />
      </Stack.Navigator>
    </View>
  )
}

/**
 * Wrapper component for main app bottom navigation tabs. Contains topbar and bottomnav
 * @param {ReactNavigation} navigation navigation object from Dasboard 
 */
function MainTabs({navigation}) {

  // Get context
  const { dark } = useContext(DarkContext);

  // Track whether or not to show the notification modal (pls default to closed)
  const [ notificationModalOpen, setNotificationModalOpen ] = useState(false);

  // Render app pages
  return (
    <View style={{height: "100%"}}>
      <NotificationModal open={notificationModalOpen} setOpen={setNotificationModalOpen} />
      <Topbar nav={navigation} onNotificationClick={() => setNotificationModalOpen(true)}/>
      <Tab.Navigator
        initialRouteName={tabNames.people}
        backBehavior="none"
        screenOptions={({route}) => ({
          tabBarIcon: ({focused, size}) => {
            // Get the icon for each tab by darkmode value and tab name
            let imgSrc;
            let routeName = route.name;
            if (routeName === tabNames.people) {
              imgSrc = focused ? require('../assets/images/PersonSelected.png') : dark ? require('../assets/images/PersonUnselected.png') : require('../assets/images/PersonUnselectedLight.png');
            } else if (routeName === tabNames.newTranscation) {
                imgSrc = focused ? require('../assets/images/NewTransactionSelected.png') : dark ? require('../assets/images/NewTransactionUnselected.png') : require('../assets/images/NewTransactionUnselectedLight.png');
              } else if (routeName === tabNames.groups) {
                imgSrc = focused ? require('../assets/images/GroupsSelected.png') : dark ? require('../assets/images/GroupsUnselected.png') : require('../assets/images/GroupsUnselectedLight.png');
              }
              return <Image style={{width: size, height: size}} source={imgSrc} />
            },
          tabBarActiveTintColor: globalColors.green,
          tabBarInactiveTintColor: dark ? darkTheme.textPrimary : lightTheme.textPrimary,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: dark ? darkTheme.tabBarColor : lightTheme.tabBarColor,
            paddingBottom: 5,
            height: 60, 
            paddingTop: 5,
          },
        })}
      >
        <Tab.Screen 
          name={tabNames.people} 
          component={People}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              e.preventDefault(); // Always navigate to relations screen on people tab press
              navigation.navigate(tabNames.people, {screen: "relations"});
            },
          })}
        />
        <Tab.Screen 
          name={tabNames.newTranscation} 
          component={NewTransaction}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              e.preventDefault(); // Always navigate to add-people screen on new transaction tab press
              navigation.navigate(tabNames.newTranscation, {screen: "add-people"});
            },
          })}
        />
        <Tab.Screen 
          name={tabNames.groups} 
          component={Groups} 
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              e.preventDefault(); // Always navigate to group list screen on group tab press
              navigation.navigate(tabNames.groups, {screen: "list"});
            },
          })}
        />
      </Tab.Navigator>
    </View>
  );
}