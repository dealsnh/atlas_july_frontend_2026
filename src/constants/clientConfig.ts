/** Per-client branding and county configuration (injected at build/deploy time). */
export const CLIENT_CONFIG = {
  companyName: "National Houses",
  accentColor: "#DC2626",
  counties: [
    // Orange County, California, in priority order: the OC Clerk-Recorder's
    // trustee-sale filings (Foreclosure); Code Violation from two of OC's 34
    // incorporated cities (Anaheim, Irvine — no countywide feed exists, each
    // city runs its own program); capublicnotice.com probate notices; the
    // roll-derived Pre-Probate scan (property still on the tax roll as an
    // estate — no court filing needed to find it); and Central District
    // bankruptcy RSS — all completed against the countywide public parcel
    // roll where a lookup is needed.
    {
      name: "Orange",
      state: "CA",
      leadTypes: ["Foreclosure", "Code Violation", "Probate", "Pre-Probate", "Bankruptcy"],
    },
    // Hamilton County, Tennessee (Chattanooga).
    {
      name: "Hamilton",
      state: "TN",
      leadTypes: [
        "Pre-Foreclosure",
        "Tax Delinquent",
        "Probate",
        "Code Violation",
        "Vacant/Abandoned",
        "Fire Damage",
        "Divorce",
        "Bankruptcy",
        "Out-of-State Owner",
        "Absentee Owner",
        "Obituary",
        "FSBO",
      ],
    },
  ],
} as const;
