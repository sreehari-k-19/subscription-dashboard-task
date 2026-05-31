export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  avatar?: string;
  phone?: string;
  isActive: boolean;
  lastLoginAt?: string;
  stripeCustomerId?: string;
  preferences: {
    notifications: boolean;
    emailAlerts: boolean;
    theme: "light" | "dark" | "system";
  };
  createdAt: string;
  updatedAt: string;
}

export interface Plan {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: { monthly: number; yearly: number };
  currency: string;
  tier: number;
  features: string[];
  featureFlags: {
    api_access: boolean;
    priority_support: boolean;
    custom_reports: boolean;
    team_members: number;
    storage_gb: number;
  };
  duration: number;
  isActive: boolean;
  badge?: string;
  stripePriceIds: { monthly: string; yearly: string };
}

export type SubscriptionStatus =
  | "pending"
  | "active"
  | "grace_period"
  | "expired"
  | "cancelled"
  | "suspended";

export type BillingCycle = "monthly" | "yearly";

export interface SubscriptionHistory {
  planId: string;
  planName: string;
  price: number;
  type: "new" | "upgrade" | "downgrade" | "renewal" | "cancellation" | "admin_assign";
  changedAt: string;
  credit?: number;
  daysExtended?: number;
  note?: string;
}

export interface Subscription {
  _id: string;
  userId: string | User;
  planId: string | Plan;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  couponApplied?: { code: string; discountPercent: number };
  history: SubscriptionHistory[];
  gracePeriodEndsAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProrationPreview {
  currentPlanName: string;
  newPlanName: string;
  type: "upgrade" | "downgrade" | "same";
  remainingDays: number;
  totalDays: number;
  creditAmount: number;
  currentPlanPrice: number;
  newPlanPrice: number;
  chargeToday: number;
  newEndDate: string;
  daysExtended: number;
  billingCycle: BillingCycle;
}

export interface Notification {
  _id: string;
  userId: string;
  type: "subscription" | "payment" | "system" | "admin";
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    requestId?: string;
    timestamp?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface AnalyticsMetrics {
  mrr: number;
  mrrGrowth: number;
  activeSubscribers: number;
  momGrowth: number;
  churnRate: number;
  totalUsers: number;
}

export interface PlanDistribution {
  _id: string;
  name: string;
  count: number;
  mrr: number;
}

export interface SignupDataPoint {
  date: string;
  count: number;
}

export interface Analytics {
  metrics: AnalyticsMetrics;
  planDistribution: PlanDistribution[];
  signupsTimeline: SignupDataPoint[];
  recentActivity: Array<{
    _id: string;
    userEmail: string;
    action: string;
    createdAt: string;
    metadata?: Record<string, unknown>;
  }>;
}
