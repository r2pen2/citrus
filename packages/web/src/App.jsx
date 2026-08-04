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
import { finishGoogleSignInIfNeeded, toSessionUser } from "./api/authBootstrap";

export const UsersContext = React.createContext();
export const GroupsContext = React.createContext();
export const TransactionsContext = React.createContext();

const skipHomePage = true;

function App() {

  // Restore an existing Firebase session (and finish any legacy redirect result).
  // Keep localStorage in sync with Firebase Auth after that.
  useEffect(() => {
    let cancelled = false;

    // Only auto-complete when a session may already exist — popup sign-in
    // completes itself from LoginHome.
    if (SessionManager.getCurrentUser() || auth.currentUser) {
      finishGoogleSignInIfNeeded().catch((error) => {
        if (!cancelled) {
          console.error("Auth bootstrap failed:", error);
        }
      });
    }

    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      if (authUser) {
        SessionManager.setCurrentUser(toSessionUser(authUser));
      } else if (SessionManager.getCurrentUser()) {
        SessionManager.clearLS();
      }
    });

    return () => {
      cancelled = true;
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
