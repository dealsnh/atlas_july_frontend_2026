import { buildApiUrl } from "@/lib/apiBaseUrl";
import apiInvoker from "@/lib/apiInvoker";
import { END_POINT } from "@/lib/apiURL";
import type { ApiData } from "@/services/apiShared";
import { unwrapData } from "@/services/apiShared";
import type {
  LeadStats,
  LeadsExportParams,
  LeadsListParams,
  LeadsListResponse,
  SkipTraceResponse,
  UpdateLeadStatusPayload,
} from "@/types";

function extractLeads(payload: unknown): LeadsListResponse {
  const next = unwrapData(payload as ApiData<LeadsListResponse>);
  if (next && typeof next === "object" && Array.isArray(next.leads)) {
    return { leads: next.leads };
  }
  if (payload && typeof payload === "object" && Array.isArray((payload as LeadsListResponse).leads)) {
    return payload as LeadsListResponse;
  }
  return { leads: [] };
}

function extractStats(payload: unknown): LeadStats {
  const next = unwrapData(payload as ApiData<LeadStats>);
  if (next && typeof next === "object") return next as LeadStats;
  return payload as LeadStats;
}

export async function getLeads(params: LeadsListParams = {}) {
  const data = await apiInvoker<ApiData<LeadsListResponse> | LeadsListResponse>(
    END_POINT.leads.list,
    "GET",
    undefined,
    params,
  );
  return extractLeads(data);
}

export async function getLeadStats() {
  const data = await apiInvoker<ApiData<LeadStats> | LeadStats>(
    END_POINT.stats.summary,
    "GET",
  );
  return extractStats(data);
}

export async function updateLeadStatus(id: string, payload: UpdateLeadStatusPayload) {
  return apiInvoker<unknown>(END_POINT.leads.byId(id), "PATCH", payload);
}

export async function skipTraceLead(id: string) {
  const data = await apiInvoker<ApiData<SkipTraceResponse> | SkipTraceResponse>(
    END_POINT.leads.skipTrace(id),
    "POST",
  );
  const next = unwrapData(data as ApiData<SkipTraceResponse>);
  if (next && typeof next === "object") return next as SkipTraceResponse;
  return data as SkipTraceResponse;
}

export function buildLeadsExportUrl(params: LeadsExportParams = {}): string {
  const search = new URLSearchParams();
  if (params.county) search.set("county", params.county);
  if (params.lead_type) search.set("lead_type", params.lead_type);
  if (params.status) search.set("status", params.status);
  if (params.from_date) search.set("from_date", params.from_date);
  if (params.to_date) search.set("to_date", params.to_date);
  const qs = search.toString();
  const path = qs ? `${END_POINT.leads.export}?${qs}` : END_POINT.leads.export;
  return buildApiUrl(path);
}
