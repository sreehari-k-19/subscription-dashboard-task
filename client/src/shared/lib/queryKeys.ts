export const queryKeys = {
  auth: {
    profile: ["user", "profile"] as const,
  },
  plans: {
    all: ["plans"] as const,
    detail: (slug: string) => ["plans", slug] as const,
  },
  subscriptions: {
    me: ["subscriptions", "me"] as const,
    history: ["subscriptions", "history"] as const,
    prorationPreview: (newPlanId: string) => ["subscriptions", "proration", newPlanId] as const,
  },
  notifications: {
    all: (page?: number) => ["notifications", page] as const,
  },
  admin: {
    analytics: ["admin", "analytics"] as const,
    subscriptions: (params?: Record<string, unknown>) =>
      ["admin", "subscriptions", params] as const,
    users: (params?: Record<string, unknown>) => ["admin", "users", params] as const,
    coupons: ["admin", "coupons"] as const,
  },
};
