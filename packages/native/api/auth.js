/**
 * Native (iOS/Android) Google Sign-In client.
 * Web uses auth.web.js (platform resolution) — keep this file free of web bundling.
 */
import { GoogleSignin } from "@react-native-google-signin/google-signin";

import { exchangeSsoSession } from "./citrusApi";

GoogleSignin.configure({
  webClientId:
    "153123374119-83abbudbfvqubbn46im8dvimmgvhip51.apps.googleusercontent.com",
});

export const googleAuth = GoogleSignin;

const SSO_SIGN_OUT =
  "https://auth.joed.dev/oauth2/sign_out?rd=https://citrusnative.joed.dev/";

export async function signInWithJoedSso() {
  return exchangeSsoSession();
}

export function isWebSso() {
  return false;
}

export function ssoSignOutRedirect() {
  if (typeof window !== "undefined") {
    window.location.href = SSO_SIGN_OUT;
  }
}
