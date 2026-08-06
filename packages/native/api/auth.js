// Library Imports
import { Platform } from "react-native";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

import { exchangeSsoSession } from "./citrusApi";

// Create Google authentication client with this application's credentials
// (mobile ID-token path via POST /auth/google — unused for hosted web export).
GoogleSignin.configure({
    webClientId: '153123374119-83abbudbfvqubbn46im8dvimmgvhip51.apps.googleusercontent.com',
});

// Export Google authentication client
export const googleAuth = GoogleSignin;

const SSO_SIGN_OUT =
  "https://auth.joed.dev/oauth2/sign_out?rd=https://citrusnative.joed.dev/";

/**
 * Hosted web export: Traefik SSO cookie → Citrus JWT + user.
 */
export async function signInWithJoedSso() {
  return exchangeSsoSession();
}

export function isWebSso() {
  return Platform.OS === "web";
}

export function ssoSignOutRedirect() {
  if (typeof window !== "undefined") {
    window.location.href = SSO_SIGN_OUT;
  }
}
