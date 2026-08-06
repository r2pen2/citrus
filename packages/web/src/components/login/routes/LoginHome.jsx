// Library imports
import { useState } from "react";
import { Button, CircularProgress, Typography } from "@mui/material";
import { NotificationManager } from "react-notifications";

// Component imports
import GoogleLogo from "../../../assets/images/GoogleLogo.svg";

// API imports
import { signInWithJoedSso } from "../../../api/authBootstrap";

/**
 * Login homepage — joed.dev Google SSO (Traefik oauth2-proxy) → Citrus JWT.
 */
export default function LoginHome() {
  const [authBusy, setAuthBusy] = useState(false);

  async function handleSignIn() {
    setAuthBusy(true);
    try {
      await signInWithJoedSso();
    } catch (error) {
      console.error("SSO sign-in failed:", error);
      NotificationManager.error(
        error?.message || "Sign-in failed. Try again.",
        "Sign in"
      );
      setAuthBusy(false);
    }
  }

  if (authBusy) {
    return (
      <div className="login-home-wrapper center-contents-column" data-testid="login-home">
        <CircularProgress />
        <Typography marginTop="16px">Signing in…</Typography>
      </div>
    );
  }

  return (
    <div className="login-home-wrapper center-contents-column" data-testid="login-home">
      <Button data-testid="google-button" className="login-btn" variant="contained" onClick={() => handleSignIn()}>
        <img src={GoogleLogo} alt="Google Logo"/>
        <Typography marginLeft="10px">Continue with Google</Typography>
      </Button>
      <Typography variant="body2" color="textSecondary" marginTop="12px" textAlign="center">
        Uses your joed.dev Google SSO session
      </Typography>
    </div>
  );
}
