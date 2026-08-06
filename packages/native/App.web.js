/**
 * Web shell for citrusnative.joed.dev.
 * Keeps the same providers as App.js but fills the viewport (avoids white collapse)
 * and resets into dashboard after auth instead of stacking navigators.
 */
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { StatusBar, View } from "react-native";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import Dashboard from "./navigation/Dashboard";
import Login from "./navigation/Login";
import { emojiCurrencies, legalCurrencies } from "./api/enum";
import { darkTheme, lightTheme } from "./assets/styles";
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

export const AppStack = createStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "transparent",
  },
};

function App() {
  const [usersData, setUsersData] = useState({});
  const [transactionsData, setTransactionsData] = useState({});
  const [groupsData, setGroupsData] = useState({});
  const [dark, setDark] = useState(true);
  const [currentUserManager, setCurrentUserManager] = useState(null);
  const [unsubscribeCurrentUser, setUnsubscribeCurrentUser] = useState(null);
  const [newTransactionData, setNewTransactionData] = useState({
    users: {},
    group: null,
    total: null,
    legalType: legalCurrencies.USD,
    emojiType: emojiCurrencies.BEER,
    currencyLegal: true,
    currencyMenuOpen: false,
    split: "even",
    splitPercent: false,
    paidBy: "even",
    paidByPercent: false,
    title: null,
    isIOU: false,
    paidByModalState: {
      evenPayers: [],
      manualValues: {},
      percent: false,
    },
    splitModalState: {
      evenSplitters: [],
      manualValues: {},
      percent: false,
    },
  });
  const [focus, setFocus] = useState({
    user: null,
    group: null,
    transaction: null,
  });
  const [listenedUsers, setListenedUsers] = useState([]);
  const [listenedGroups, setListenedGroups] = useState([]);
  const [listenedTransactions, setListenedTransactions] = useState([]);

  return (
    <ListenedTransactionsContext.Provider value={{ listenedTransactions, setListenedTransactions }}>
      <ListenedGroupsContext.Provider value={{ listenedGroups, setListenedGroups }}>
        <ListenedUsersContext.Provider value={{ listenedUsers, setListenedUsers }}>
          <UnsubscribeCurrentUserContext.Provider
            value={{ unsubscribeCurrentUser, setUnsubscribeCurrentUser }}
          >
            <FocusContext.Provider value={{ focus, setFocus }}>
              <CurrentUserContext.Provider value={{ currentUserManager, setCurrentUserManager }}>
                <DarkContext.Provider value={{ dark, setDark }}>
                  <UsersContext.Provider value={{ usersData, setUsersData }}>
                    <TransactionsContext.Provider value={{ transactionsData, setTransactionsData }}>
                      <GroupsContext.Provider value={{ groupsData, setGroupsData }}>
                        <NewTransactionContext.Provider
                          value={{ newTransactionData, setNewTransactionData }}
                        >
                          <StatusBar
                            backgroundColor={
                              dark ? darkTheme.statusBarColor : lightTheme.statusBarColor
                            }
                          />
                          <LinearGradient
                            start={[0.5, 0]}
                            end={[0.5, 0.2]}
                            colors={
                              dark
                                ? darkTheme.backgroundGradient
                                : lightTheme.backgroundGradient
                            }
                            style={{
                              flex: 1,
                              minHeight: "100%",
                              width: "100%",
                              backgroundColor: dark
                                ? darkTheme.backgroundGradientBackground
                                : lightTheme.backgroundGradientBackground,
                            }}
                          >
                            <View style={{ flex: 1, minHeight: "100%", width: "100%" }}>
                              <NavigationContainer theme={navTheme}>
                                <AppStack.Navigator
                                  initialRouteName="login"
                                  screenOptions={{
                                    headerShown: false,
                                    animationEnabled: false,
                                  }}
                                >
                                  <AppStack.Screen name="login" component={Login} />
                                  <AppStack.Screen name="dashboard" component={Dashboard} />
                                </AppStack.Navigator>
                              </NavigationContainer>
                            </View>
                          </LinearGradient>
                        </NewTransactionContext.Provider>
                      </GroupsContext.Provider>
                    </TransactionsContext.Provider>
                  </UsersContext.Provider>
                </DarkContext.Provider>
              </CurrentUserContext.Provider>
            </FocusContext.Provider>
          </UnsubscribeCurrentUserContext.Provider>
        </ListenedUsersContext.Provider>
      </ListenedGroupsContext.Provider>
    </ListenedTransactionsContext.Provider>
  );
}

export default App;
