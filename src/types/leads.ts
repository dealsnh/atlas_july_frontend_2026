export type LeadStatus = "new" | "reviewed" | "contacted" | "skip";

export type LeadType =
  | "Pre-Foreclosure"
  | "Tax Delinquent"
  | "Probate"
  | "Sheriff Sale"
  | "FSBO"
  | "Obituary"
  | "Code Violation"
  | "Divorce"
  | "Fire Damage"
  | "Bankruptcy"
  | "Lis Pendens"
  | "Vacant/Abandoned"
  | "Out-of-State Owner"
  | "Water Shutoff"
  | "Other";

export interface Lead {
  id: string;
  county: string;
  state: string;
  lead_type: string;
  owner_name: string | null;
  address: string | null;
  city: string | null;
  zip: string | null;
  mailing_address: string | null;
  mailing_city: string | null;
  mailing_state: string | null;
  mailing_zip: string | null;
  case_number: string | null;
  filing_date: string | null;
  assessed_value: string | null;
  tax_year: string | null;
  lender: string | null;
  loan_amount: string | null;
  sale_date: string | null;
  sale_amount: string | null;
  description: string | null;
  source_url: string | null;
  raw_data?: string | null;
  status: LeadStatus;
  notes: string | null;
  skip_traced: boolean | number;
  st_phone: string | null;
  st_email: string | null;
  st_mailing: string | null;
  scraped_at: string;
  created_at?: string;
  updated_at?: string;
}

export interface LeadsListParams {
  county?: string;
  lead_type?: string;
  status?: LeadStatus | string;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
}

export interface LeadsListData {
  leads: Lead[];
  total: number;
}

export interface LeadsListResponse {
  leads: Lead[];
  total: number;
}

export interface LeadsListApiResponse {
  success: boolean;
  data: LeadsListData;
  message?: string;
  requestId?: string;
}

export interface LeadStats {
  total: number;
  today: number;
  byType: Array<{ lead_type: string; count: number }>;
  byCounty: Array<{ county: string; count: number }>;
  lastRun: string | null;
  lastScrapeTime: string | null;
}

export interface LeadStatsApiResponse {
  success: boolean;
  data: LeadStats;
  message?: string;
  requestId?: string;
}

export interface UpdateLeadPayload {
  status: LeadStatus;
  notes?: string;
}

/** @deprecated Use UpdateLeadPayload */
export type UpdateLeadStatusPayload = UpdateLeadPayload;

export interface UpdateLeadApiResponse {
  success: boolean;
  data?: { ok: boolean };
  message?: string;
  requestId?: string;
}

export interface SkipTraceData {
  phone?: string;
  email?: string;
  mailing?: string;
  st_phone?: string;
  st_email?: string;
  st_mailing?: string;
}

export interface SkipTraceApiResponse {
  success: boolean;
  data?: SkipTraceData;
  message?: string;
  error?: string;
  requestId?: string;
}

export interface SkipTraceResult {
  phone?: string | null;
  email?: string | null;
  mailing?: string | null;
}

export type LeadsExportParams = Pick<
  LeadsListParams,
  "county" | "lead_type" | "status" | "from_date" | "to_date"
>;

export interface DeleteLeadsPayload {
  county?: string;
  source_url?: string;
  owner_name_contains?: string;
}

export interface DeleteLeadsData {
  deleted: number;
  ok?: boolean;
}

export interface DeleteLeadsApiResponse {
  success: boolean;
  data: DeleteLeadsData;
  message?: string;
  requestId?: string;
}

export interface EnrichLeadsPayload {
  county: string;
  state: string;
  limit: number;
}

export interface EnrichLeadsData {
  ok: boolean;
  processed: number;
  updated: number;
  stillMissingOwner: number;
}

export interface EnrichLeadsApiResponse {
  success: boolean;
  data: EnrichLeadsData;
  message?: string;
  requestId?: string;
}
