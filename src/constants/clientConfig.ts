/** Per-client branding and county configuration (injected at build/deploy time). */
export const CLIENT_CONFIG = {
  companyName: "National Houses",
  accentColor: "#DC2626",
  counties: [
    // Orange County, California — verified sources only: Central District
    // bankruptcy RSS, capublicnotice.com probate notices, and the roll-derived
    // Pre-Probate scan (property still on the tax roll as an estate — no
    // court filing needed to find it), all completed against the countywide
    // public parcel roll.
    {
      name: "Orange",
      state: "CA",
      leadTypes: ["Probate", "Pre-Probate", "Bankruptcy"],
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
