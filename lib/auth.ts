import { API_BASE_URL } from "@/lib/api";

/**
 * Client side of the password gate.
 *
 * The real enforcement lives on the API (every endpoint 401s without a
 * valid bearer token) — this module only exchanges the password for a
 * session token and attaches it to requests. The password itself is sent
 * once over HTTPS at login and never persisted anywhere in the browser;
 * only the expiring server-signed token is kept, in sessionStorage, so
 * closing the tab ends the session.
 */

const TOKEN_STORAGE_KEY = "anomaly-dashboard.session-token";

// Auth state is an external store (sessionStorage) — components read it
// through useSyncExternalStore, so login/logout re-render subscribers.
const authListeners = new Set<() => void>();

function notifyAuthChange(): void {
  authListeners.forEach((listener) => listener());
}

export function subscribeToAuth(listener: () => void): () => void {
  authListeners.add(listener);
  return () => authListeners.delete(listener);
}

export function isAuthed(): boolean {
  return getAuthToken() !== null;
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null; // storage blocked (private mode / embedded) — treat as signed out
  }
}

function setAuthToken(token: string): void {
  try {
    window.sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch (err) {
    console.error("[auth] could not persist session token", err);
  }
  notifyAuthChange();
}

export function clearAuthToken(): void {
  try {
    window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // nothing to clear
  }
  notifyAuthChange();
}

/** Merge the bearer token into request headers (no-op when signed out). */
export function withAuthHeaders(headers: Record<string, string> = {}): Record<string, string> {
  const token = getAuthToken();
  return token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
}

/**
 * Token rejected or expired: drop it and reload so the password gate takes
 * over. Reload (rather than in-place state) guarantees every in-flight
 * query and cached view is torn down with the session.
 */
export function handleUnauthorized(): void {
  clearAuthToken();
  if (typeof window !== "undefined") {
    window.location.reload();
  }
}

export class LoginError extends Error {}

export async function login(password: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
  } catch {
    throw new LoginError("Cannot reach the server. Check your connection and try again.");
  }

  if (!res.ok) {
    let detail: string | null = null;
    try {
      detail = ((await res.json()) as { detail?: string }).detail ?? null;
    } catch {
      // fall through to status-based messages
    }
    if (res.status === 401) throw new LoginError(detail ?? "Incorrect password.");
    if (res.status === 429)
      throw new LoginError(detail ?? "Too many attempts. Wait a few minutes and try again.");
    if (res.status === 503)
      throw new LoginError(detail ?? "The server has no password configured (APP_PASSWORD).");
    throw new LoginError(detail ?? `Sign-in failed (${res.status}).`);
  }

  const body = (await res.json()) as { token?: string };
  if (typeof body.token !== "string" || body.token.length === 0) {
    throw new LoginError("The server returned an invalid session token.");
  }
  setAuthToken(body.token);
}
