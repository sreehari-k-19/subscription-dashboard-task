import { motion } from "framer-motion";
import { X, ArrowUp, ArrowDown, Loader2, Zap } from "lucide-react";
import { useProrationPreview } from "../api/subscription.api";
import { Skeleton } from "@shared/components/common/SkeletonCard";
import type { Plan, BillingCycle } from "@shared/types";

interface ProrationModalProps {
  plan: Plan;
  billingCycle: BillingCycle;
  hasActiveSub: boolean;
  isPending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ProrationModal({
  plan,
  billingCycle,
  hasActiveSub,
  isPending,
  onConfirm,
  onClose,
}: ProrationModalProps) {
  const { data: preview, isLoading } = useProrationPreview(plan._id, billingCycle, hasActiveSub);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
            {hasActiveSub ? "Switch plan" : "Subscribe"} — {plan.name}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {hasActiveSub && isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : hasActiveSub && preview ? (
            <>
              {/* Direction */}
              <div className="flex items-center gap-3 rounded-lg bg-zinc-50 px-4 py-3 dark:bg-zinc-800">
                <div className="text-center">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">From</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">{preview.currentPlanName}</p>
                </div>
                <div className="flex flex-1 items-center justify-center">
                  {preview.type === "upgrade" ? (
                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <ArrowUp className="h-4 w-4" />
                      <span className="text-xs font-medium">Upgrade</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <ArrowDown className="h-4 w-4" />
                      <span className="text-xs font-medium">Downgrade</span>
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">To</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">{preview.newPlanName}</p>
                </div>
              </div>

              {/* Line items */}
              <div className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-700">
                <LineItem label="Days remaining" value={`${preview.remainingDays} days`} />
                <LineItem
                  label="Credit from current plan"
                  value={`$${preview.creditAmount.toFixed(2)}`}
                  valueClass="text-emerald-600 dark:text-emerald-400"
                />
                <LineItem
                  label={`${preview.newPlanName} (${billingCycle})`}
                  value={`$${preview.newPlanPrice.toFixed(2)}`}
                />
                {preview.type === "downgrade" && preview.daysExtended > 0 && (
                  <LineItem
                    label="Days extended"
                    value={`+${preview.daysExtended} days`}
                    valueClass="text-emerald-600 dark:text-emerald-400"
                  />
                )}
                <div className="flex items-center justify-between bg-zinc-50 px-4 py-3 dark:bg-zinc-800/60">
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {preview.type === "upgrade" ? "Pay today" : "Charge today"}
                  </span>
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                    ${preview.chargeToday.toFixed(2)}
                  </span>
                </div>
              </div>
            </>
          ) : (
            /* Fresh subscribe */
            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
              <div className="mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4 text-brand-600" />
                <span className="font-medium text-zinc-900 dark:text-zinc-50">{plan.name} Plan</span>
              </div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                ${billingCycle === "yearly" ? plan.price.yearly : plan.price.monthly}
                <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400">
                  /{billingCycle === "yearly" ? "yr" : "mo"}
                </span>
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Access starts immediately · {plan.duration} day cycle
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 border-t border-zinc-100 px-6 py-4 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-zinc-300 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending || (hasActiveSub && isLoading)}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {hasActiveSub ? "Confirm switch" : "Subscribe now"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function LineItem({
  label,
  value,
  valueClass = "text-zinc-700 dark:text-zinc-300",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-sm text-zinc-600 dark:text-zinc-400">{label}</span>
      <span className={`text-sm font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}
