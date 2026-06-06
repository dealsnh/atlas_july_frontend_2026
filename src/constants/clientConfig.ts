/** Per-client branding and county configuration (injected at build/deploy time). */
export const CLIENT_CONFIG = {
  companyName: "National Houses",
  userEmail: "tina@nationalhouses.com",
  userPassword: "Tina1074$",
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
  ],
} as const;

export type ClientCounty = (typeof CLIENT_CONFIG.counties)[number];
