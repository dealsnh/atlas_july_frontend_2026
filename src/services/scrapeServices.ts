import { buildApiUrl } from "@/lib/apiBaseUrl";
import apiInvoker from "@/lib/apiInvoker";
import { END_POINT } from "@/lib/apiURL";
import type { ApiData } from "@/services/apiShared";
import { unwrapData } from "@/services/apiShared";
import type {
  ScrapeRun,
  ScrapeRunsResponse,
  ScrapeStatusResponse,
  TriggerHistoricalScrapePayload,
  TriggerScrapePayload,
} from "@/types";

function extractScrapeStatus(payload: unknown): ScrapeStatusResponse {
  const next = unwrapData(payload as ApiData<ScrapeStatusResponse>);
  if (next && typeof next === "object") return next as ScrapeStatusResponse;
  return payload as ScrapeStatusResponse;
}

function extractScrapeRuns(payload: unknown): ScrapeRun[] {
  const next = unwrapData(payload as ApiData<ScrapeRunsResponse>);
  if (next && typeof next === "object" && Array.isArray(next.runs)) {
    return next.runs;
  }
  if (payload && typeof payload === "object" && Array.isArray((payload as ScrapeRunsResponse).runs)) {
    return (payload as ScrapeRunsResponse).runs;
  }
  return [];
}

export async function getScrapeStatus() {
  const data = await apiInvoker<ApiData<ScrapeStatusResponse> | ScrapeStatusResponse>(
    END_POINT.scrape.status,
    "GET",
  );
  return extractScrapeStatus(data);
}

export async function getScrapeRuns() {
  const data = await apiInvoker<ApiData<ScrapeRunsResponse> | ScrapeRunsResponse>(
    END_POINT.scrape.runs,
    "GET",
  );
  return extractScrapeRuns(data);
}

export async function triggerScrape(payload: TriggerScrapePayload) {
  return apiInvoker<unknown>(END_POINT.scrape.trigger, "POST", payload);
}

export async function triggerHistoricalScrape(payload: TriggerHistoricalScrapePayload) {
  return apiInvoker<unknown>(END_POINT.scrape.historical, "POST", payload);
}

/** SSE stream URL — use with `new EventSource(getScrapeStreamUrl())`. */
export function getScrapeStreamUrl(): string {
  return buildApiUrl(END_POINT.scrape.stream);
}
