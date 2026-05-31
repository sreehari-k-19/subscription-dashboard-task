import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import {
  usePlans,
  useMySubscription,
  useSubscribe,
  useSwitchPlan,
} from "@features/subscription/api/subscription.api";
import { ProrationModal } from "@features/subscription/components/ProrationModal";
import { StatusBadge } from "@shared/components/common/StatusBadge";
import { Skeleton } from "@shared/components/common/SkeletonCard";
import { cn } from "@lib/cn";
import type { Plan, BillingCycle } from "@shared/types";

export function PlansPage() {
  const { data: plans, isLoading: plansLoading } = usePlans();
  const { data: subscription } = useMySubscription();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const subscribeMutation = useSubscribe();
  const switchMutation = useSwitchPlan();

  // Auto-select plan from ?autoselect= param (coming from pricing page → register flow)
  useEffect(() => {
    const slug = searchParams.get("autoselect");
    if (!slug || !plans?.length || selectedPlan) return;

    const match = plans.find((p) => p.slug === slug);
    if (match) {
      setSelectedPlan(match);
      // Clean param from URL without re-navigation
      setSearchParams((prev) => {
        prev.delete("autoselect");
        return prev;
      }, { replace: true });
    }
  }, [plans, searchParams, selectedPlan, setSearchParams]);

  const currentPlanId = subscription?.planId
    ? typeof subscription.planId === "string"
      ? subscription.planId
      : (subscription.planId as Plan)._id
    : null;

  const hasActiveSub = subscription?.status === "active";

  function handleSelectPlan(plan: Plan) {
    if (plan._id === currentPlanId) return;
    setSelectedPlan(plan);
  }

  function handleConfirm() {
    if (!selectedPlan) return;
    if (hasActiveSub) {
      switchMutation.mutate(
        { newPlanId: selectedPlan._id, billingCycle },
        { onSuccess: () => setSelectedPlan(null) }
      );
    } else {
      // Free plan: onSuccess invalidates query + toast
      // Paid plan: onSuccess redirects to Stripe (window.location.href)
      subscribeMutation.mutate(
        { planId: selectedPlan._id, billingCycle },
        { onSuccess: () => setSelectedPlan(null) }
      );
    }
  }

  const yearlyDiscount = (monthly: number, yearly: number) =>
    monthly > 0 ? Math.round((1 - yearly / 12 / monthly) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Plans</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Choose the plan that fits your needs
          </p>
        </div>

        {/* Billing cycle toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-700 dark:bg-zinc-800">
          {(["monthly", "yearly"] as BillingCycle[]).map((cycle) => (
            <button
              key={cycle}
              onClick={() => setBillingCycle(cycle)}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors",
                billingCycle === cycle
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-50"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              )}
            >
              {cycle}
              {cycle === "yearly" && (
                <span className="ml-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  Save up to 30%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Current subscription status */}
      {subscription && (
        <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">Current plan:</span>
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {typeof subscription.planId === "object" ? (subscription.planId as Plan).name : "—"}
          </span>
          <StatusBadge status={subscription.status} />
        </div>
      )}

      {/* Plans grid */}
      {plansLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-3 dark:border-zinc-800 dark:bg-zinc-900">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-8 w-24" />
              <div className="space-y-2">
                {[...Array(4)].map((_, j) => <Skeleton key={j} className="h-3 w-full" />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {plans?.map((plan) => {
            const isCurrent = plan._id === currentPlanId;
            const price = billingCycle === "yearly" ? plan.price.yearly : plan.price.monthly;
            const discount = yearlyDiscount(plan.price.monthly, plan.price.yearly);

            return (
              <motion.div
                key={plan._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "relative flex flex-col rounded-2xl border bg-white p-5 transition-all dark:bg-zinc-900",
                  isCurrent
                    ? "border-brand-400 ring-2 ring-brand-400/20 dark:border-brand-600"
                    : plan.badge
                    ? "border-indigo-300 dark:border-indigo-700"
                    : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                )}
              >
                {/* Popular badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                      {plan.badge}
                    </span>
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute right-3 top-3">
                    <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
                      Current
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{plan.name}</h3>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{plan.description}</p>
                </div>

                <div className="mb-4">
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                      ${price}
                    </span>
                    <span className="mb-1 text-sm text-zinc-500 dark:text-zinc-400">
                      /{billingCycle === "yearly" ? "yr" : "mo"}
                    </span>
                  </div>
                  {billingCycle === "yearly" && discount > 0 && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      Save {discount}% vs monthly
                    </p>
                  )}
                  {billingCycle === "monthly" && plan.price.monthly === 0 && (
                    <p className="text-xs text-zinc-400">Free forever</p>
                  )}
                </div>

                <ul className="mb-5 flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isCurrent}
                  className={cn(
                    "w-full rounded-lg py-2.5 text-sm font-semibold transition-colors",
                    isCurrent
                      ? "cursor-default bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600"
                      : plan.badge
                      ? "bg-brand-600 text-white hover:bg-brand-700"
                      : "border border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  )}
                >
                  {isCurrent ? "Current plan" : hasActiveSub ? "Switch plan" : "Get started"}
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Plan detail / proration modal */}
      <AnimatePresence>
        {selectedPlan && (
          <ProrationModal
            plan={selectedPlan}
            billingCycle={billingCycle}
            hasActiveSub={hasActiveSub}
            isPending={subscribeMutation.isPending || switchMutation.isPending}
            onConfirm={handleConfirm}
            onClose={() => setSelectedPlan(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}


