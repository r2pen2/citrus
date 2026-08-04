// Library Imports
import { LinearGradient, } from "expo-linear-gradient";
import { useState, } from "react";
import { StatusBar, View, } from "react-native";
import { DefaultTheme, NavigationContainer, } from "@react-navigation/native";
import { createStackNavigator, } from "@react-navigation/stack"; 

// Component Imports
import Dashboard from "./navigation/Dashboard";
import Login from "./navigation/Login";

// API Imports
import { emojiCurrencies, legalCurrencies, } from "./api/enum";

// Style Imports
import { darkTheme, lightTheme } from "./assets/styles";

// Context Imports
import { 
  CurrentUserContext, 
  DarkContext, 
  FocusContext, 
  GroupsContext, 
  ListenedGroupsContext, 
  ListenedTransactionsContext,
  ListenedUsersContext, 
  NewTransactionContext, 
  TransactionsContext, 
  UnsubscribeCurrentUserContext, 
  UsersContext, 
} from "./Context";

/** 
 * The main App Stack navigator, allowing the user to visit pages not contained within the mainPage bottom tab navigation 
 * @constant
 */
export const AppStack = createStackNavigator();

/** 
 * AppStack navigation theme inherits from the {@link DefaultTheme} and sets the navigation's background color to transparent 
 * @constant
 * */
const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'transparent',
  },
};

/**
 * The entire CitrusNative app component. Creates states for all context and returns a Stack Navigator inside all context providers.
 */
function App() {
  // Initialize context
  const [usersData, setUsersData] = useState({});                               // Users data should start out empty
  const [transactionsData, setTransactionsData] = useState({});                 // Transaction data should start out empty
  const [groupsData, setGroupsData] = useState({});                             // Groups data should start out empty
  const [dark, setDark] = useState(true);                                       // Defaulting to darkmode because darkmode is cool 😎 
  const [currentUserManager, setCurrentUserManager] = useState(null);           // We haven't logged in, so no currentUser yet
  const [unsubscribeCurrentUser, setUnsubscribeCurrentUser] = useState(null);   // We haven't subscribed to currentUser, so no unsubscribe function exists
  const [newTransactionData, setNewTransactionData] = useState({
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
    }
  });
  const [focus, setFocus] = useState({
    user: null,         // No default focused user
    group: null,        // No default focused group
    transaction: null,  // No default focused transaction
  });
  const [listenedUsers, setListenedUsers] = useState([]);               // We're not yet listening to any users
  const [listenedGroups, setListenedGroups] = useState([]);             // We're not yet listening to any groups
  const [listenedTransactions, setListenedTransactions] = useState([]); // We're not yet listening to any transactions
  
  // Render CitrusNative!
  return (
    <ListenedTransactionsContext.Provider   value={{listenedTransactions, setListenedTransactions}}     >
    <ListenedGroupsContext.Provider         value={{listenedGroups, setListenedGroups}}                 >
    <ListenedUsersContext.Provider          value={{listenedUsers, setListenedUsers}}                   >
    <UnsubscribeCurrentUserContext.Provider value={{unsubscribeCurrentUser, setUnsubscribeCurrentUser}} >
    <FocusContext.Provider                  value={{focus, setFocus}}                                   >
    <CurrentUserContext.Provider            value={{currentUserManager, setCurrentUserManager}}         >
    <DarkContext.Provider                   value={{dark, setDark}}                                     >
    <UsersContext.Provider                  value={{usersData, setUsersData}}                           >
    <TransactionsContext.Provider           value={{transactionsData, setTransactionsData}}             >
    <GroupsContext.Provider                 value={{groupsData, setGroupsData}}                         >
    <NewTransactionContext.Provider         value={{newTransactionData, setNewTransactionData}}         >
      <StatusBar backgroundColor={dark ? darkTheme.statusBarColor : lightTheme.statusBarColor} />
      <LinearGradient 
        start={[0.5, 0]}              // This is just a background gradient over the entire app. 
        end={[0.5, .2]}               // It gives the little green glow at the top of every page.
        colors={dark ? darkTheme.backgroundGradient : lightTheme.backgroundGradient }
        style={{
          backgroundColor: dark ? darkTheme.backgroundGradientBackground : lightTheme.backgroundGradientBackground
        }}
      >
        <View style={{height: '100%'}}>
          <NavigationContainer theme={navTheme}>
            <AppStack.Navigator
              initialRouteName="loading"
              screenOptions={{
                headerShown: false,
              }}
            >
              <AppStack.Screen name="login"     component={Login}     />
              <AppStack.Screen name="dashboard" component={Dashboard} />
            </AppStack.Navigator>
          </NavigationContainer>
        </View> 
      </LinearGradient>
    </NewTransactionContext.Provider          >
    </GroupsContext.Provider                  >
    </TransactionsContext.Provider            >
    </UsersContext.Provider                   >
    </DarkContext.Provider                    > 
    </CurrentUserContext.Provider             >
    </FocusContext.Provider                   >
    </UnsubscribeCurrentUserContext.Provider  >
    </ListenedUsersContext.Provider           >
    </ListenedGroupsContext.Provider          >
    </ListenedTransactionsContext.Provider    >
  );
}

export default App;