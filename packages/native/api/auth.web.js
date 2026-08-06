/**
 * Web export (citrusnative.joed.dev): Firebase Google popup (same citrus-v3 project).
 * Do not import @react-native-google-signin here — it crashes without a native module.
 */
import {
  signInWithGoogle,
  signOutUser,
  waitForAuthUser,
  auth,
} from "./firebase.web";

export function isWebSso() {
  return false;
}

export async function signInWithJoedSso() {
  throw new Error("joed.dev SSO removed — use Google sign-in (Firebase).");
}

export function ssoSignOutRedirect() {
  // Back-compat no-op name; sign out via Firebase.
  return signOutUser();
}

export { signInWithGoogle, waitForAuthUser, auth };

/** Stub for Settings / callers that still expect googleAuth.signOut(). */
export const googleAuth = {
  async isSignedIn() {
    const user = await waitForAuthUser();
    return !!user;
  },
  async hasPlayServices() {
    return true;
  },
  async signIn() {
    const user = await signInWithGoogle();
    return { idToken: await user.getIdToken() };
  },
  async signOut() {
    await signOutUser();
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("citrus:accessToken");
      localStorage.removeItem("citrus:accessTokenExpiresAt");
    }
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  },
};
