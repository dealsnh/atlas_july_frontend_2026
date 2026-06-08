const DEFAULT_API_PREFIX = "/api/v1";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/$/, "");
}

/** Backend host origin (no trailing slash). Empty in dev → same-origin + Vite proxy. */
export function getApiOrigin(): string {
  const raw =
    typeof import.meta.env.VITE_API_BASE_URL === "string"
      ? import.meta.env.VITE_API_BASE_URL.trim()
      : "";
  return trimTrailingSlash(raw);
}

/** API version prefix from env (default `/api/v1`). */
export function getApiPrefix(): string {
  const raw =
    typeof import.meta.env.VITE_API_PREFIX === "string"
      ? import.meta.env.VITE_API_PREFIX.trim()
      : DEFAULT_API_PREFIX;
  if (!raw) return DEFAULT_API_PREFIX;
  const withLeadingSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return trimTrailingSlash(withLeadingSlash);
}

/** Host + API prefix — used where a single API root is needed. */
export function getApiBaseUrl(): string {
  const origin = getApiOrigin();
  const prefix = getApiPrefix();
  return origin ? `${origin}${prefix}` : prefix;
}

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

export function isAuthPath(path: string): boolean {
  const normalized = normalizePath(path.replace(/^https?:\/\/[^/]+/, ""));
  return normalized.startsWith("/auth");
}

/** Build a versioned API URL from a short endpoint path (e.g. `/settings`). */
export function buildApiUrl(path: string): string {
  const apiPath = `${getApiPrefix()}${normalizePath(path)}`;
  const origin = getApiOrigin();
  return origin ? `${origin}${apiPath}` : apiPath;
}

/** Build an auth URL at the host root (e.g. `/auth/login`). */
export function buildAuthUrl(path: string): string {
  const authPath = normalizePath(path);
  const origin = getApiOrigin();
  return origin ? `${origin}${authPath}` : authPath;
}

/** Resolve endpoint paths for axios (all routes use the versioned API prefix). */
export function resolveRequestUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return buildApiUrl(path);
}
