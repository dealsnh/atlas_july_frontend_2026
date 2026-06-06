export type LeadStatus = "new" | "reviewed" | "contacted" | "skip";

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
  status: LeadStatus;
  notes: string | null;
  scraped_at: string;
  skip_traced: boolean;
  st_phone: string | null;
  st_email: string | null;
  st_mailing: string | null;
}

export interface LeadsListParams {
  county?: string;
  lead_type?: string;
  status?: string;
  from_date?: string;
  to_date?: string;
  limit?: string | number;
}

export interface LeadsListResponse {
  leads: Lead[];
}

export interface LeadStats {
  total: number;
  today: number;
  byType: Array<{ lead_type: string; count: number }>;
  byCounty: Array<{ county: string; count: number }>;
  lastRun: string | null;
  lastScrapeTime: string | null;
}

export interface UpdateLeadStatusPayload {
  status: LeadStatus;
}

export interface SkipTraceResponse {
  success: boolean;
  phone?: string;
  email?: string;
  mailing?: string;
  error?: string;
}

export interface LeadsExportParams {
  county?: string;
  lead_type?: string;
  status?: string;
  from_date?: string;
  to_date?: string;
}
