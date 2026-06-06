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
    list: "/api/leads",
    export: "/api/leads/export",
    byId: (id: string) => `/api/leads/${encodeURIComponent(id)}`,
    skipTrace: (id: string) => `/api/leads/${encodeURIComponent(id)}/skip-trace`,
  },
  stats: {
    summary: "/api/stats",
  },
  scrape: {
    status: "/api/scrape/status",
    stream: "/api/scrape/stream",
    runs: "/api/scrape/runs",
    trigger: "/api/scrape",
    historical: "/api/scrape/historical",
  },
  settings: {
    get: "/api/settings",
    save: "/api/settings",
    testEmail: "/api/settings/test-email",
  },
} as const;
