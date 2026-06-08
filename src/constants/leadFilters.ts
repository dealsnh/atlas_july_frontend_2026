import type { LeadStatus, LeadType } from "@/types";

export const LEAD_TYPES: LeadType[] = [
  "Pre-Foreclosure",
  "Tax Delinquent",
  "Probate",
  "Sheriff Sale",
  "FSBO",
  "Obituary",
  "Code Violation",
  "Divorce",
  "Fire Damage",
  "Bankruptcy",
  "Lis Pendens",
  "Vacant/Abandoned",
  "Out-of-State Owner",
  "Water Shutoff",
  "Other",
];

export const LEAD_STATUSES: LeadStatus[] = ["new", "reviewed", "contacted", "skip"];
