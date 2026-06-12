import apiInvoker from "@/lib/apiInvoker";
import { END_POINT } from "@/lib/apiURL";
import type { ApiData } from "@/services/apiShared";
import {
  getMessageFromApiPayload,
  parseAuthSessionFromPayload,
  unwrapData,
  type ParsedAuthSession,
} from "@/services/apiShared";
import type {
  AuthResponse,
  AuthSessionApiResponse,
  LoginRequest,
  SignupRequest,
} from "@/types";
import { getAccessToken, getRefreshToken } from "@/lib/authStorage";

function extractAuthSession(payload: unknown, fallbackMessage: string): ParsedAuthSession {
  if (payload && typeof payload === "object" && "success" in payload) {
    const envelope = payload as AuthSessionApiResponse;
    if (!envelope.success) {
      throw new Error(getMessageFromApiPayload(payload) || fallbackMessage);
    }
  }

  const parsed = parseAuthSessionFromPayload(payload, "");
  if (!parsed?.accessToken || !parsed.user) {
    throw new Error(getMessageFromApiPayload(payload) || fallbackMessage);
  }

  return parsed;
}

function extractAuthResponse(payload: unknown): AuthResponse {
  const next = unwrapData(payload as ApiData<AuthResponse>);
  if (next && typeof next === "object") return next as AuthResponse;
  return {};
}

export async function login(body: LoginRequest): Promise<ParsedAuthSession> {
  const data = await apiInvoker<AuthSessionApiResponse>(END_POINT.auth.login, "POST", body, undefined, {
    skipUnauthorizedRedirect: true,
  });
  return extractAuthSession(data, "Login failed");
}

export async function signup(payload: SignupRequest): Promise<ParsedAuthSession> {
  const data = await apiInvoker<AuthSessionApiResponse>(END_POINT.auth.signup, "POST", payload, undefined, {
    skipUnauthorizedRedirect: true,
  });
  return extractAuthSession(data, "Signup failed");
}

export async function logout(token?: string) {
  const authToken = (token ?? getAccessToken()).trim();
  const refreshToken = getRefreshToken();
  const data = await apiInvoker<ApiData<AuthResponse>>(
    END_POINT.auth.logout,
    "POST",
    {
      access_token: authToken,
      ...(refreshToken ? { refresh_token: refreshToken } : {}),
    },
    undefined,
    { skipUnauthorizedRedirect: true },
  );
  return extractAuthResponse(data);
}
