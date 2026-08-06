// Library Imports
import { GoogleSignin } from "@react-native-google-signin/google-signin";

// Create Google authentication client with this application's credentials
GoogleSignin.configure({
    webClientId: '153123374119-83abbudbfvqubbn46im8dvimmgvhip51.apps.googleusercontent.com',
});

// Export Google authentication client
export const googleAuth = GoogleSignin;

/** Always false on native mobile — web uses auth.web.js. */
export function isWebSso() {
  return false;
}

export async function signInWithJoedSso() {
  throw new Error("joed.dev SSO is not used on native mobile.");
}

export function ssoSignOutRedirect() {
  // no-op on native; Settings uses googleAuth.signOut()
}
