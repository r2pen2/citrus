// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore'
import { getAuth, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { SessionManager } from './sessionManager';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

/**
 * Shared Firebase project for web + native: citrusnative.
 * (Same Auth/Firestore as packages/native mobile.)
 */
const firebaseConfig = {
  apiKey: "AIzaSyBhWENoSrQRMVxNagkzhECRaiozlbeevgc",
  authDomain: "citrusnative.firebaseapp.com",
  projectId: "citrusnative",
  storageBucket: "citrusnative.firebasestorage.app",
  messagingSenderId: "153123374119",
  appId: "1:153123374119:web:bb6c2e7b10914698f2fa02",
  measurementId: "G-9PTVYPPJHC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore();

/**
 * Sign out user and remove localStorage item
 */
export async function signOutUser() {
  return new Promise((resolve, reject) => {
      signOut(auth).then((result) => {
          SessionManager.clearLS();
          resolve(null);
      }).catch((error) => {
          reject(error);
      });
  })
}

/**
 * Sign in with Google via popup.
 * Redirect is broken in Chrome 115+ (third-party storage partitioning) unless
 * auth helper is same-origin — see Firebase redirect best practices.
 * @returns {Promise<import('firebase/auth').User>}
 */
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, provider);
  return result.user;
}
