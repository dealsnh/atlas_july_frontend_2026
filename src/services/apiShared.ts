import type { AuthResponse, AuthUser } from "@/types";

export type ApiData<T> = T | { data?: T };

export type ApiErrorBody = {
  message?: string;
  details?: Record<string, unknown>;
  stack?: string;
};

export function unwrapData<T>(payload: ApiData<T>): T | undefined {
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data;
  }
  return payload as T;
}

/** Extract a user-facing message from API success or error payloads. */
export function getMessageFromApiPayload(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;

  const root = payload as Record<string, unknown>;
  if (typeof root.message === "string" && root.message.trim()) {
    return root.message.trim();
  }

  const error = root.error;
  if (error && typeof error === "object") {
    const message = (error as ApiErrorBody).message;
    if (typeof message === "string" && message.trim()) return message.trim();
  }

  const data = unwrapData(payload as ApiData<Record<string, unknown>>);
  if (data && typeof data === "object") {
    if (typeof data.message === "string" && data.message.trim()) {
      return data.message.trim();
    }
    if (typeof data.error === "string" && data.error.trim()) {
      return data.error.trim();
    }
  }

  return undefined;
}

export type ParsedAuthSession = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser | undefined;
};

/** Login and `/auth/refresh` share this shape. */
export function parseAuthSessionFromPayload(
  payload: unknown,
  fallbackRefreshToken: string,
): ParsedAuthSession | null {
  if (payload && typeof payload === "object" && "data" in payload) {
    const data = (payload as { data?: unknown }).data;
    if (data && typeof data === "object") {
      const session = data as { user?: AuthUser; token?: string };
      const accessToken = typeof session.token === "string" ? session.token.trim() : "";
      if (accessToken) {
        return {
          accessToken,
          refreshToken: fallbackRefreshToken.trim(),
          user: session.user,
        };
      }
    }
  }

  const auth = unwrapData(payload as ApiData<AuthResponse>);
  if (auth == null || typeof auth !== "object") return null;

  const accessRaw = auth.session?.access_token ?? auth.token;
  const accessToken = typeof accessRaw === "string" ? accessRaw.trim() : "";
  if (!accessToken) return null;

  const refreshRaw = auth.session?.refresh_token;
  const nextRefresh =
    typeof refreshRaw === "string" && refreshRaw.trim()
      ? refreshRaw.trim()
      : fallbackRefreshToken.trim();

  const user = (auth.session?.user ?? auth.user) as AuthUser | undefined;
  const fallback = fallbackRefreshToken.trim();

  return {
    accessToken,
    refreshToken: nextRefresh || fallback,
    user,
  };
}
