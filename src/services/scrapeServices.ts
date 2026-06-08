import { buildApiUrl } from "@/lib/apiBaseUrl";
import { isApiWithCredentialsEnabled } from "@/lib/apiClientEnv";
import apiInvoker from "@/lib/apiInvoker";
import { END_POINT } from "@/lib/apiURL";
import type { ApiData } from "@/services/apiShared";
import { getMessageFromApiPayload, unwrapData } from "@/services/apiShared";
import type {
  ScrapeRun,
  ScrapeRunsApiResponse,
  ScrapeRunsResponse,
  ScrapeStatusApiResponse,
  ScrapeStatusResponse,
  ScrapeStreamEvent,
  TriggerHistoricalScrapePayload,
  TriggerScrapeApiResponse,
  TriggerScrapeData,
  TriggerScrapePayload,
} from "@/types";
import { getAccessToken } from "@/utils/authStorage";

function assertApiSuccess(payload: unknown, fallbackMessage: string): void {
  if (!payload || typeof payload !== "object" || !("success" in payload)) return;

  const envelope = payload as { success: boolean };
  if (!envelope.success) {
    throw new Error(getMessageFromApiPayload(payload) || fallbackMessage);
  }
}

function extractScrapeStatus(payload: unknown): ScrapeStatusResponse {
  if (payload && typeof payload === "object" && "success" in payload) {
    const envelope = payload as ScrapeStatusApiResponse;
    assertApiSuccess(payload, "Failed to load scrape status");
    if (!envelope.data) {
      throw new Error(getMessageFromApiPayload(payload) || "Failed to load scrape status");
    }
    return envelope.data;
  }

  const next = unwrapData(payload as ApiData<ScrapeStatusResponse>);
  if (next && typeof next === "object") return next as ScrapeStatusResponse;
  return payload as ScrapeStatusResponse;
}

function extractScrapeRuns(payload: unknown): ScrapeRun[] {
  if (payload && typeof payload === "object" && "success" in payload) {
    const envelope = payload as ScrapeRunsApiResponse;
    assertApiSuccess(payload, "Failed to load scrape runs");
    return envelope.data?.runs ?? [];
  }

  const next = unwrapData(payload as ApiData<ScrapeRunsResponse>);
  if (next && typeof next === "object" && Array.isArray(next.runs)) {
    return next.runs;
  }
  if (payload && typeof payload === "object" && Array.isArray((payload as ScrapeRunsResponse).runs)) {
    return (payload as ScrapeRunsResponse).runs;
  }
  return [];
}

function extractTriggerScrapeResponse(payload: unknown): TriggerScrapeData {
  if (payload && typeof payload === "object" && "success" in payload) {
    const envelope = payload as TriggerScrapeApiResponse;
    assertApiSuccess(payload, "Failed to start scrape");
    if (!envelope.data) {
      throw new Error(getMessageFromApiPayload(payload) || "Failed to start scrape");
    }
    return envelope.data;
  }

  const next = unwrapData(payload as ApiData<TriggerScrapeData>);
  if (next && typeof next === "object") return next as TriggerScrapeData;
  return payload as TriggerScrapeData;
}

export async function getScrapeStatus(): Promise<ScrapeStatusResponse> {
  const data = await apiInvoker<ScrapeStatusApiResponse>(END_POINT.scrape.status, "GET");
  return extractScrapeStatus(data);
}

export async function getScrapeRuns(): Promise<ScrapeRun[]> {
  const data = await apiInvoker<ScrapeRunsApiResponse>(END_POINT.scrape.runs, "GET");
  return extractScrapeRuns(data);
}

export async function triggerScrape(payload: TriggerScrapePayload): Promise<TriggerScrapeData> {
  const data = await apiInvoker<TriggerScrapeApiResponse>(
    END_POINT.scrape.trigger,
    "POST",
    payload,
  );
  return extractTriggerScrapeResponse(data);
}

export async function triggerHistoricalScrape(payload: TriggerHistoricalScrapePayload) {
  return apiInvoker<unknown>(END_POINT.scrape.historical, "POST", payload);
}

/** SSE stream URL for scrape log updates. */
export function getScrapeStreamUrl(): string {
  return buildApiUrl(END_POINT.scrape.stream);
}

export type ScrapeStreamHandlers = {
  onEvent: (event: ScrapeStreamEvent) => void;
  onError?: (error: unknown) => void;
  onClose?: () => void;
};

function parseSseChunk(chunk: string, onEvent: (event: ScrapeStreamEvent) => void): void {
  for (const line of chunk.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;

    const json = trimmed.slice(5).trim();
    if (!json) continue;

    try {
      onEvent(JSON.parse(json) as ScrapeStreamEvent);
    } catch {
      // Ignore malformed SSE payloads.
    }
  }
}

/**
 * Subscribe to `GET /api/v1/scrape/stream` using fetch so the Bearer token is sent.
 * Returns an unsubscribe function that aborts the stream.
 */
export function subscribeScrapeStream(handlers: ScrapeStreamHandlers): () => void {
  const controller = new AbortController();

  void (async () => {
    try {
      const token = getAccessToken();
      const headers: Record<string, string> = {
        Accept: "text/event-stream",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(getScrapeStreamUrl(), {
        headers,
        signal: controller.signal,
        credentials: isApiWithCredentialsEnabled() ? "include" : "same-origin",
      });

      if (!response.ok) {
        throw new Error(`Scrape stream failed (${response.status})`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Scrape stream returned no body");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let boundary = buffer.indexOf("\n\n");
        while (boundary !== -1) {
          const chunk = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          parseSseChunk(chunk, handlers.onEvent);
          boundary = buffer.indexOf("\n\n");
        }
      }

      if (buffer.trim()) {
        parseSseChunk(buffer, handlers.onEvent);
      }

      handlers.onClose?.();
    } catch (error) {
      if (!controller.signal.aborted) {
        handlers.onError?.(error);
      }
    }
  })();

  return () => controller.abort();
}
