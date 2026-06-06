/** Parses Vite env flags (`"true"` / `"TRUE"` / etc.). */
export function isTruthyEnvString(value: string | undefined): boolean {
  return String(value ?? "").trim().toLowerCase() === "true";
}

/** When the API relies on cookies (cross-origin or HttpOnly session), set `VITE_API_WITH_CREDENTIALS=true`. */
export function isApiWithCredentialsEnabled(): boolean {
  return isTruthyEnvString(import.meta.env.VITE_API_WITH_CREDENTIALS);
}
