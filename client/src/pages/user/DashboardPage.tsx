import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Calendar,
  CreditCard,
  RefreshCw,
  XCircle,
  CheckCircle2,
  Zap,
  ArrowUpRight,
  LayoutDashboard,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useMySubscription, useCancelSubscription, useToggleAutoRenew } from "@features/subscription/api/subscription.api";
import { StatusBadge } from "@shared/components/common/StatusBadge";
import { Skeleton } from "@shared/components/common/SkeletonCard";
import { useAuthStore } from "@store/authStore";
import type { Plan } from "@shared/types";

export function DashboardPage() {
  const { user } = useAuthStore();
  const { data: subscription, isLoading } = useMySubscription();
  const cancelMutation = useCancelSubscription();
  const autoRenewMutation = useToggleAutoRenew();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const plan = subscription?.planId as Plan | undefined;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-950">
          <LayoutDashboard className="h-5 w-5 text-brand-600 dark:text-brand-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Welcome back, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Here's your subscription overview
          </p>
        </div>
      </div>

      {/* Subscription card */}
      {isLoading ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-4 dark:border-zinc-800 dark:bg-zinc-900">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-40" />
        </div>
      ) : !subscription ? (
        <NoSubscriptionCard />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-zinc-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-zinc-900"
        >
          {/* Plan header band */}
          <div className="border-b border-zinc-100 bg-gradient-to-r from-brand-50 to-indigo-50 px-6 py-4 dark:border-zinc-800 dark:from-brand-950/30 dark:to-indigo-950/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 shadow-sm">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-brand-600 dark:text-brand-400">Current Plan</p>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {plan?.name ?? "Unknown"}
                  </h2>
                </div>
              </div>
              <StatusBadge status={subscription.status} />
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Details grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <InfoTile
                icon={CreditCard}
                label="Billing"
                value={`$${subscription.billingCycle === "yearly" ? plan?.price.yearly : plan?.price.monthly}/${subscription.billingCycle === "yearly" ? "yr" : "mo"}`}
              />
              <InfoTile
                icon={Calendar}
                label="Renews"
                value={format(new Date(subscription.endDate), "MMM d, yyyy")}
              />
              <InfoTile
                icon={RefreshCw}
                label="Auto-renew"
                value={subscription.autoRenew ? "On" : "Off"}
                valueColor={subscription.autoRenew ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500"}
              />
            </div>

            {/* Features */}
            {plan?.features && plan.features.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                  Included features
                </p>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Grace period warning */}
            {subscription.status === "grace_period" && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  ⚠️ Payment failed — access expires{" "}
                  {subscription.gracePeriodEndsAt &&
                    format(new Date(subscription.gracePeriodEndsAt), "MMM d, yyyy")}
                </p>
              </div>
            )}

            {/* Actions */}
            {subscription.status === "active" && (
              <div className="flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                <Link
                  to="/plans"
                  className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  Change plan
                </Link>

                <button
                  onClick={() => autoRenewMutation.mutate(!subscription.autoRenew)}
                  disabled={autoRenewMutation.isPending}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {subscription.autoRenew ? "Disable auto-renew" : "Enable auto-renew"}
                </button>

                {!showCancelConfirm ? (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Cancel plan
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">Confirm cancel?</span>
                    <button
                      onClick={() => { cancelMutation.mutate(undefined); setShowCancelConfirm(false); }}
                      disabled={cancelMutation.isPending}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      Yes, cancel
                    </button>
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400"
                    >
                      Keep plan
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: "View all plans", href: "/plans", icon: Zap },
          { label: "Billing history", href: "/billing", icon: CreditCard },
          { label: "Profile settings", href: "/profile", icon: RefreshCw },
        ].map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className="flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-4 py-3.5 text-sm font-medium text-zinc-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-brand-700 dark:hover:bg-brand-950/20 dark:hover:text-brand-300"
          >
            <item.icon className="h-4 w-4 shrink-0 text-brand-500" />
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function InfoTile({ icon: Icon, label, value, valueColor = "text-zinc-900 dark:text-zinc-50" }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="rounded-lg bg-zinc-50 px-3 py-2.5 dark:bg-zinc-800/60">
      <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-xs">{label}</span>
      </div>
      <p className={`mt-0.5 text-sm font-semibold ${valueColor}`}>{value}</p>
    </div>
  );
}

function NoSubscriptionCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900"
    >
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
        <CreditCard className="h-6 w-6 text-zinc-400" />
      </div>
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">No active subscription</h3>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Choose a plan to get started</p>
      <Link
        to="/plans"
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
      >
        <Zap className="h-4 w-4" /> View plans
      </Link>
    </motion.div>
  );
}
