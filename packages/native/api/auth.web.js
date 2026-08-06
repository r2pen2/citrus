/**
 * Web export (citrusnative.joed.dev): joed.dev Traefik SSO only.
 * Do not import @react-native-google-signin here — it crashes without a native module.
 */
import { exchangeSsoSession } from "./citrusApi";

const SSO_SIGN_OUT =
  "https://auth.joed.dev/oauth2/sign_out?rd=https://citrusnative.joed.dev/";

export function isWebSso() {
  return true;
}

export async function signInWithJoedSso() {
  return exchangeSsoSession();
}

export function ssoSignOutRedirect() {
  if (typeof window !== "undefined") {
    window.location.href = SSO_SIGN_OUT;
  }
}

/** Stub for Settings / callers that still expect googleAuth.signOut(). */
export const googleAuth = {
  async isSignedIn() {
    return false;
  },
  async hasPlayServices() {
    return true;
  },
  async signIn() {
    throw new Error("Use joed.dev SSO on web (signInWithJoedSso).");
  },
  async signOut() {
    ssoSignOutRedirect();
  },
};
