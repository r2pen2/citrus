// Style Imports
import theme from "./assets/style/theme";
import "./app.scss";
import "./assets/style/notifications.css";
import "./assets/style/bootstrap.css";
import "./assets/style/layout.css";
import "./assets/style/colors.css";

// Library Imports
import { ThemeProvider } from "@mui/material";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { NotificationContainer } from 'react-notifications';
import React, { useEffect, useState } from 'react';

// Component Imports
import Login from "./components/login/Login";
import Dashboard from "./components/dashboard/Dashboard";
import Topbar from "./components/topbar/Topbar";
import HomePage from "./components/homePage/HomePage";
import InviteHandler from "./components/inviteHandler/InviteHandler";

// API imports
import { SessionManager } from "./api/sessionManager";
import { auth } from "./api/firebase";
import { toSessionUser } from "./api/authBootstrap";

export const UsersContext = React.createContext();
export const GroupsContext = React.createContext();
export const TransactionsContext = React.createContext();

const skipHomePage = true;

function App() {

  // Keep localStorage in sync with Firebase Auth once the first auth event fires.
  // Do not clear LS on the initial null (persistence may still be restoring) — that
  // wiped userId and caused Dashboard↔Login reload loops on citrus.joed.dev.
  useEffect(() => {
    let ready = false;
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      if (authUser) {
        SessionManager.setCurrentUser(toSessionUser(authUser));
        ready = true;
        return;
      }
      if (ready && SessionManager.getCurrentUser()) {
        SessionManager.clearLS();
      }
      ready = true;
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const [usersData, setUsersData] = useState({});
  const [transactionsData, setTransactionsData] = useState({});
  const [groupsData, setGroupsData] = useState({});

  // I present to you: Citrus Financial
  return (
    <div className="app" data-testid="app-wrapper">
      <Router>
        <ThemeProvider theme={theme}>
        <UsersContext.Provider value={{usersData, setUsersData}} >
        <TransactionsContext.Provider value={{transactionsData, setTransactionsData}} >
        <GroupsContext.Provider value={{groupsData, setGroupsData}} >
          <Topbar/>
          <Routes>
            <Route path="*" element={skipHomePage ? <Login /> : <HomePage />} />
            <Route path="/home" element={skipHomePage ? <Login /> : <HomePage />} />
            <Route path="/login/*" element={<Login/>} />
            <Route path="/dashboard/*" element={<Dashboard/>} />
            <Route path="/invite" element={<InviteHandler />} />
          </Routes>
        </GroupsContext.Provider>
        </TransactionsContext.Provider>
        </UsersContext.Provider>
        </ThemeProvider>
        <NotificationContainer />
        <div id="recaptcha-container"></div>
      </Router>
    </div>
  )
}



export default App;
