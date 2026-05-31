import { cn } from "@lib/cn";
import type { SubscriptionStatus } from "@shared/types";

const config: Record<SubscriptionStatus, { label: string; classes: string }> = {
  active: {
    label: "Active",
    classes: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  pending: {
    label: "Awaiting Payment",
    classes: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  grace_period: {
    label: "Grace Period",
    classes: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  expired: {
    label: "Expired",
    classes: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  cancelled: {
    label: "Cancelled",
    classes: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  },
  suspended: {
    label: "Suspended",
    classes: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
};

export function StatusBadge({ status }: { status: SubscriptionStatus }) {
  const { label, classes } = config[status] ?? config.expired;
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", classes)}>
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}
