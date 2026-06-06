import axios, { AxiosHeaders, type AxiosError, type AxiosResponse } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { APP_ROUTES } from "@/constants/appRoutes";
import { getApiBaseUrl } from "@/lib/apiBaseUrl";
import { isApiWithCredentialsEnabled } from "@/lib/apiClientEnv";
import { END_POINT } from "@/lib/apiURL";
import { parseAuthSessionFromPayload } from "@/services/apiShared";
import { getAccessToken, getRefreshToken } from "@/utils/authStorage";

const baseURL = getApiBaseUrl();
const REQUEST_TIMEOUT_MS = 30_000;

if (import.meta.env.DEV && baseURL === "") {
  console.warn("[Atlas] VITE_API_BASE_URL is empty — using same-origin /api paths (Vite dev proxy).");
}

declare module "axios" {
  export interface InternalAxiosRequestConfig {
    skipUnauthorizedRedirect?: boolean;
    _retry?: boolean;
  }
}

type FailedQueueItem = {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
};

let isRefreshing = false;
let failedQueue: FailedQueueItem[] = [];

function processQueue(error: unknown | null = null, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error != null) reject(error);
    else resolve(token);
  });
  failedQueue = [];
}

function resolvedRequestPath(config: InternalAxiosRequestConfig): string {
  const u = config.url ?? "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return u.startsWith("/") ? u : `/${u}`;
}

function isPublicAuthFailureUrl(pathOrUrl: string): boolean {
  return (
    pathOrUrl.includes(END_POINT.auth.login) ||
    pathOrUrl.includes(END_POINT.auth.signup) ||
    pathOrUrl.includes(END_POINT.auth.logout) ||
    pathOrUrl.includes(END_POINT.auth.forgotPassword) ||
    pathOrUrl.includes(END_POINT.auth.resetPassword)
  );
}

function isRefreshRequest(pathOrUrl: string): boolean {
  return pathOrUrl.includes(END_POINT.auth.refresh);
}

function redirectToLoginIfNeeded(): void {
  if (typeof window === "undefined") return;
  const pathname = window.location.pathname;
  if (pathname.startsWith(APP_ROUTES.LOGIN)) return;
  window.location.assign(APP_ROUTES.LOGIN);
}

function setBearerHeader(config: InternalAxiosRequestConfig, token: string): void {
  const headers = AxiosHeaders.from(config.headers ?? {});
  headers.set("Authorization", `Bearer ${token}`);
  config.headers = headers;
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token available");

  const url = `${baseURL.replace(/\/$/, "")}${END_POINT.auth.refresh}`;
  const response = await axios.post(
    url,
    { refresh_token: refreshToken },
    {
      headers: { "Content-Type": "application/json" },
      withCredentials: isApiWithCredentialsEnabled(),
    },
  );

  const parsed = parseAuthSessionFromPayload(response.data, refreshToken);
  if (!parsed) {
    throw new Error("Invalid refresh token response");
  }

  const { useAuthStore } = await import("@/store/auth/authStore");
  const applied = useAuthStore
    .getState()
    .applyRefreshedSession(parsed.accessToken, parsed.refreshToken, parsed.user ?? null);
  if (!applied) {
    throw new Error("Could not persist refreshed session");
  }

  return parsed.accessToken;
}

let unauthorizedPipeline: Promise<void> | null = null;

async function clearSessionDueToUnauthorizedAndRedirect(): Promise<void> {
  if (!unauthorizedPipeline) {
    unauthorizedPipeline = (async () => {
      try {
        const { useAuthStore } = await import("@/store/auth/authStore");
        useAuthStore.getState().clearSessionDueToUnauthorized();
      } finally {
        unauthorizedPipeline = null;
        redirectToLoginIfNeeded();
      }
    })();
  }
  await unauthorizedPipeline;
}

const axiosInstance = axios.create({
  baseURL,
  timeout: REQUEST_TIMEOUT_MS,
  withCredentials: isApiWithCredentialsEnabled(),
  headers: {
    "Content-Type": "application/json",
  },
  validateStatus: (status) => status >= 200 && status < 300,
});

axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const headers = AxiosHeaders.from(config.headers ?? {});
  if (!headers.has("X-Request-ID")) {
    headers.set("X-Request-ID", crypto.randomUUID());
  }
  const token = getAccessToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  config.headers = headers;
  return config;
});

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error);

    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;
    const originalRequest = axiosError.config as InternalAxiosRequestConfig | undefined;

    if (status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    const path = resolvedRequestPath(originalRequest);

    if (originalRequest.skipUnauthorizedRedirect === true || isPublicAuthFailureUrl(path)) {
      return Promise.reject(error);
    }

    if (isRefreshRequest(path)) {
      try {
        await clearSessionDueToUnauthorizedAndRedirect();
      } catch {
        redirectToLoginIfNeeded();
      }
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      try {
        await clearSessionDueToUnauthorizedAndRedirect();
      } catch {
        redirectToLoginIfNeeded();
      }
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          setBearerHeader(originalRequest, token as string);
          return axiosInstance(originalRequest);
        })
        .catch((err: unknown) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const newAccessToken = await refreshAccessToken();
      setBearerHeader(originalRequest, newAccessToken);
      processQueue(null, newAccessToken);
      return axiosInstance(originalRequest);
    } catch (refreshError: unknown) {
      processQueue(refreshError, null);
      try {
        await clearSessionDueToUnauthorizedAndRedirect();
      } catch {
        redirectToLoginIfNeeded();
      }
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);

export default axiosInstance;
