export interface ScrapeStatusResponse {
  in_progress: boolean;
  log?: string[];
}

export interface ScrapeStatusApiResponse {
  success: boolean;
  message?: string;
  data?: ScrapeStatusResponse;
  requestId?: string;
}

export interface ScrapeStreamEvent {
  in_progress: boolean;
  log?: string[];
}

export interface ScrapeRun {
  id: number;
  county: string;
  state: string;
  lead_type: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  leads_found: number;
  error: string | null;
}

export interface ScrapeRunsResponse {
  runs: ScrapeRun[];
}

export interface ScrapeRunsApiResponse {
  success: boolean;
  message?: string;
  data?: ScrapeRunsResponse;
  requestId?: string;
}

export interface TriggerScrapePayload {
  from_date: string;
  to_date: string;
  /** Restrict the run to a single county (matches the backend county name). */
  county?: string;
  /** Restrict the run to a single lead type. */
  lead_type?: string;
}

export interface TriggerScrapeData {
  ok: boolean;
  message?: string;
  from_date: string;
  to_date: string;
}

export interface TriggerScrapeApiResponse {
  success: boolean;
  message?: string;
  data?: TriggerScrapeData;
  requestId?: string;
}

export interface TriggerHistoricalScrapePayload {
  days_back: number;
}
