import { SessionManager } from "./sessionManager";
import { RouteManager } from "./routeManager";
import { clearTokensAndSsoSignOut, exchangeSsoSession } from "./citrusApi";

/**
 * Plain session object for localStorage (matches prior Firebase shape).
 */
export function toSessionUserFromApi(user) {
  if (!user) {
    return null;
  }
  const pd = user.personalData || {};
  return {
    uid: user.id,
    email: pd.email ?? null,
    displayName: pd.displayName ?? null,
    photoURL: pd.pfpUrl ?? null,
    emailVerified: !!(user.metadata && user.metadata.emailVerified),
    phoneNumber: pd.phoneNumber ?? null,
  };
}

let completeSignInPromise = null;
let finishSignInPromise = null;

function persistAuthResponse(body) {
  if (!body?.accessToken || !body?.user) {
    throw new Error("SSO login response missing accessToken or user.");
  }
  localStorage.setItem("citrus:accessToken", body.accessToken);
  if (body.expiresIn) {
    localStorage.setItem(
      "citrus:accessTokenExpiresAt",
      String(Date.now() + body.expiresIn * 1000)
    );
  }
  SessionManager.setCurrentUser(toSessionUserFromApi(body.user));
}

/**
 * Persist API SSO session and go to dashboard.
 */
export async function completeSsoSignIn(authResponse) {
  if (!completeSignInPromise) {
    completeSignInPromise = (async () => {
      persistAuthResponse(authResponse);
    })().catch((error) => {
      completeSignInPromise = null;
      throw error;
    });
  }
  await completeSignInPromise;
  RouteManager.redirect("/dashboard");
}

/**
 * Call POST /auth/sso (browser already has joed.dev SSO cookie via Traefik).
 */
export async function signInWithJoedSso() {
  const body = await exchangeSsoSession();
  await completeSsoSignIn(body);
  return body;
}

/**
 * If we already have a Citrus session, stay put; otherwise try SSO exchange.
 * @returns {Promise<boolean>} true if sign-in completed / redirected
 */
export async function finishSsoSignInIfNeeded() {
  if (!finishSignInPromise) {
    finishSignInPromise = (async () => {
      if (SessionManager.getCurrentUser() && localStorage.getItem("citrus:accessToken")) {
        RouteManager.redirect("/dashboard");
        return true;
      }
      try {
        await signInWithJoedSso();
        return true;
      } catch (error) {
        // Not SSO'd yet or API unreachable — show login button.
        console.error("SSO session exchange failed:", error);
        return false;
      }
    })().catch((error) => {
      finishSignInPromise = null;
      throw error;
    });
  }
  return finishSignInPromise;
}

export function ssoSignOutRedirect() {
  SessionManager.clearLS();
  clearTokensAndSsoSignOut();
}

// Back-compat aliases used by older imports during the Firebase → SSO switch.
export const finishGoogleSignInIfNeeded = finishSsoSignInIfNeeded;
export const completeGoogleSignIn = completeSsoSignIn;
