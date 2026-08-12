export const END_POINT = {
  auth: {
    login: "/auth/login",
    signup: "/auth/signup",
    logout: "/auth/logout",
    refresh: "/auth/refresh",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
  },
  leads: {
    list: "/leads",
    export: "/leads/export",
    byId: (id: string) => `/leads/${encodeURIComponent(id)}`,
    skipTrace: (id: string) => `/leads/${encodeURIComponent(id)}/skip-trace`,
  },
  stats: {
    summary: "/stats",
  },
  scrape: {
    status: "/scrape/status",
    stream: "/scrape/stream",
    runs: "/scrape/runs",
    trigger: "/scrape",
    historical: "/scrape/historical",
    schedule: "/scrape/schedule",
  },
  settings: {
    get: "/settings",
    save: "/settings",
    testEmail: "/settings/test-email",
  },
  admin: {
    deleteLeads: "/admin/leads",
    enrich: "/admin/enrich",
  },
} as const;
