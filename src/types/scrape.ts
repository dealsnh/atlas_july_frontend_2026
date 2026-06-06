export interface ScrapeStatusResponse {
  in_progress: boolean;
  log?: string[];
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

export interface TriggerScrapePayload {
  from_date?: string;
  to_date?: string;
}

export interface TriggerHistoricalScrapePayload {
  days_back: number;
}
