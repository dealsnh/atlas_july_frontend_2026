/** Per-client branding and county configuration (injected at build/deploy time). */
export const CLIENT_CONFIG = {
  companyName: "National Houses",
  accentColor: "#DC2626",
  counties: [
    {
      name: "Jackson",
      state: "MO",
      leadTypes: ["Pre-Foreclosure", "Tax Delinquent", "Probate", "Sheriff Sale", "Lis Pendens"],
    },
    {
      name: "Clay",
      state: "MO",
      leadTypes: ["Pre-Foreclosure", "Tax Delinquent", "Probate"],
    },
    {
      name: "Platte",
      state: "MO",
      leadTypes: ["Pre-Foreclosure", "Tax Delinquent"],
    },
    {
      name: "Cass",
      state: "MO",
      leadTypes: ["Pre-Foreclosure", "Tax Delinquent"],
    },
    {
      name: "Madison",
      state: "AL",
      leadTypes: ["Pre-Foreclosure", "Tax Delinquent", "Probate", "Sheriff Sale"],
    },
    {
      name: "Limestone",
      state: "AL",
      leadTypes: ["Pre-Foreclosure", "Tax Delinquent"],
    },
    {
      name: "Morgan",
      state: "AL",
      leadTypes: ["Pre-Foreclosure", "Tax Delinquent"],
    },
    {
      name: "Montgomery",
      state: "AL",
      leadTypes: ["Pre-Foreclosure", "Tax Delinquent", "Probate"],
    },
    {
      name: "Autauga",
      state: "AL",
      leadTypes: ["Pre-Foreclosure", "Tax Delinquent"],
    },
    {
      name: "Elmore",
      state: "AL",
      leadTypes: ["Pre-Foreclosure", "Tax Delinquent"],
    },
    {
      name: "Jefferson",
      state: "AL",
      leadTypes: ["Pre-Foreclosure", "Tax Delinquent", "Probate", "Sheriff Sale"],
    },
    {
      name: "Shelby",
      state: "AL",
      leadTypes: ["Pre-Foreclosure", "Tax Delinquent"],
    },
    {
      name: "Hamilton",
      state: "OH",
      leadTypes: ["Pre-Foreclosure", "Tax Delinquent", "Probate", "Sheriff Sale", "Lis Pendens"],
    },
    // Hamilton County TENNESSEE (Chattanooga) — distinct from Hamilton County OHIO
    // above. Same county name, different state; everything is keyed on the pair.
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
