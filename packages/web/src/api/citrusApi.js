const DEFAULT_API_URL = "https://citrus-api.joed.dev";

export function getApiBaseUrl() {
  const fromEnv = (process.env.REACT_APP_API_URL || "").trim();
  let base = (fromEnv || DEFAULT_API_URL).replace(/\/$/, "");
  // api.citrus.joed.dev often has no public DNS; normalize to the working host.
  base = base.replace("://api.citrus.joed.dev", "://citrus-api.joed.dev");
  return base;
}

/**
 * Browser → Citrus API. Sends joed.dev SSO cookies (credentials: include).
 */
export async function apiFetch(path, options = {}) {
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = localStorage.getItem("citrus:accessToken");
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  let body = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const err = new Error(
      (body && body.message) || `API ${res.status} ${res.statusText}`
    );
    err.status = res.status;
    err.code = body && body.code;
    err.body = body;
    throw err;
  }
  return body;
}

/** Exchange Traefik SSO session for a Citrus JWT. */
export function exchangeSsoSession() {
  return apiFetch("/auth/sso", { method: "POST" });
}

const SSO_SIGN_OUT =
  "https://auth.joed.dev/oauth2/sign_out?rd=https://citrus.joed.dev/";

/** Clear Citrus tokens and redirect through joed.dev SSO sign-out. */
export function clearTokensAndSsoSignOut() {
  localStorage.removeItem("citrus:accessToken");
  localStorage.removeItem("citrus:accessTokenExpiresAt");
  window.location.href = SSO_SIGN_OUT;
}
