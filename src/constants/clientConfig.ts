/** Per-client branding and county configuration (injected at build/deploy time). */
export const CLIENT_CONFIG = {
  companyName: "National Houses",
  accentColor: "#DC2626",
  counties: [
    // Orange County, California, in priority order: the OC Clerk-Recorder's
    // trustee-sale filings (Foreclosure); Code Violation from four of OC's
    // 34 incorporated cities (Anaheim, Irvine, Newport Beach, Garden Grove —
    // no countywide feed exists, each city runs its own program); Tax
    // Delinquent from bid4assets.com's Orange County tax-defaulted property auction
    // storefront (public, no login needed — reports whatever's currently
    // posted and open, since the county's auction schedule is irregular,
    // not a fixed calendar); capublicnotice.com probate notices; the
    // roll-derived Pre-Probate scan (property still on the tax roll as an
    // estate — no court filing needed to find it); and Central District
    // bankruptcy RSS — all completed against the countywide public parcel
    // roll where a lookup is needed. Water Shutoff was evaluated and
    // eliminated: California's SB 998 only requires utilities to report an
    // annual aggregate count of disconnections, never a list of addresses,
    // so there is no lawful path to individual leads from it.
    {
      name: "Orange",
      state: "CA",
      leadTypes: [
        "Foreclosure",
        "Code Violation",
        "Tax Delinquent",
        "Probate",
        "Pre-Probate",
        "Bankruptcy",
      ],
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
