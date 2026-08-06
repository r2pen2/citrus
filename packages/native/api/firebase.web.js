/**
 * Firebase JS SDK for Expo web export (RN Firebase has no web Auth/Firestore listeners).
 * Same project as packages/web (citrus-v3) so Google accounts map to existing Firestore uids.
 */
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAMlDxLg0iubO5aU3JWqLuFjiAZrfPfBDE",
  authDomain: "citrus-v3.firebaseapp.com",
  projectId: "citrus-v3",
  storageBucket: "citrus-v3.appspot.com",
  messagingSenderId: "665676253888",
  appId: "1:665676253888:web:e9d768e2bb4d8953dc3b25",
  measurementId: "G-YEWGGQ0B9J",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signOutUser() {
  await signOut(auth);
}

export function waitForAuthUser() {
  if (auth.currentUser) {
    return Promise.resolve(auth.currentUser);
  }
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}
