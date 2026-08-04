// Library imports
import { useState } from "react";
import { Button, CircularProgress, Typography } from "@mui/material";
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import { NotificationManager } from "react-notifications";

// Component imports
import GoogleLogo from "../../../assets/images/GoogleLogo.svg";

// API imports
import { signInWithGoogle } from "../../../api/firebase";
import { completeGoogleSignIn } from "../../../api/authBootstrap";
import { RouteManager } from "../../../api/routeManager";

/**
 * Homepage for login workflow— a button to login with phone and button to login with Google
 */
export default function LoginHome() {
  const [authBusy, setAuthBusy] = useState(false);

  /**
   * Google popup sign-in, then persist profile and go to dashboard
   */
  async function handleSignIn() {
    setAuthBusy(true);
    try {
      const user = await signInWithGoogle();
      await completeGoogleSignIn(user);
    } catch (error) {
      console.error("Google sign-in failed:", error);
      if (error?.code !== "auth/popup-closed-by-user" && error?.code !== "auth/cancelled-popup-request") {
        NotificationManager.error(
          error?.message || "Google sign-in failed. Try again.",
          "Sign in"
        );
      }
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
      <Button data-testid="google-button" className="login-btn"  variant="contained" onClick={() => handleSignIn()}>
        <img src={GoogleLogo} alt="Google Logo"/>
        <Typography marginLeft="10px">Sign in with Google</Typography>
      </Button>
      <Button data-testid="phone-button" className="login-btn" variant="contained" onClick={() => {RouteManager.redirect("/login/phone")}}>
        <PhoneIphoneIcon/>
        <Typography marginLeft="10px">Sign in with Phone</Typography>
      </Button>
    </div>
  )
}
