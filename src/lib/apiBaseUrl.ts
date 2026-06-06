/** Backend origin for absolute URLs (axios baseURL, EventSource, window.open exports). */
export function getApiBaseUrl(): string {
  const raw =
    typeof import.meta.env.VITE_API_BASE_URL === "string"
      ? import.meta.env.VITE_API_BASE_URL.trim()
      : "";
  return raw.replace(/\/$/, "");
}

/** Build a full API URL from a path (handles empty base = same-origin / Vite proxy). */
export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const base = getApiBaseUrl();
  return base ? `${base}${normalizedPath}` : normalizedPath;
}
