import type { AuthResponse, AuthUser } from "@/types";

export type ApiData<T> = T | { data?: T };

export function unwrapData<T>(payload: ApiData<T>): T | undefined {
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data;
  }
  return payload as T;
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
