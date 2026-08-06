/**
 * Optional Citrus Mongo API client (not used for browser login — that is Firebase Google).
 * Kept for future migration; POST /auth/sso is unused by the UIs.
 */
const DEFAULT_API_URL = "https://citrus-api.joed.dev";

export function getApiBaseUrl() {
  const fromEnv = (process.env.REACT_APP_API_URL || "").trim();
  let base = (fromEnv || DEFAULT_API_URL).replace(/\/$/, "");
  base = base.replace("://api.citrus.joed.dev", "://citrus-api.joed.dev");
  return base;
}

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
