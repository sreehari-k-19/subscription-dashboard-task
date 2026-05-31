import { format } from "date-fns";
import { CreditCard, ArrowUp, ArrowDown, Plus, Ban, RefreshCw, Shield, Clock } from "lucide-react";
import { useSubscriptionHistory } from "@features/subscription/api/subscription.api";
import { StatusBadge } from "@shared/components/common/StatusBadge";
import { Skeleton } from "@shared/components/common/SkeletonCard";
import { cn } from "@lib/cn";
import type { Plan, SubscriptionHistory } from "@shared/types";

const historyIcons: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  new: { icon: Plus, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400" },
  upgrade: { icon: ArrowUp, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400" },
  downgrade: { icon: ArrowDown, color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400" },
  renewal: { icon: RefreshCw, color: "text-brand-600 bg-brand-100 dark:bg-brand-900/30 dark:text-brand-400" },
  cancellation: { icon: Ban, color: "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400" },
  admin_assign: { icon: Shield, color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400" },
};

export function BillingPage() {
  const { data: subscriptions, isLoading } = useSubscriptionHistory();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-950">
          <CreditCard className="h-5 w-5 text-brand-600 dark:text-brand-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Billing History</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">All your subscription records</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : !subscriptions?.length ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <CreditCard className="mx-auto mb-3 h-8 w-8 text-zinc-300 dark:text-zinc-700" />
          <p className="text-sm text-zinc-500">No billing records yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {subscriptions.map((sub) => {
            const plan = sub.planId as Plan | undefined;
            return (
              <div
                key={sub._id}
                className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden"
              >
                {/* Sub header */}
                <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {plan?.name ?? "Unknown Plan"}
                    </span>
                    <span className="text-xs text-zinc-400 capitalize">{sub.billingCycle}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      ${sub.billingCycle === "yearly" ? plan?.price.yearly : plan?.price.monthly ?? 0}
                    </span>
                    <StatusBadge status={sub.status} />
                  </div>
                </div>

                {/* Pending payment notice */}
                {sub.status === "pending" && (
                  <div className="flex items-start gap-2 border-b border-amber-100 bg-amber-50 px-4 py-2.5 dark:border-amber-900/30 dark:bg-amber-950/20">
                    <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      Payment not yet confirmed. If you completed checkout, it may take a moment to update. If not, please subscribe again from the Plans page.
                    </p>
                  </div>
                )}

                {/* Dates */}
                <div className="flex items-center gap-6 px-4 py-2.5 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>{format(new Date(sub.startDate), "MMM d, yyyy")} → {format(new Date(sub.endDate), "MMM d, yyyy")}</span>
                  {sub.couponApplied?.code && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      Coupon: {sub.couponApplied.code}
                    </span>
                  )}
                </div>

                {/* History events */}
                {sub.history.length > 0 && (
                  <div className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                      Events
                    </p>
                    <div className="space-y-2">
                      {sub.history.map((event, i) => (
                        <HistoryEvent key={i} event={event} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function HistoryEvent({ event }: { event: SubscriptionHistory }) {
  const config = historyIcons[event.type] ?? historyIcons.new;
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-2.5">
      <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md", config.color)}>
        <Icon className="h-3 w-3" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium capitalize text-zinc-700 dark:text-zinc-300">
            {event.type.replace("_", " ")} — {event.planName}
          </p>
          <span className="shrink-0 text-xs text-zinc-400">
            {format(new Date(event.changedAt), "MMM d, yyyy")}
          </span>
        </div>
        {event.credit !== null && event.credit !== undefined && event.credit > 0 && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            Credit applied: ${event.credit.toFixed(2)}
          </p>
        )}
        {event.daysExtended !== null && event.daysExtended !== undefined && event.daysExtended > 0 && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            Extended by {event.daysExtended} days
          </p>
        )}
      </div>
    </div>
  );
}
