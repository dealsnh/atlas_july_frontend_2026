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
  OkMessageResponse,
  SignupRequest,
} from "@/types";
import { getAccessToken, getRefreshToken } from "@/utils/authStorage";

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

function extractOkMessage(payload: unknown): OkMessageResponse {
  const next = unwrapData(payload as ApiData<unknown>);
  if (next == null || typeof next !== "object") {
    return { ok: false };
  }
  const o = next as Record<string, unknown>;
  return {
    ok: Boolean(o.ok),
    message: typeof o.message === "string" ? o.message : undefined,
  };
}

export async function forgotPassword(payload: {
  email: string;
  redirectTo: string;
}): Promise<OkMessageResponse> {
  const data = await apiInvoker<ApiData<OkMessageResponse>>(
    END_POINT.auth.forgotPassword,
    "POST",
    payload,
    undefined,
    { skipUnauthorizedRedirect: true },
  );
  return extractOkMessage(data);
}

export async function resetPassword(
  payload: { password: string },
  accessTokenFromLink: string,
): Promise<OkMessageResponse> {
  const token = accessTokenFromLink.trim();
  const data = await apiInvoker<ApiData<OkMessageResponse>>(
    END_POINT.auth.resetPassword,
    "POST",
    payload,
    undefined,
    {
      skipUnauthorizedRedirect: true,
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return extractOkMessage(data);
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
