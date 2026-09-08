/** Per-client branding and county configuration (injected at build/deploy time). */
export const CLIENT_CONFIG = {
  companyName: "National Houses",
  accentColor: "#DC2626",
  counties: [
    // Orange County, California — verified sources only: Central District
    // bankruptcy RSS and capublicnotice.com probate notices, both completed
    // against the countywide public parcel roll.
    {
      name: "Orange",
      state: "CA",
      leadTypes: ["Probate", "Bankruptcy"],
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
