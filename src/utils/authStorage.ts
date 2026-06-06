import type { AuthUser } from "@/types";

/**
 * Session persistence for the SPA.
 *
 * Default: bearer access/refresh tokens in `localStorage`.
 * Cookie-based sessions: set `VITE_API_WITH_CREDENTIALS=true` once the API uses HttpOnly cookies.
 */
export const AUTH_SESSION_STORAGE_MODE = "browser-local-storage" as const;

const AUTH_TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "user";

export type PersistedSession = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
};

export function saveAuthState(state: PersistedSession): void {
  if (typeof window === "undefined") return;

  if (state.accessToken) {
    localStorage.setItem(AUTH_TOKEN_KEY, state.accessToken);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }

  if (state.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, state.refreshToken);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  if (state.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(state.user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const storedUser = localStorage.getItem(USER_KEY);
  if (!storedUser) return null;
  try {
    return JSON.parse(storedUser) as AuthUser;
  } catch {
    return null;
  }
}

export function loadAuthState(): PersistedSession | null {
  if (typeof window === "undefined") return null;

  const accessToken = localStorage.getItem(AUTH_TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  const user = getStoredUser();

  if (!accessToken || !user) return null;

  return { accessToken, refreshToken, user };
}

export function clearAuthState(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getAccessToken(): string {
  if (typeof window === "undefined") return "";
  return (localStorage.getItem(AUTH_TOKEN_KEY) ?? "").trim();
}

export function getRefreshToken(): string {
  if (typeof window === "undefined") return "";
  return (localStorage.getItem(REFRESH_TOKEN_KEY) ?? "").trim();
}

export function getAccessTokenOrThrow(): string {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Missing access token. Please login again.");
  }
  return accessToken;
}
