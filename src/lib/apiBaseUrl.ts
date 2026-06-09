/** Same-origin API root when `VITE_API_BASE_URL` is empty (Vite dev proxy). */
const DEFAULT_API_BASE_URL = "/api/v1";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/$/, "");
}

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

/** API root from env (includes version prefix, no trailing slash). */
export function getApiBaseUrl(): string {
  const raw =
    typeof import.meta.env.VITE_API_BASE_URL === "string"
      ? import.meta.env.VITE_API_BASE_URL.trim()
      : "";
  if (!raw) return DEFAULT_API_BASE_URL;
  return trimTrailingSlash(raw);
}

/** Build a full API URL from a short endpoint path (e.g. `/settings`). */
export function buildApiUrl(path: string): string {
  return `${getApiBaseUrl()}${normalizePath(path)}`;
}

/** Resolve endpoint paths for axios (relative to `getApiBaseUrl()`). */
export function resolveRequestUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return normalizePath(path);
}
