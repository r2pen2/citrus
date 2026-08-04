import { getRedirectResult } from "firebase/auth";
import { auth } from "./firebase";
import { DBManager } from "./db/dbManager";
import { SessionManager } from "./sessionManager";
import { RouteManager } from "./routeManager";

/**
 * Plain object safe for localStorage (Firebase User has methods / toJSON quirks).
 */
export function toSessionUser(user) {
  if (!user) {
    return null;
  }
  return {
    uid: user.uid,
    email: user.email ?? null,
    displayName: user.displayName ?? null,
    photoURL: user.photoURL ?? null,
    emailVerified: !!user.emailVerified,
    phoneNumber: user.phoneNumber ?? null,
  };
}

// getRedirectResult can only be read once; React StrictMode remounts would otherwise lose it.
let redirectUserPromise = null;
let completeSignInPromise = null;
let finishSignInPromise = null;

/**
 * Resolve once Firebase has restored (or rejected) the persisted/redirect session.
 */
function waitForAuthUser() {
  if (auth.currentUser) {
    return Promise.resolve(auth.currentUser);
  }
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

export function getGoogleRedirectResult() {
  if (!redirectUserPromise) {
    redirectUserPromise = getRedirectResult(auth)
      .then((result) => (result ? result.user : null))
      .catch((error) => {
        redirectUserPromise = null;
        throw error;
      });
  }
  return redirectUserPromise;
}

/**
 * Upsert the signed-in user's Firestore profile.
 * Permission errors are logged but do not block entering the app.
 */
async function upsertUserProfile(user) {
  // Ensure the Auth ID token is attached before the first Firestore call.
  // Without this, getDoc/setDoc can fail with "Missing or insufficient permissions"
  // immediately after signInWithPopup.
  await user.getIdToken();

  const userManager = DBManager.getUserManager(user.uid);
  userManager.setLastLoginAt(new Date());
  userManager.setEmailVerified(!!user.emailVerified);

  const documentExists = await userManager.documentExists();
  if (!documentExists) {
    userManager.setCreatedAt(new Date());
    userManager.setDisplayName(user.displayName);
    userManager.setEmail(user.email);
    userManager.setPfpUrl(user.photoURL ? user.photoURL : "https://robohash.org/" + user.uid);
    userManager.setPhoneNumber(null);
  }

  await userManager.push();
}

/**
 * Persist session, upsert Firestore user doc, go to dashboard.
 * Deduped so StrictMode double-mount cannot run this twice.
 */
export async function completeGoogleSignIn(user) {
  if (!user?.uid) {
    throw new Error("Signed-in user is missing a uid.");
  }

  if (!completeSignInPromise) {
    completeSignInPromise = (async () => {
      SessionManager.setCurrentUser(toSessionUser(user));

      try {
        await upsertUserProfile(user);
      } catch (error) {
        // Auth succeeded — don't trap the user on login if Firestore rules are locked.
        console.error("Failed to sync user profile to Firestore:", error);
        if (error?.code === "permission-denied") {
          console.error(
            "Firestore denied the users/{uid} read/write. Deploy firestore.rules " +
              "(or update rules in Firebase Console) so signed-in users can access their doc."
          );
        }
      }
    })().catch((error) => {
      completeSignInPromise = null;
      throw error;
    });
  }

  await completeSignInPromise;
  // Always navigate after success — module-level promise reuse (StrictMode/HMR)
  // must not skip the redirect on later callers.
  RouteManager.redirect("/dashboard");
}

/**
 * After Google redirect (or if auth already restored), finish login if needed.
 * Always upserts the Firestore profile — do not skip just because localStorage
 * already has a uid (onAuthStateChanged can write session before the DB doc exists).
 * @returns {Promise<boolean>} true if a sign-in completion was started
 */
export async function finishGoogleSignInIfNeeded() {
  if (!finishSignInPromise) {
    finishSignInPromise = (async () => {
      let user = null;
      try {
        user = await getGoogleRedirectResult();
      } catch (error) {
        // Fall through to persisted auth; surface redirect errors to caller if neither works.
        console.error("getRedirectResult failed:", error);
        const persisted = await waitForAuthUser();
        if (!persisted) {
          throw error;
        }
        user = persisted;
      }

      if (!user) {
        user = await waitForAuthUser();
      }
      if (!user) {
        return false;
      }

      await completeGoogleSignIn(user);
      return true;
    })().catch((error) => {
      finishSignInPromise = null;
      throw error;
    });
  }

  return finishSignInPromise;
}
