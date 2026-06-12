import { AxiosError } from "axios";
import { resolveRequestUrl } from "@/lib/apiBaseUrl";
import { downloadBlob, parseFilenameFromContentDisposition } from "@/lib/downloadFile";
import apiInvoker from "@/lib/apiInvoker";
import axiosInstance from "@/lib/axiosInstance";
import { END_POINT } from "@/lib/apiURL";
import type { ApiData } from "@/services/apiShared";
import { getMessageFromApiPayload, unwrapData } from "@/services/apiShared";
import type {
  DeleteLeadsApiResponse,
  DeleteLeadsData,
  DeleteLeadsPayload,
  EnrichLeadsApiResponse,
  EnrichLeadsData,
  EnrichLeadsPayload,
  LeadStats,
  LeadStatsApiResponse,
  LeadsExportParams,
  LeadsListApiResponse,
  LeadsListParams,
  LeadsListResponse,
  SkipTraceApiResponse,
  SkipTraceData,
  SkipTraceResult,
  UpdateLeadApiResponse,
  UpdateLeadPayload,
} from "@/types";

function assertApiSuccess(payload: unknown, fallbackMessage: string): void {
  if (!payload || typeof payload !== "object" || !("success" in payload)) return;

  const envelope = payload as { success: boolean };
  if (!envelope.success) {
    throw new Error(getMessageFromApiPayload(payload) || fallbackMessage);
  }
}

function extractLeads(payload: unknown): LeadsListResponse {
  if (payload && typeof payload === "object" && "success" in payload) {
    const envelope = payload as LeadsListApiResponse;
    assertApiSuccess(envelope, "Failed to load leads");
    return {
      leads: envelope.data.leads ?? [],
      total: envelope.data.total ?? envelope.data.leads?.length ?? 0,
    };
  }

  const next = unwrapData(payload as ApiData<LeadsListResponse>);
  if (next && typeof next === "object" && Array.isArray(next.leads)) {
    return {
      leads: next.leads,
      total: next.total ?? next.leads.length,
    };
  }
  if (payload && typeof payload === "object" && Array.isArray((payload as LeadsListResponse).leads)) {
    const legacy = payload as LeadsListResponse;
    return { leads: legacy.leads, total: legacy.total ?? legacy.leads.length };
  }
  return { leads: [], total: 0 };
}

function extractStats(payload: unknown): LeadStats {
  if (payload && typeof payload === "object" && "success" in payload) {
    const envelope = payload as LeadStatsApiResponse;
    assertApiSuccess(envelope, "Failed to load stats");
    return envelope.data;
  }

  const next = unwrapData(payload as ApiData<LeadStats>);
  if (next && typeof next === "object") return next as LeadStats;
  return payload as LeadStats;
}

export async function getLeads(params: LeadsListParams = {}) {
  const data = await apiInvoker<LeadsListApiResponse | ApiData<LeadsListResponse> | LeadsListResponse>(
    END_POINT.leads.list,
    "GET",
    undefined,
    params,
  );
  return extractLeads(data);
}

export async function getLeadStats() {
  const data = await apiInvoker<LeadStatsApiResponse | ApiData<LeadStats> | LeadStats>(
    END_POINT.stats.summary,
    "GET",
  );
  return extractStats(data);
}

function extractUpdateLeadResponse(payload: unknown): { ok: boolean } {
  if (payload && typeof payload === "object" && "success" in payload) {
    const envelope = payload as UpdateLeadApiResponse;
    assertApiSuccess(envelope, "Failed to update lead");
    return envelope.data ?? { ok: true };
  }

  const next = unwrapData(payload as ApiData<{ ok: boolean }>);
  if (next && typeof next === "object") return next;
  return { ok: true };
}

export async function updateLead(id: string, payload: UpdateLeadPayload) {
  const data = await apiInvoker<UpdateLeadApiResponse | ApiData<{ ok: boolean }>>(
    END_POINT.leads.byId(id),
    "PATCH",
    payload,
  );
  return extractUpdateLeadResponse(data);
}

function normalizeSkipTraceData(data?: SkipTraceData): SkipTraceResult {
  if (!data) return {};
  return {
    phone: data.phone ?? data.st_phone ?? null,
    email: data.email ?? data.st_email ?? null,
    mailing: data.mailing ?? data.st_mailing ?? null,
  };
}

function extractSkipTraceResponse(payload: unknown): SkipTraceResult {
  if (payload && typeof payload === "object" && "success" in payload) {
    const envelope = payload as SkipTraceApiResponse;
    assertApiSuccess(envelope, "Skip trace failed");
    return normalizeSkipTraceData(envelope.data);
  }

  const next = unwrapData(payload as ApiData<SkipTraceData>);
  if (next && typeof next === "object") return normalizeSkipTraceData(next);

  if (payload && typeof payload === "object") {
    const legacy = payload as SkipTraceData & { success?: boolean };
    if (legacy.success === false) {
      throw new Error(getMessageFromApiPayload(payload) || "Skip trace failed");
    }
    return normalizeSkipTraceData(legacy);
  }

  return {};
}

export async function skipTraceLead(id: string) {
  const data = await apiInvoker<SkipTraceApiResponse | ApiData<SkipTraceData>>(
    END_POINT.leads.skipTrace(id),
    "POST",
  );
  return extractSkipTraceResponse(data);
}

function buildLeadsExportQuery(params: LeadsExportParams = {}): Record<string, string> {
  const query: Record<string, string> = {};
  if (params.county) query.county = params.county;
  if (params.lead_type) query.lead_type = params.lead_type;
  if (params.status) query.status = params.status;
  if (params.from_date) query.from_date = params.from_date;
  if (params.to_date) query.to_date = params.to_date;
  return query;
}

async function readBlobErrorMessage(blob: Blob): Promise<string> {
  const text = await blob.text();
  try {
    return getMessageFromApiPayload(JSON.parse(text)) || "Export failed";
  } catch {
    return text.trim() || "Export failed";
  }
}

function buildDeleteLeadsPayload(payload: DeleteLeadsPayload): DeleteLeadsPayload {
  const next: DeleteLeadsPayload = {};
  const county = payload.county?.trim();
  const sourceUrl = payload.source_url?.trim();
  const ownerNameContains = payload.owner_name_contains?.trim();
  if (county) next.county = county;
  if (sourceUrl) next.source_url = sourceUrl;
  if (ownerNameContains) next.owner_name_contains = ownerNameContains;
  return next;
}

function extractDeleteLeadsResponse(payload: unknown): DeleteLeadsData {
  if (payload && typeof payload === "object" && "success" in payload) {
    const envelope = payload as DeleteLeadsApiResponse;
    assertApiSuccess(envelope, "Failed to delete leads");
    return {
      deleted: envelope.data?.deleted ?? 0,
      ok: envelope.data?.ok,
    };
  }

  const next = unwrapData(payload as ApiData<DeleteLeadsData>);
  if (next && typeof next === "object" && "deleted" in next) {
    return { deleted: Number(next.deleted) || 0, ok: next.ok };
  }

  if (payload && typeof payload === "object") {
    const legacy = payload as { ok?: boolean; deleted?: number; error?: string };
    if (legacy.error) {
      throw new Error(legacy.error);
    }
    if ("deleted" in legacy) {
      return { deleted: Number(legacy.deleted) || 0, ok: legacy.ok };
    }
  }

  return { deleted: 0 };
}

/** Permanently delete leads matching at least one filter. */
export async function deleteLeads(payload: DeleteLeadsPayload) {
  const body = buildDeleteLeadsPayload(payload);
  if (!body.county && !body.source_url && !body.owner_name_contains) {
    throw new Error("Provide at least one filter: county, source_url, or owner_name_contains");
  }

  const data = await apiInvoker<DeleteLeadsApiResponse | ApiData<DeleteLeadsData> | DeleteLeadsData>(
    END_POINT.admin.deleteLeads,
    "DELETE",
    body,
  );
  return extractDeleteLeadsResponse(data);
}

function extractEnrichLeadsResponse(payload: unknown): EnrichLeadsData {
  if (payload && typeof payload === "object" && "success" in payload) {
    const envelope = payload as EnrichLeadsApiResponse;
    assertApiSuccess(envelope, "Failed to enrich leads");
    if (!envelope.data) {
      throw new Error(getMessageFromApiPayload(payload) || "Failed to enrich leads");
    }
    return envelope.data;
  }

  const next = unwrapData(payload as ApiData<EnrichLeadsData>);
  if (next && typeof next === "object" && "processed" in next) {
    return next as EnrichLeadsData;
  }

  return payload as EnrichLeadsData;
}

/** Enrich leads for a county (owner data backfill). */
export async function enrichLeads(payload: EnrichLeadsPayload): Promise<EnrichLeadsData> {
  const data = await apiInvoker<EnrichLeadsApiResponse | ApiData<EnrichLeadsData>>(
    END_POINT.admin.enrich,
    "POST",
    payload,
  );
  return extractEnrichLeadsResponse(data);
}

/** Download leads as CSV from GET /api/v1/leads/export. */
export async function exportLeadsCsv(params: LeadsExportParams = {}): Promise<string> {
  try {
    const response = await axiosInstance.get(resolveRequestUrl(END_POINT.leads.export), {
      params: buildLeadsExportQuery(params),
      responseType: "blob",
    });

    const blob = response.data as Blob;
    const contentType = String(response.headers["content-type"] ?? "");

    if (contentType.includes("application/json") || contentType.includes("text/json")) {
      throw new Error(await readBlobErrorMessage(blob));
    }

    const fallbackName = `atlas-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    const filename = parseFilenameFromContentDisposition(
      response.headers["content-disposition"],
      fallbackName,
    );

    downloadBlob(blob, filename);
    return filename;
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data instanceof Blob) {
      throw new Error(await readBlobErrorMessage(error.response.data));
    }
    throw error;
  }
}
