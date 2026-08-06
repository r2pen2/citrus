// Style imports
import "./login.scss"

// Library Imports
import { useEffect, useState } from "react";
import { CircularProgress, Paper, Typography } from "@mui/material";
import { Route, Routes } from "react-router-dom";

// Component Imports
import LoginHome from "./routes/LoginHome";
import { SpinningLogo } from "../resources/Login";

// API imports
import { finishSsoSignInIfNeeded } from "../../api/authBootstrap";
import { BrowserManager } from "../../api/browserManager";

/**
 * Wrapper for all Login related routes
 */
export default function Login() {
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    BrowserManager.setTitle("Login");

    let cancelled = false;

    async function bootstrap() {
      let started = false;
      try {
        // Auto-exchange joed.dev SSO cookie → Citrus JWT when possible.
        started = await finishSsoSignInIfNeeded();
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
              <Typography marginTop="16px">Signing in with joed.dev SSO…</Typography>
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
            </Routes>
          </div>
        </div>
      </Paper>
    </div>
  );
}
