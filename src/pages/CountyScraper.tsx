// County Scraper — full-stack live data version
import { useState, useEffect, useCallback } from "react";
import { MapPin, Clock, Download, RefreshCw, Filter, Search, ChevronDown, ChevronUp, Database, Zap, History, UserSearch, Phone, Mail, CheckCircle2, Activity, Trash2, RotateCcw, Sparkles, Pause, Play } from "lucide-react";
import { AtlasDatePicker, AtlasSelect } from "@/components/atlas";
import { LEAD_STATUSES, LEAD_TYPES } from "@/constants/leadFilters";
import { formatLastScrapeTime, getLastScrapeTimestamp } from "@/lib/dateTimeFormat";
import { showApiErrorToast, showApiSuccessToast } from "@/lib/apiToast";
import {
  deleteLeads,
  enrichLeads,
  exportLeadsCsv,
  skipTraceLead,
  updateLead,
} from "@/services/leadsServices";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getScrapeRuns,
  getScrapeSchedule,
  getScrapeStatus,
  setScrapeSchedulePaused,
  subscribeScrapeStream,
  triggerHistoricalScrape,
  triggerScrape,
} from "@/services/scrapeServices";
import { useLeadsStore } from "@/store/leads/leadsStore";
import { useScrapeStore } from "@/store/scrape/scrapeStore";
import { useStatsStore } from "@/store/stats/statsStore";
import {
  getLeadStatusSelectOptions,
  getLeadStatusSelectTriggerClassName,
  getScrapeRunStatusClassName,
  LEAD_STATUS_CONFIG,
} from "@/constants/statusConfig";
import type { EnrichLeadsData, LeadStatus, LeadsExportParams, LeadsListParams, ScrapeStatusResponse } from "@/types";

const TYPE_COLORS: Record<string, string> = {
  "Pre-Foreclosure": "bg-red-500/15 text-red-400 border border-red-500/20",
  "Tax Delinquent": "bg-orange-500/15 text-orange-400 border border-orange-500/20",
  "Probate": "bg-violet-500/15 text-violet-400 border border-violet-500/20",
  "Sheriff Sale": "bg-pink-500/15 text-pink-400 border border-pink-500/20",
  "Lis Pendens": "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20",
  "FSBO": "bg-teal-500/15 text-teal-400 border border-teal-500/20",
  "Obituary": "bg-slate-500/15 text-slate-300 border border-slate-500/20",
  "Code Violation": "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20",
  "Divorce": "bg-rose-500/15 text-rose-400 border border-rose-500/20",
  "Fire Damage": "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  "Water Shutoff": "bg-sky-500/15 text-sky-400 border border-sky-500/20",
  "Vacant/Abandoned": "bg-lime-500/15 text-lime-400 border border-lime-500/20",
  "Vacant": "bg-lime-500/15 text-lime-400 border border-lime-500/20",
  "Bankruptcy": "bg-purple-500/15 text-purple-400 border border-purple-500/20",
  "Out-of-State Owner": "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20",
  "Other": "bg-neutral-500/15 text-neutral-400 border border-neutral-500/20",
};

function isSkipTraced(value: boolean | number | undefined): boolean {
  return value === true || value === 1;
}

function SkipTraceBadge({ skipTraced, compact = false }: { skipTraced: boolean | number | undefined; compact?: boolean }) {
  const traced = isSkipTraced(skipTraced);

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border ${
        traced
          ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/45"
          : "bg-white/5 text-white/40 border-white/10"
      }`}
      title={traced ? "Skip trace completed" : "Not skip traced yet"}
    >
      {traced ? <CheckCircle2 className="w-3 h-3" /> : <UserSearch className="w-3 h-3" />}
      {compact ? (traced ? "Traced" : "Not traced") : (traced ? "Skip Traced" : "Not Traced")}
    </span>
  );
}

interface CountyScraperProps {
  counties: Array<{ name: string; state: string; leadTypes: string[] }>;
}

/**
 * County selections are carried as "<name>|<ST>", not the bare name.
 *
 * County names are NOT unique across states — the client tracks both Hamilton
 * County OHIO and Hamilton County TENNESSEE. Keyed on name alone, the two would
 * collapse into one indistinguishable dropdown option, the leads list would mix
 * both counties, and the enrich/delete dialogs would resolve to whichever appeared
 * first in the config (OH). Every county request therefore sends county + state.
 */
const countyValue = (c: { name: string; state: string }): string => `${c.name}|${c.state}`;

function splitCountyValue(value: string): { county: string; state?: string } {
  if (!value || value === "all") return { county: "" };
  const [county = "", state = ""] = value.split("|");
  return { county, state: state || undefined };
}

function getScrapeDefaultFromDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().split("T")[0];
}

function getScrapeDefaultToDate(): string {
  return new Date().toISOString().split("T")[0];
}

export default function CountyScraper({ counties }: CountyScraperProps) {
  const leads = useLeadsStore((s) => s.leads);
  const leadsTotal = useLeadsStore((s) => s.total);
  const loading = useLeadsStore((s) => s.isLoading);
  const fetchLeads = useLeadsStore((s) => s.fetchLeads);
  const updateLeadInList = useLeadsStore((s) => s.updateLeadInList);
  const stats = useStatsStore((s) => s.stats);
  const fetchStats = useStatsStore((s) => s.fetchStats);
  const [tracingIds, setTracingIds] = useState<Set<string>>(() => new Set());
  const scraping = useScrapeStore((s) => s.scraping);
  const scrapeLog = useScrapeStore((s) => s.scrapeLog);
  const runHistory = useScrapeStore((s) => s.runHistory);
  const setScraping = useScrapeStore((s) => s.setScraping);
  const setScrapeLog = useScrapeStore((s) => s.setScrapeLog);
  const setRunHistory = useScrapeStore((s) => s.setRunHistory);
  const [selectedCounty, setSelectedCounty] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");
  const [showHistorical, setShowHistorical] = useState(false);
  const [historicalDays, setHistoricalDays] = useState(30);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [savingNotesId, setSavingNotesId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showRunHistory, setShowRunHistory] = useState(false);
  const [runHistoryExpanded, setRunHistoryExpanded] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [dailyScrapePaused, setDailyScrapePaused] = useState(false);
  const [togglingDailyScrape, setTogglingDailyScrape] = useState(false);
  const [showScrapeDateDialog, setShowScrapeDateDialog] = useState(false);
  const [showScrapeStartedDialog, setShowScrapeStartedDialog] = useState(false);
  const [scrapeFromDate, setScrapeFromDate] = useState("");
  const [scrapeToDate, setScrapeToDate] = useState("");
  // Non-null = the next scrape run targets only this lead type (from the dropdown filter).
  const [scrapeLeadType, setScrapeLeadType] = useState<string | null>(null);
  const [showEnrichDialog, setShowEnrichDialog] = useState(false);
  const [showEnrichResultDialog, setShowEnrichResultDialog] = useState(false);
  const [enrichCounty, setEnrichCounty] = useState("");
  const [enrichLimit, setEnrichLimit] = useState(500);
  const [enriching, setEnriching] = useState(false);
  const [enrichResult, setEnrichResult] = useState<EnrichLeadsData | null>(null);
  const [showDeleteLeadsDialog, setShowDeleteLeadsDialog] = useState(false);
  const [deleteCounty, setDeleteCounty] = useState("");
  // Deleting by county name alone would hit Hamilton OH and Hamilton TN together.
  const [deleteState, setDeleteState] = useState("");
  const [deleteSourceUrl, setDeleteSourceUrl] = useState("");
  const [deleteOwnerNameContains, setDeleteOwnerNameContains] = useState("");
  const [deletingLeads, setDeletingLeads] = useState(false);
  const PAGE_SIZE = 50;

  const applyScrapeStatus = useCallback((data: ScrapeStatusResponse) => {
    setScraping(data.in_progress);
    if (data.log?.length) {
      setScrapeLog(data.log);
    } else if (data.in_progress) {
      setScrapeLog(["Scrape in progress..."]);
    } else {
      setScrapeLog([]);
    }
  }, [setScrapeLog, setScraping]);

  const hasActiveFilters =
    search !== "" ||
    selectedCounty !== "all" ||
    selectedType !== "all" ||
    selectedStatus !== "all" ||
    fromDate !== "" ||
    toDate !== "";

  const resetFilters = () => {
    setSearch("");
    setSelectedCounty("all");
    setSelectedType("all");
    setSelectedStatus("all");
    setFromDate("");
    setToDate("");
    setPage(0);
  };

  const buildListParams = useCallback((): LeadsListParams => {
    const params: LeadsListParams = {
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    };
    if (selectedCounty !== "all") {
      const { county, state } = splitCountyValue(selectedCounty);
      params.county = county;
      if (state) params.state = state;
    }
    if (selectedType !== "all") params.lead_type = selectedType;
    if (selectedStatus !== "all") params.status = selectedStatus;
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    return params;
  }, [selectedCounty, selectedType, selectedStatus, fromDate, toDate, page]);

  const buildExportParams = useCallback((): LeadsExportParams => {
    const params: LeadsExportParams = {};
    if (selectedCounty !== "all") {
      const { county, state } = splitCountyValue(selectedCounty);
      params.county = county;
      if (state) params.state = state;
    }
    if (selectedType !== "all") params.lead_type = selectedType;
    if (selectedStatus !== "all") params.status = selectedStatus;
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    return params;
  }, [selectedCounty, selectedType, selectedStatus, fromDate, toDate]);

  const refreshLeads = useCallback(async () => {
    try {
      await fetchLeads(buildListParams());
    } catch (e) {
      showApiErrorToast(e);
    }
  }, [buildListParams, fetchLeads]);

  const refreshStats = useCallback(async () => {
    try {
      await fetchStats();
    } catch {}
  }, [fetchStats]);

  useEffect(() => { refreshLeads(); }, [refreshLeads]);
  useEffect(() => { refreshStats(); }, [refreshStats]);

  useEffect(() => {
    getScrapeStatus().then(applyScrapeStatus).catch(() => {});
  }, [applyScrapeStatus]);

  useEffect(() => {
    getScrapeSchedule()
      .then((schedule) => setDailyScrapePaused(Boolean(schedule.paused)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!scraping) return;

    const unsubscribe = subscribeScrapeStream({
      onEvent: (data) => {
        setScrapeLog(data.log?.length ? data.log : ["Scrape in progress..."]);

        if (!data.in_progress) {
          setScraping(false);
          refreshLeads();
          fetchStats();
        }
      },
      onError: () => {
        setScraping(false);
        refreshLeads();
        fetchStats();
      },
    });

    return unsubscribe;
  }, [scraping, refreshLeads, fetchStats, setScrapeLog, setScraping]);

  const fetchRunHistory = useCallback(async () => {
    try {
      setRunHistory(await getScrapeRuns());
    } catch (e) {
      showApiErrorToast(e);
    }
  }, [setRunHistory]);

  useEffect(() => { if (showRunHistory) fetchRunHistory(); }, [showRunHistory, fetchRunHistory]);

  const handleCheckScrapeStatus = async () => {
    setCheckingStatus(true);
    try {
      const data = await getScrapeStatus();
      applyScrapeStatus(data);
      showApiSuccessToast(data.in_progress ? "Scraper is currently running" : "Scraper is idle");
      if (!data.in_progress) {
        refreshLeads();
        fetchStats();
      }
    } catch (e) {
      showApiErrorToast(e);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleToggleDailyScrape = async () => {
    const nextPaused = !dailyScrapePaused;
    setTogglingDailyScrape(true);
    try {
      const schedule = await setScrapeSchedulePaused(nextPaused);
      setDailyScrapePaused(Boolean(schedule.paused));
      showApiSuccessToast(
        schedule.message ||
          (schedule.paused
            ? "Daily scrape paused — the 9:00 AM PT run is off"
            : "Daily scrape resumed — the 9:00 AM PT run is back on"),
      );
    } catch (e) {
      showApiErrorToast(e);
    } finally {
      setTogglingDailyScrape(false);
    }
  };

  const openScrapeDateDialog = (leadType: string | null = null) => {
    setScrapeLeadType(leadType);
    setScrapeFromDate(fromDate || getScrapeDefaultFromDate());
    setScrapeToDate(toDate || getScrapeDefaultToDate());
    setShowScrapeDateDialog(true);
  };

  const scrapeDateRangeValid =
    Boolean(scrapeFromDate) && Boolean(scrapeToDate) && scrapeFromDate <= scrapeToDate;

  const handleScrapeDateDialogKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && scrapeDateRangeValid && !scraping) {
      e.preventDefault();
      void handleTriggerScrape();
    }
  };

  const handleTriggerScrape = async () => {
    if (!scrapeDateRangeValid) return;

    setShowScrapeDateDialog(false);
    setScraping(true);
    setScrapeLog([
      `Starting ${scrapeLeadType ? `${scrapeLeadType} ` : ""}scrape (${scrapeFromDate} → ${scrapeToDate})...`,
    ]);
    try {
      const result = await triggerScrape({
        from_date: scrapeFromDate,
        to_date: scrapeToDate,
        ...(scrapeLeadType ? { lead_type: scrapeLeadType } : {}),
        // County targeting is independent of lead type: selecting a county with no
        // lead type must still scope the run, otherwise the backend sees no filter
        // and falls back to scraping every configured county.
        ...(selectedCounty !== "all"
          ? {
              county: splitCountyValue(selectedCounty).county,
              // Without the state, targeting "Hamilton" would scrape both OH and TN.
              ...(splitCountyValue(selectedCounty).state
                ? { state: splitCountyValue(selectedCounty).state }
                : {}),
            }
          : {}),
      });
      const message = result.message?.trim() || "Scrape started";
      setScrapeLog([message]);
      setShowScrapeStartedDialog(true);
    } catch (e) {
      showApiErrorToast(e);
      setScraping(false);
    }
  };

  const handleTriggerHistorical = async () => {
    setScraping(true);
    setShowHistorical(false);
    setScrapeLog([`Starting historical scrape (${historicalDays} days)...`]);
    try {
      await triggerHistoricalScrape({ days_back: historicalDays });
    } catch (e) {
      console.error("Failed to trigger historical scrape:", e);
      setScraping(false);
    }
  };

  const toggleExpandedLead = (leadId: string, notes: string | null) => {
    setExpandedLead((current) => {
      const next = current === leadId ? null : leadId;
      if (next) {
        setNotesDraft((prev) => ({
          ...prev,
          [leadId]: prev[leadId] ?? notes ?? "",
        }));
      }
      return next;
    });
  };

  const handleUpdateStatus = async (id: string, status: LeadStatus, currentStatus?: LeadStatus) => {
    if (currentStatus === status) return;

    setUpdatingStatusId(id);
    try {
      await updateLead(id, { status });
      updateLeadInList(id, { status });
      showApiSuccessToast(`Status updated to ${LEAD_STATUS_CONFIG[status].label}`);
    } catch (e) {
      showApiErrorToast(e);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleSaveNotes = async (id: string, status: LeadStatus) => {
    const notes = (notesDraft[id] ?? "").trim();
    setSavingNotesId(id);
    try {
      await updateLead(id, { status, notes });
      updateLeadInList(id, { notes: notes || null });
      showApiSuccessToast("Notes saved");
    } catch (e) {
      showApiErrorToast(e);
    } finally {
      setSavingNotesId(null);
    }
  };

  const handleSkipTrace = async (id: string) => {
    setTracingIds((prev) => new Set(prev).add(id));
    try {
      const data = await skipTraceLead(id);
      const current = leads.find((l) => l.id === id);
      updateLeadInList(id, {
        skip_traced: true,
        st_phone: data.phone ?? current?.st_phone ?? null,
        st_email: data.email ?? current?.st_email ?? null,
        st_mailing: data.mailing ?? current?.st_mailing ?? null,
      });
      showApiSuccessToast("Skip trace completed");
    } catch (e) {
      showApiErrorToast(e);
    } finally {
      setTracingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleExportCsv = async (params: LeadsExportParams) => {
    setExporting(true);
    setShowExportMenu(false);
    try {
      const filename = await exportLeadsCsv(params);
      showApiSuccessToast(`Downloaded ${filename}`);
    } catch (e) {
      showApiErrorToast(e);
    } finally {
      setExporting(false);
    }
  };

  // enrichCounty is a "<name>|<ST>" value, so the state comes from the selection
  // itself. Looking it up by name would return Hamilton OH for a Hamilton TN pick.
  const enrichState = splitCountyValue(enrichCounty).state ?? "";
  const enrichFormValid = Boolean(enrichCounty) && Boolean(enrichState) && enrichLimit > 0;

  const openEnrichDialog = () => {
    setEnrichCounty(selectedCounty !== "all" ? selectedCounty : "");
    setEnrichLimit(500);
    setShowEnrichDialog(true);
  };

  const handleEnrichLeads = async () => {
    if (!enrichFormValid) return;

    setEnriching(true);
    try {
      const result = await enrichLeads({
        county: splitCountyValue(enrichCounty).county,
        state: enrichState,
        limit: enrichLimit,
      });
      setEnrichResult(result);
      setShowEnrichDialog(false);
      setShowEnrichResultDialog(true);
      await refreshLeads();
      await refreshStats();
    } catch (e) {
      showApiErrorToast(e);
    } finally {
      setEnriching(false);
    }
  };

  const handleOpenDeleteLeadsDialog = () => {
    // selectedCounty is composite — split it so the text field shows a plain name
    // and the delete is scoped to the right state.
    const { county, state } = splitCountyValue(selectedCounty);
    setDeleteCounty(county);
    setDeleteState(state ?? "");
    setDeleteSourceUrl("");
    setDeleteOwnerNameContains(search.trim());
    setShowDeleteLeadsDialog(true);
  };

  const hasDeleteLeadsFilter =
    Boolean(deleteCounty.trim()) ||
    Boolean(deleteSourceUrl.trim()) ||
    Boolean(deleteOwnerNameContains.trim());

  const handleDeleteLeads = async () => {
    if (!hasDeleteLeadsFilter) return;

    setDeletingLeads(true);
    try {
      const result = await deleteLeads({
        county: deleteCounty.trim() || undefined,
        state: deleteState.trim().toUpperCase() || undefined,
        source_url: deleteSourceUrl.trim() || undefined,
        owner_name_contains: deleteOwnerNameContains.trim() || undefined,
      });
      const count = result.deleted;
      showApiSuccessToast(
        count === 1 ? "Permanently deleted 1 lead" : `Permanently deleted ${count} leads`,
      );
      setShowDeleteLeadsDialog(false);
      setPage(0);
      await refreshLeads();
      await refreshStats();
    } catch (e) {
      showApiErrorToast(e);
    } finally {
      setDeletingLeads(false);
    }
  };

  const filtered = leads.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.owner_name?.toLowerCase().includes(q) ||
      l.address?.toLowerCase().includes(q) ||
      l.case_number?.toLowerCase().includes(q) ||
      l.description?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(leadsTotal / PAGE_SIZE));
  const dbTypes = stats ? stats.byType.map((t) => t.lead_type) : leads.map((l) => l.lead_type);
  // A county with its own configured leadTypes (e.g. Orange, CA — only the
  // sources actually verified/built there) narrows the Lead Type dropdown to
  // just that list. Every other county keeps the full global list, same as
  // before this narrowed behavior existed.
  const selectedCountyConfig =
    selectedCounty === "all"
      ? undefined
      : (() => {
          const { county, state } = splitCountyValue(selectedCounty);
          return counties.find((c) => c.name === county && (!state || c.state === state));
        })();
  // Filter out null/undefined/empty/whitespace lead types: a Radix <Select.Item value="">
  // (from leads with a NULL/empty lead_type) throws and crashes the Lead Type dropdown on open.
  const allTypes = selectedCountyConfig?.leadTypes?.length
    ? [...selectedCountyConfig.leadTypes]
    : Array.from(
        new Set([...LEAD_TYPES, ...dbTypes].filter((t): t is string => typeof t === "string" && t.trim() !== "")),
      ).sort();

  // Switching to a county whose narrowed list no longer includes the current
  // Lead Type filter (e.g. "Divorce" was selected, then the county changes to
  // Orange, CA) would otherwise leave an invalid filter silently applied.
  useEffect(() => {
    if (selectedType !== "all" && !allTypes.includes(selectedType)) {
      setSelectedType("all");
      setPage(0);
    }
    // Only re-check when the county selection itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCounty]);

  return (
    <div className="atlas-page-shell">
      <div className="flex flex-col gap-4 lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="atlas-page-title">County Scraper</h1>
          <p className="atlas-page-subtitle">Live motivated seller leads — updated daily at 6:00 AM.</p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-end gap-2 w-full lg:w-full">
          <button onClick={() => setShowHistorical(!showHistorical)}
            className="atlas-btn-ghost-sm col-span-1">
            <History className="w-3.5 h-3.5" />
            Historical Pull
          </button>
          <button
            onClick={() => {
              setShowRunHistory((v) => {
                const next = !v;
                if (next) setRunHistoryExpanded(true);
                return next;
              });
            }}
            className="atlas-btn-ghost-sm"
          >
            <Database className="w-3.5 h-3.5" />
            Run History
            {showRunHistory ? (
              <ChevronUp className="w-3.5 h-3.5 text-white/40" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-white/40" />
            )}
          </button>
          <button
            onClick={handleCheckScrapeStatus}
            disabled={checkingStatus}
            className={`atlas-btn-ghost-sm border transition-colors disabled:opacity-50 ${
              scraping ? "atlas-accent-active" : ""
            }`}
          >
            <Activity className={`w-3.5 h-3.5 ${checkingStatus ? "animate-pulse" : ""}`} />
            {checkingStatus ? "Checking..." : scraping ? "Running" : "Status"}
          </button>
          <button
            onClick={handleOpenDeleteLeadsDialog}
            className="atlas-btn-ghost-sm border border-red-500/20 text-red-400/90 hover:bg-red-500/10 hover:text-red-300"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Leads
          </button>
          <div className="relative">
            <button onClick={() => setShowExportMenu(v => !v)} disabled={exporting}
              className="atlas-btn-ghost-sm w-full sm:w-auto">
              {exporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              {exporting ? "Exporting..." : "Export CSV"}
              {!exporting && (showExportMenu ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
            </button>
            {showExportMenu && !exporting && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-[#13131f] border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden">
                <button onClick={() => handleExportCsv({})}
                  className="w-full flex items-center gap-2 px-4 py-3 text-xs text-white/70 hover:bg-white/5 hover:text-white transition-colors text-left">
                  <Download className="w-3.5 h-3.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Export All Leads</div>
                    <div className="text-white/35 text-[11px]">Every lead in the database</div>
                  </div>
                </button>
                <div className="border-t border-white/[0.06]" />
                <button onClick={() => handleExportCsv(buildExportParams())}
                  className="w-full flex items-center gap-2 px-4 py-3 text-xs text-white/70 hover:bg-white/5 hover:text-white transition-colors text-left">
                  <Filter className="w-3.5 h-3.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Export Current Filters</div>
                    <div className="text-white/35 text-[11px]">County, type, status &amp; date range</div>
                  </div>
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={openEnrichDialog}
            disabled={enriching}
            className="atlas-btn-ghost-sm col-span-2 sm:col-span-1 text-xs disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${enriching ? "animate-pulse" : ""}`} />
            {enriching ? "Enriching..." : "Enrich Leads"}
          </button>
          {selectedType !== "all" && (
            <button onClick={() => openScrapeDateDialog(selectedType)} disabled={scraping}
              title={`Run the scraper for ${selectedType} leads only`}
              className="atlas-btn atlas-btn-primary-glow col-span-2 sm:col-span-1 text-xs disabled:opacity-50">
              <Zap className="w-3.5 h-3.5" />
              {scraping ? "Scraping..." : `Scrape ${selectedType}`}
            </button>
          )}
          <button
            type="button"
            onClick={handleToggleDailyScrape}
            disabled={togglingDailyScrape}
            title={
              dailyScrapePaused
                ? "Daily scrape is paused — click to resume the automatic 9:00 AM PT run"
                : "Daily scrape is active — click to pause the automatic 9:00 AM PT run"
            }
            className={`atlas-btn-ghost-sm border col-span-2 sm:col-span-1 text-xs transition-colors disabled:opacity-50 ${
              dailyScrapePaused
                ? "border-amber-500/25 text-amber-300/90 hover:bg-amber-500/10 hover:text-amber-200"
                : "border-white/10"
            }`}
          >
            {dailyScrapePaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            {togglingDailyScrape
              ? "Saving..."
              : dailyScrapePaused
                ? "Daily Scrape: Paused"
                : "Daily Scrape: On"}
          </button>
          <button onClick={() => openScrapeDateDialog()} disabled={scraping}
            className="atlas-btn atlas-btn-primary-glow col-span-2 sm:col-span-1 text-xs disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${scraping ? "animate-spin" : ""}`} />
            {scraping ? "Scraping..." : "Run Scrape"}
          </button>
        </div>
      </div>

      {showHistorical && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-white/60" />
            <h3 className="text-sm font-semibold text-white">Historical Lead Pull</h3>
            <span className="text-xs text-white/40">Pull up to 90 days of past leads to get started</span>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <label className="text-xs text-white/50">Days back:</label>
              <input type="range" min={1} max={90} value={historicalDays}
                onChange={e => setHistoricalDays(parseInt(e.target.value))} className="w-40" />
              <span className="text-sm font-bold text-white w-8">{historicalDays}</span>
            </div>
            <button onClick={handleTriggerHistorical} disabled={scraping}
              className="atlas-btn disabled:opacity-50">
              Pull {historicalDays} Days
            </button>
          </div>
        </div>
      )}

      {showRunHistory && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setRunHistoryExpanded((v) => !v)}
              className="flex flex-wrap items-center gap-2 min-w-0 text-left hover:opacity-90 transition-opacity"
              aria-expanded={runHistoryExpanded}
            >
              {runHistoryExpanded ? (
                <ChevronUp className="w-4 h-4 text-white/50 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-white/50 shrink-0" />
              )}
              <Database className="w-4 h-4 text-white/60 shrink-0" />
              <h3 className="text-sm font-semibold text-white">Scrape Run History</h3>
              <span className="text-xs text-white/40 hidden sm:inline">Last 200 runs across all counties and lead types</span>
            </button>
            {runHistoryExpanded && (
              <button onClick={fetchRunHistory} className="text-xs text-white/40 hover:text-white/70 transition-colors flex items-center gap-1 shrink-0">
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            )}
          </div>
          {runHistoryExpanded && (runHistory.length === 0 ? (
            <div className="text-xs text-white/30 text-center py-6">No scrape runs recorded yet. Run a scrape to see history here.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-white/30 border-b border-white/10">
                    <th className="text-left py-2 pr-4 font-medium">County</th>
                    <th className="text-left py-2 pr-4 font-medium">Lead Type</th>
                    <th className="text-left py-2 pr-4 font-medium">Started</th>
                    <th className="text-left py-2 pr-4 font-medium">Duration</th>
                    <th className="text-left py-2 pr-4 font-medium">Leads</th>
                    <th className="text-left py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {runHistory.slice(0, 100).map(run => {
                    const dur = run.finished_at ? Math.round((new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()) / 1000) : null;
                    return (
                      <tr key={run.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                        <td className="py-1.5 pr-4 text-white/70">{run.county}, {run.state}</td>
                        <td className="py-1.5 pr-4 text-white/50">{run.lead_type}</td>
                        <td className="py-1.5 pr-4 text-white/40">{new Date(run.started_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</td>
                        <td className="py-1.5 pr-4 text-white/40">{dur !== null ? `${dur}s` : '—'}</td>
                        <td className="py-1.5 pr-4 font-mono text-white/70">{run.leads_found ?? 0}</td>
                        <td className="py-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getScrapeRunStatusClassName(run.status)}`}>{run.status}</span>
                          {run.error && <span className="ml-2 text-red-400/60 truncate max-w-[200px] inline-block align-middle">{run.error}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {scraping && scrapeLog.length > 0 && (
        <div className="bg-black/40 border border-white/10 rounded-xl p-4 font-mono text-xs space-y-1 max-h-40 overflow-y-auto">
          {scrapeLog.map((line, i) => (
            <div key={i} className={line.startsWith("✓") ? "text-emerald-400" : line.startsWith("✗") ? "text-red-400" : line.startsWith("⚠") ? "text-amber-400" : "text-white/60"}>
              {line}
            </div>
          ))}
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Leads", value: stats.total.toLocaleString(), icon: Database },
            { label: "Added Today", value: stats.today.toLocaleString(), icon: Zap },
            { label: "Lead Types", value: stats.byType.length.toString(), icon: Filter },
            { label: "Last Scrape", value: formatLastScrapeTime(getLastScrapeTimestamp(stats)), icon: Clock },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/40 text-xs mb-1"><Icon className="w-3.5 h-3.5" />{label}</div>
              <div className="text-xl font-black text-white">{value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <div className="relative w-full lg:flex-1 lg:min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input type="text" placeholder="Search owner, address, case #..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="w-full bg-transparent border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex lg:flex-nowrap gap-3 w-full lg:w-auto">
          <AtlasSelect
            value={selectedCounty}
            onValueChange={(value) => { setSelectedCounty(value); setPage(0); }}
            placeholder="All Counties"
            className="w-full min-w-[12.5rem]"
            options={[
              { value: "all", label: "All Counties" },
              ...counties.map((c) => ({ value: countyValue(c), label: `${c.name}, ${c.state}` })),
            ]}
          />
          <AtlasSelect
            value={selectedType}
            onValueChange={(value) => { setSelectedType(value); setPage(0); }}
            placeholder="All Types"
            className="w-full min-w-[10.5rem]"
            options={[
              { value: "all", label: "All Types" },
              ...allTypes.map((t) => ({ value: t, label: t })),
            ]}
          />
          <AtlasSelect
            value={selectedStatus}
            onValueChange={(value) => { setSelectedStatus(value); setPage(0); }}
            placeholder="All Statuses"
            className="w-full min-w-[12rem]"
            triggerClassName={
              selectedStatus !== "all"
                ? `atlas-select-trigger--status ${getLeadStatusSelectTriggerClassName(selectedStatus as LeadStatus)}`
                : undefined
            }
            options={[
              { value: "all", label: "All Statuses" },
              ...getLeadStatusSelectOptions(),
            ]}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto lg:shrink-0">
          <AtlasDatePicker
            value={fromDate}
            onChange={(value) => { setFromDate(value); setPage(0); }}
            className="flex-1 min-w-[8.5rem]"
            placeholder="Select date"
            max={toDate || undefined}
          />
          <span className="text-white/30 text-xs">to</span>
          <AtlasDatePicker
            value={toDate}
            onChange={(value) => { setToDate(value); setPage(0); }}
            className="flex-1 min-w-[8.5rem]"
            placeholder="Select date"
            min={fromDate || undefined}
          />
          <button
            type="button"
            onClick={resetFilters}
            disabled={!hasActiveFilters}
            title="Reset all filters"
            className="atlas-btn-ghost-sm border border-white/10 disabled:opacity-40 disabled:pointer-events-none shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-white/40">
        <span>
          {search
            ? `${filtered.length.toLocaleString()} on this page matching "${search}"`
            : `${leadsTotal.toLocaleString()} leads`}
        </span>
        {!search && totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="px-2 py-1 rounded border border-white/10 disabled:opacity-30 hover:border-white/20 text-xs">&larr;</button>
            <span className="text-xs">Page {page + 1} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="px-2 py-1 rounded border border-white/10 disabled:opacity-30 hover:border-white/20 text-xs">&rarr;</button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-white/30">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" />Loading leads...
        </div>
      ) : leadsTotal === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/30 space-y-3">
          <Database className="w-10 h-10 opacity-30" />
          <p className="text-sm">No leads yet. Run a scrape or pull historical data to get started.</p>
          <div className="flex gap-2">
            <button onClick={() => openScrapeDateDialog()} disabled={scraping}
              className="atlas-btn">Run Scrape Now</button>
            <button onClick={() => setShowHistorical(true)}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white/60 border border-white/10">
              Pull Historical</button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/30 space-y-2">
          <Search className="w-8 h-8 opacity-30" />
          <p className="text-sm">No leads on this page match your search.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(lead => (
            <div key={lead.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 cursor-pointer" onClick={() => toggleExpandedLead(lead.id, lead.notes)}>
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[lead.lead_type] || "bg-white/10 text-white/60"}`}>
                      {lead.lead_type}
                    </span>
                    <SkipTraceBadge skipTraced={lead.skip_traced} compact />
                    <span className="text-xs text-white/40">{lead.county}, {lead.state}</span>
                    {lead.filing_date && (() => {
                      const daysAgo = lead.filing_date ? Math.floor((Date.now() - new Date(lead.filing_date).getTime()) / 86400000) : 999;
                      const ageBadge = daysAgo <= 3
                        ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/45"
                        : daysAgo <= 7
                        ? "bg-amber-500/25 text-amber-300 border border-amber-500/45"
                        : "bg-white/5 text-white/30 border border-white/10";
                      return (
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${ageBadge}`}>
                          Filed {lead.filing_date}{daysAgo <= 3 ? " 🔥" : ""}
                        </span>
                      );
                    })()}
                    {lead.scraped_at && <span className="text-xs text-white/25"><span className="text-white/20">Added</span> {new Date(lead.scraped_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                  </div>
                  <div className="mt-1.5 flex items-start gap-3 flex-wrap">
                    <span className="text-sm font-bold text-white leading-tight">{lead.owner_name || "Unknown Owner"}</span>
                    {lead.address && (
                      <span className="text-xs text-white/50 flex items-center gap-0.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {lead.address}{lead.city ? `, ${lead.city}` : ""}{lead.zip ? ` ${lead.zip}` : ""}
                      </span>
                    )}
                  </div>
                  {lead.case_number && <div className="text-xs text-white/25 mt-0.5 font-mono">Case #{lead.case_number}</div>}
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 w-full sm:w-auto">
                  <AtlasSelect
                    value={lead.status}
                    onValueChange={(status) => handleUpdateStatus(lead.id, status as LeadStatus, lead.status)}
                    onTriggerClick={(e) => e.stopPropagation()}
                    disabled={updatingStatusId === lead.id}
                    size="sm"
                    triggerClassName={`atlas-select-trigger--compact atlas-select-trigger--status text-xs px-2 py-0.5 rounded-full font-medium border focus:outline-none cursor-pointer disabled:opacity-50 h-auto min-h-0 ${getLeadStatusSelectTriggerClassName(lead.status)}`}
                    options={getLeadStatusSelectOptions()}
                  />
                  <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${expandedLead === lead.id ? "rotate-180" : ""}`} />
                </div>
              </div>

              {expandedLead === lead.id && (
                <div className="border-t border-white/10 p-4 space-y-4">
                  {/* Mailing Address — shown separately if different from property address */}
                  {lead.mailing_address && lead.mailing_address !== lead.address && (
                    <div className="bg-white/[0.03] rounded-lg px-3 py-2 text-xs">
                      <div className="text-white/30 mb-0.5">Mailing Address</div>
                      <div className="text-white/70">{[lead.mailing_address, lead.mailing_city, lead.mailing_state, lead.mailing_zip].filter(Boolean).join(', ')}</div>
                    </div>
                  )}
                  {/* Detail fields grid */}
                  {(() => {
                    const detailFields = [
                      { label: "Assessed Value", value: lead.assessed_value },
                      { label: "Tax Year", value: lead.tax_year },
                      { label: "Lender", value: lead.lender },
                      { label: "Loan Amount", value: lead.loan_amount },
                      { label: "Sale Date", value: lead.sale_date },
                      { label: "Sale Amount", value: lead.sale_amount },
                      { label: "Description", value: lead.description },
                      { label: "Date Added", value: lead.scraped_at ? new Date(lead.scraped_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : null },
                    ].filter(f => f.value !== null && f.value !== undefined && f.value !== '' && f.value !== '0' && f.value !== '$0');
                    return detailFields.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                        {detailFields.map(({ label, value }) => (
                          <div key={label}>
                            <div className="text-white/30 mb-0.5">{label}</div>
                            <div className="text-white/80">{value}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-white/25 italic">No additional details available for this lead.</p>
                    );
                  })()}
                  {lead.source_url && (
                    <a href={lead.source_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-400/70 hover:text-blue-400 hover:underline break-all">View Source Record &rarr;</a>
                  )}
                  <div className="space-y-2">
                    <label className="text-xs text-white/30">Notes</label>
                    <textarea
                      value={notesDraft[lead.id] ?? lead.notes ?? ""}
                      onChange={(e) => setNotesDraft((prev) => ({ ...prev, [lead.id]: e.target.value }))}
                      onClick={(e) => e.stopPropagation()}
                      rows={2}
                      placeholder="Add notes about this lead..."
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus:border-white/30 resize-y"
                    />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleSaveNotes(lead.id, lead.status); }}
                      disabled={savingNotesId === lead.id}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white/70 border border-white/10 hover:border-white/20 disabled:opacity-50"
                    >
                      {savingNotesId === lead.id ? "Saving..." : "Save Notes"}
                    </button>
                  </div>
                  {/* Skip trace status — always visible when expanded */}
                  <div
                    className={`rounded-xl p-3 space-y-1.5 ${
                      isSkipTraced(lead.skip_traced)
                        ? "bg-emerald-500/10 border border-emerald-500/20"
                        : "bg-white/[0.03] border border-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs text-white/30">Skip Trace</span>
                      <SkipTraceBadge skipTraced={lead.skip_traced} />
                    </div>
                    {isSkipTraced(lead.skip_traced) ? (
                      lead.st_phone || lead.st_email || lead.st_mailing ? (
                        <div className="space-y-1.5 pt-1">
                          {lead.st_phone && <div className="flex items-center gap-2 text-xs text-white/70"><Phone className="w-3 h-3 text-emerald-400/70" />{lead.st_phone}</div>}
                          {lead.st_email && <div className="flex items-center gap-2 text-xs text-white/70"><Mail className="w-3 h-3 text-emerald-400/70" />{lead.st_email}</div>}
                          {lead.st_mailing && <div className="flex items-center gap-2 text-xs text-white/70"><MapPin className="w-3 h-3 text-emerald-400/70" />{lead.st_mailing}</div>}
                        </div>
                      ) : (
                        <p className="text-xs text-white/40 pt-1">Skip traced — no phone, email, or mailing address returned.</p>
                      )
                    ) : (
                      <p className="text-xs text-white/40 pt-1">Not skip traced yet. Use the button below to run skip trace.</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-white/[0.06]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-white/25">Status:</span>
                      {LEAD_STATUSES.map((s) => (
                        <button
                          key={s}
                          onClick={(e) => { e.stopPropagation(); handleUpdateStatus(lead.id, s, lead.status); }}
                          disabled={updatingStatusId === lead.id}
                          className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all disabled:opacity-50 ${lead.status === s ? LEAD_STATUS_CONFIG[s].className : "bg-white/5 text-white/40 border border-white/10 hover:border-white/20"}`}
                        >
                          {LEAD_STATUS_CONFIG[s].label}
                        </button>
                      ))}
                    </div>
                    {!isSkipTraced(lead.skip_traced) ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSkipTrace(lead.id); }}
                        disabled={tracingIds.has(lead.id)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all disabled:opacity-50"
                        style={{background:"rgba(99,102,241,0.15)",border:"1px solid rgba(99,102,241,0.3)",color:"#a5b4fc"}}>
                        <UserSearch className="w-3.5 h-3.5" />
                        {tracingIds.has(lead.id) ? "Tracing..." : "Skip Trace"}
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-emerald-400/70">
                        <CheckCircle2 className="w-3 h-3" />Traced
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!search && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="px-3 py-1.5 rounded-lg border border-white/10 disabled:opacity-30 hover:border-white/20 text-sm text-white/60">&larr; Prev</button>
          <span className="text-sm text-white/40">Page {page + 1} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="px-3 py-1.5 rounded-lg border border-white/10 disabled:opacity-30 hover:border-white/20 text-sm text-white/60">Next &rarr;</button>
        </div>
      )}

      <Dialog open={showEnrichDialog} onOpenChange={setShowEnrichDialog}>
        <DialogContent className="bg-[#0c0c18] border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Enrich Leads</DialogTitle>
            <DialogDescription className="text-white/45">
              Backfill missing owner data for leads in a county. Select a county and how many records to process.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50">County</label>
              <AtlasSelect
                value={enrichCounty}
                onValueChange={setEnrichCounty}
                placeholder="Select county"
                className="w-full"
                options={counties.map((c) => ({
                  value: countyValue(c),
                  label: `${c.name}, ${c.state}`,
                }))}
              />
            </div>
            {enrichState && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/50">State</label>
                <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70">
                  {enrichState}
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50">Limit</label>
              <input
                type="number"
                min={1}
                max={5000}
                value={enrichLimit}
                onChange={(e) => setEnrichLimit(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/20"
              />
              <p className="text-[11px] text-white/35">Maximum number of leads to process in this run.</p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              onClick={() => setShowEnrichDialog(false)}
              disabled={enriching}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white/60 border border-white/10 hover:bg-white/[0.06] disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleEnrichLeads}
              disabled={enriching || !enrichFormValid}
              className="atlas-btn atlas-btn-primary-glow text-sm disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${enriching ? "animate-pulse" : ""}`} />
              {enriching ? "Enriching..." : "Start Enrichment"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEnrichResultDialog} onOpenChange={setShowEnrichResultDialog}>
        <DialogContent className="bg-[#0c0c18] border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/25">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              </div>
              <DialogTitle className="text-white">Enrichment complete</DialogTitle>
            </div>
            <DialogDescription className="text-white/55 text-sm leading-relaxed">
              {enrichCounty && enrichState
                ? `Results for ${enrichCounty}, ${enrichState}:`
                : "Enrichment finished with the following results:"}
            </DialogDescription>
          </DialogHeader>
          {enrichResult && (
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-white/5 border border-white/10 p-3 text-center">
                <div className="text-lg font-bold text-white">{enrichResult.processed}</div>
                <div className="text-[11px] text-white/40 mt-0.5">Processed</div>
              </div>
              <div className="rounded-lg bg-white/5 border border-white/10 p-3 text-center">
                <div className="text-lg font-bold text-emerald-400">{enrichResult.updated}</div>
                <div className="text-[11px] text-white/40 mt-0.5">Updated</div>
              </div>
              <div className="rounded-lg bg-white/5 border border-white/10 p-3 text-center">
                <div className="text-lg font-bold text-amber-400">{enrichResult.stillMissingOwner}</div>
                <div className="text-[11px] text-white/40 mt-0.5">Still missing</div>
              </div>
            </div>
          )}
          <DialogFooter>
            <button
              type="button"
              onClick={() => setShowEnrichResultDialog(false)}
              className="atlas-btn atlas-btn-primary-glow w-full sm:w-auto text-sm"
            >
              Got it
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showScrapeDateDialog} onOpenChange={setShowScrapeDateDialog}>
        <DialogContent
          className="bg-[#0c0c18] border-white/10 text-white sm:max-w-md"
          onKeyDown={handleScrapeDateDialogKeyDown}
        >
          <DialogHeader>
            <DialogTitle className="text-white">
              {scrapeLeadType ? `Run Scrape — ${scrapeLeadType} only` : "Run Scrape"}
            </DialogTitle>
            <DialogDescription className="text-white/45">
              {scrapeLeadType
                ? `Only the ${scrapeLeadType} scraper will run. Choose the date range to scrape.`
                : "Choose the date range to scrape. Only records within this window will be pulled."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex-1 min-w-[8.5rem] space-y-1.5">
                <label className="text-xs font-medium text-white/50">From</label>
                <AtlasDatePicker
                  value={scrapeFromDate}
                  onChange={setScrapeFromDate}
                  className="w-full"
                  max={scrapeToDate || undefined}
                />
              </div>
              <span className="text-white/30 text-xs pt-5">to</span>
              <div className="flex-1 min-w-[8.5rem] space-y-1.5">
                <label className="text-xs font-medium text-white/50">To</label>
                <AtlasDatePicker
                  value={scrapeToDate}
                  onChange={setScrapeToDate}
                  className="w-full"
                  min={scrapeFromDate || undefined}
                />
              </div>
            </div>
            {!scrapeDateRangeValid && scrapeFromDate && scrapeToDate && (
              <p className="text-[11px] text-red-400/90">From date must be on or before the to date.</p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              onClick={() => setShowScrapeDateDialog(false)}
              disabled={scraping}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white/60 border border-white/10 hover:bg-white/[0.06] disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleTriggerScrape}
              disabled={scraping || !scrapeDateRangeValid}
              className="atlas-btn atlas-btn-primary-glow text-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${scraping ? "animate-spin" : ""}`} />
              {scraping ? "Starting..." : "Start Scrape"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showScrapeStartedDialog} onOpenChange={setShowScrapeStartedDialog}>
        <DialogContent className="bg-[#0c0c18] border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/25">
                <Clock className="h-5 w-5 text-emerald-400" />
              </div>
              <DialogTitle className="text-white">Scrape is on its way</DialogTitle>
            </div>
            <DialogDescription className="text-white/55 text-sm leading-relaxed">
              We&apos;re pulling {scrapeLeadType ? (
                <span className="text-white/80 font-medium">{scrapeLeadType} </span>
              ) : ""}leads from{" "}
              <span className="text-white/80 font-medium">{scrapeFromDate}</span> to{" "}
              <span className="text-white/80 font-medium">{scrapeToDate}</span>.
              {" "}This usually takes about <span className="text-white/80 font-medium">30 minutes</span> to finish.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-white/45 leading-relaxed">
            You can stay on this page and watch the live log, or come back later — new leads will show up
            automatically when the run completes.
          </p>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setShowScrapeStartedDialog(false)}
              className="atlas-btn atlas-btn-primary-glow w-full sm:w-auto text-sm"
            >
              Got it
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteLeadsDialog} onOpenChange={setShowDeleteLeadsDialog}>
        <DialogContent className="bg-[#0c0c18] border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Leads</DialogTitle>
            <DialogDescription className="text-white/45">
              Permanently delete leads matching at least one filter. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50">County</label>
              <input
                type="text"
                value={deleteCounty}
                onChange={(e) => setDeleteCounty(e.target.value)}
                placeholder="e.g. Franklin"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50">
                State <span className="text-white/30">(required when the county name exists in more than one state, e.g. Hamilton OH / TN)</span>
              </label>
              <input
                type="text"
                value={deleteState}
                onChange={(e) => setDeleteState(e.target.value.toUpperCase().slice(0, 2))}
                placeholder="e.g. TN"
                maxLength={2}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50">Source URL</label>
              <input
                type="text"
                value={deleteSourceUrl}
                onChange={(e) => setDeleteSourceUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50">Owner name contains</label>
              <input
                type="text"
                value={deleteOwnerNameContains}
                onChange={(e) => setDeleteOwnerNameContains(e.target.value)}
                placeholder="Partial owner name"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/20"
              />
            </div>
            <p className="text-[11px] text-white/35">
              Provide at least one filter. Matching leads are removed from the database permanently.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              onClick={() => setShowDeleteLeadsDialog(false)}
              disabled={deletingLeads}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white/60 border border-white/10 hover:bg-white/[0.06] disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteLeads}
              disabled={deletingLeads || !hasDeleteLeadsFilter}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-red-300 bg-red-500/15 border border-red-500/30 hover:bg-red-500/25 disabled:opacity-50 transition-colors"
            >
              {deletingLeads ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {deletingLeads ? "Deleting..." : "Delete Permanently"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
