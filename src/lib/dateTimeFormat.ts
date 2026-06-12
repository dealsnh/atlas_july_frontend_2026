const DEFAULT_DATETIME_OPTIONS: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
};

function parseApiDateTime(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const normalized = trimmed.includes("T") ? trimmed : `${trimmed}T00:00:00`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Format an ISO or date-only string for display. */
function formatDateTime(
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions = DEFAULT_DATETIME_OPTIONS,
  fallback = "Never",
): string {
  if (!value?.trim()) return fallback;

  const date = parseApiDateTime(value);
  if (!date) return fallback;

  return date.toLocaleString("en-US", options);
}

/** Compact scrape timestamp for dashboard cards. */
export function formatLastScrapeTime(value: string | null | undefined): string {
  return formatDateTime(value, DEFAULT_DATETIME_OPTIONS, "Never");
}

export function getLastScrapeTimestamp(stats: {
  lastScrapeTime?: string | null;
  lastRun?: string | null;
}): string | null {
  return stats.lastScrapeTime?.trim() || stats.lastRun?.trim() || null;
}
