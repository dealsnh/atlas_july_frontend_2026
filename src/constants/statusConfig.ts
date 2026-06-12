import { createElement } from "react";
import type { LeadStatus } from "@/types";
import { LEAD_STATUSES } from "@/constants/leadFilters";

export const LEAD_STATUS_CONFIG: Record<LeadStatus, { label: string; className: string }> = {
  new: { label: "New", className: "bg-emerald-500/25 text-emerald-300 border border-emerald-500/45" },
  reviewed: { label: "Reviewed", className: "bg-amber-500/25 text-amber-300 border border-amber-500/45" },
  contacted: { label: "Contacted", className: "bg-blue-500/25 text-blue-300 border border-blue-500/45" },
  skip: { label: "Skip", className: "bg-slate-500/25 text-slate-300 border border-slate-500/45" },
};

const STATUS_BADGE_BASE = "inline-flex text-xs px-2 py-0.5 rounded-full font-medium border";

export function getLeadStatusSelectTriggerClassName(status: LeadStatus): string {
  return LEAD_STATUS_CONFIG[status].className
    .split(/\s+/)
    .map((token) =>
      token === "border" || token.startsWith("bg-") || token.startsWith("text-") || token.startsWith("border-")
        ? `!${token}`
        : token,
    )
    .join(" ");
}

export function renderLeadStatusLabel(status: LeadStatus) {
  const { label, className } = LEAD_STATUS_CONFIG[status];
  return createElement("span", { className: `${STATUS_BADGE_BASE} ${className}` }, label);
}

export function getLeadStatusSelectOptions() {
  return LEAD_STATUSES.map((status) => ({
    value: status,
    label: renderLeadStatusLabel(status),
    itemClassName: "atlas-select-item--status",
  }));
}

export const SCRAPE_RUN_STATUS_STYLES: Record<string, string> = {
  success: "bg-emerald-500/25 text-emerald-300 border border-emerald-500/45",
  error: "bg-red-500/25 text-red-300 border border-red-500/45",
  running: "bg-blue-500/25 text-blue-300 border border-blue-500/45",
  pending: "bg-amber-500/25 text-amber-300 border border-amber-500/45",
};

export function getScrapeRunStatusClassName(status: string): string {
  return SCRAPE_RUN_STATUS_STYLES[status] ?? SCRAPE_RUN_STATUS_STYLES.pending;
}

export type SourceStatus =
  | "live"
  | "possible"
  | "needs_attom"
  | "needs_brightdata"
  | "blocked"
  | "na"
  | "stale";

export const SOURCE_STATUS_COLORS: Record<SourceStatus, string> = {
  live: "bg-emerald-500/25 text-emerald-300 border border-emerald-500/45",
  possible: "bg-yellow-500/25 text-yellow-300 border border-yellow-500/45",
  needs_attom: "bg-orange-500/25 text-orange-300 border border-orange-500/45",
  needs_brightdata: "bg-purple-500/25 text-purple-300 border border-purple-500/45",
  blocked: "bg-red-500/25 text-red-300 border border-red-500/45",
  stale: "bg-slate-500/25 text-slate-300 border border-slate-500/45",
  na: "bg-slate-700/35 text-slate-400 border border-slate-600/45",
};
