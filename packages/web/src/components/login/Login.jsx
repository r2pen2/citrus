// Style imports
import "./login.scss"

// Library Imports
import { useEffect, useState } from "react";
import { CircularProgress, Paper, Typography } from "@mui/material";
import { Route, Routes } from "react-router-dom";

// Component Imports
import Phone from "./routes/Phone";
import NewUserForm from "./routes/NewUserForm";
import LoginHome from "./routes/LoginHome";
import { SpinningLogo } from "../resources/Login";

// API imports
import { finishGoogleSignInIfNeeded } from "../../api/authBootstrap";
import { BrowserManager } from "../../api/browserManager";
import { SessionManager } from "../../api/sessionManager";

/**
 * Wrapper for all Login related routes
 */
export default function Login() {
  const [bootstrapping, setBootstrapping] = useState(
    () => !!SessionManager.getCurrentUser()
  );

  useEffect(() => {
    BrowserManager.setTitle("Login");

    let cancelled = false;

    async function bootstrap() {
      let started = false;
      try {
        started = await finishGoogleSignInIfNeeded();
      } catch (error) {
        console.error("Login auth bootstrap failed:", error);
      } finally {
        // Keep the spinner up if sign-in completed — redirect to /dashboard is in flight.
        if (!cancelled && !started) {
          setBootstrapping(false);
        }
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  if (bootstrapping) {
    return (
      <div className="background-controller" data-testid="login-background-controller">
        <Paper className="login-content" elevation={12}>
          <div className="center-contents-column">
            <SpinningLogo />
            <div className="login-input-window center-contents-column">
              <CircularProgress />
              <Typography marginTop="16px">Finishing sign-in…</Typography>
            </div>
          </div>
        </Paper>
      </div>
    );
  }

  return (
    <div className="background-controller" data-testid="login-background-controller">
      <Paper className="login-content" elevation={12}>
        <div className="center-contents-column">
          <SpinningLogo />
          <div className="login-input-window">
            <Routes>
              <Route path="/" element={<LoginHome/>}/>
              <Route path="/home" element={<LoginHome/>}/>
              <Route path="/login" element={<LoginHome/>}/>
              <Route path="/login/home" element={<LoginHome/>}/>
              <Route path="/phone" element={<Phone/>}/>
              <Route path="/login/phone" element={<Phone/>}/>
              <Route path="/account-creation" element={<NewUserForm/>}/>
              <Route path="/login/account-creation" element={<NewUserForm/>}/>
            </Routes>
          </div>
        </div>
      </Paper>
    </div>
  );
}
