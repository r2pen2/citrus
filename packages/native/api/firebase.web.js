/**
 * Firebase JS SDK for Expo web export.
 * Same citrusnative project as packages/web and native mobile.
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
  apiKey: "AIzaSyBhWENoSrQRMVxNagkzhECRaiozlbeevgc",
  authDomain: "citrusnative.firebaseapp.com",
  projectId: "citrusnative",
  storageBucket: "citrusnative.firebasestorage.app",
  messagingSenderId: "153123374119",
  appId: "1:153123374119:web:bb6c2e7b10914698f2fa02",
  measurementId: "G-9PTVYPPJHC",
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
