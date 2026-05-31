import { format } from "date-fns";
import { StatusBadge } from "@shared/components/common/StatusBadge";
import { Skeleton } from "@shared/components/common/SkeletonCard";
import { cn } from "@lib/cn";
import type { Plan, Subscription, User } from "@shared/types";

interface SubscriptionsTableProps {
  data: Subscription[] | undefined;
  isLoading: boolean;
}

const COLUMNS = ["User", "Plan", "Status", "Billing", "Start", "End", "Auto-renew"];

export function SubscriptionsTable({ data, isLoading }: SubscriptionsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/60">
            {COLUMNS.map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {isLoading ? (
            [...Array(8)].map((_, i) => (
              <tr key={i}>
                {[...Array(7)].map((__, j) => (
                  <td key={j} className="px-4 py-3">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))
          ) : !data?.length ? (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                No subscriptions found
              </td>
            </tr>
          ) : (
            data.map((sub) => {
              const user = sub.userId as User;
              const plan = sub.planId as Plan;
              return (
                <tr
                  key={sub._id}
                  className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                >
                  {/* User */}
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">{user?.name}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{user?.email}</p>
                    </div>
                  </td>

                  {/* Plan */}
                  <td className="px-4 py-3">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                      {plan?.name}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <StatusBadge status={sub.status} />
                  </td>

                  {/* Billing */}
                  <td className="px-4 py-3 capitalize text-zinc-600 dark:text-zinc-400">
                    {sub.billingCycle}
                  </td>

                  {/* Start */}
                  <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                    {format(new Date(sub.startDate), "MMM d, yyyy")}
                  </td>

                  {/* End */}
                  <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                    {format(new Date(sub.endDate), "MMM d, yyyy")}
                  </td>

                  {/* Auto-renew */}
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "text-xs font-medium",
                        sub.autoRenew
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-zinc-400"
                      )}
                    >
                      {sub.autoRenew ? "On" : "Off"}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
