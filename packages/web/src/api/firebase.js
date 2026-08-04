// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore'
import { getAuth, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { SessionManager } from './sessionManager';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

/**
 * The apiKey in this configuration snippet just identifies your
 * Firebase project on the Google servers. It is not a security risk 
 * for someone to know it. In fact, it is necessary for them to know 
 * it, in order for them to interact with your Firebase project. This 
 * same configuration data is also included in every iOS and Android 
 * app that uses Firebase as its backend.
 */
const firebaseConfig = {
  apiKey: "AIzaSyAMlDxLg0iubO5aU3JWqLuFjiAZrfPfBDE",
  authDomain: "citrus-v3.firebaseapp.com",
  projectId: "citrus-v3",
  storageBucket: "citrus-v3.appspot.com",
  messagingSenderId: "665676253888",
  appId: "1:665676253888:web:e9d768e2bb4d8953dc3b25",
  measurementId: "G-YEWGGQ0B9J"
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
