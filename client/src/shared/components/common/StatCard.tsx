import { type LucideIcon } from "lucide-react";
import { cn } from "@lib/cn";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  prefix?: string;
  suffix?: string;
  iconColor?: string;
}

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  prefix = "",
  suffix = "",
  iconColor = "text-brand-600",
}: StatCardProps) {
  const isPositive = (change ?? 0) >= 0;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {title}
          </p>
          <p className="mt-1.5 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {prefix}{typeof value === "number" ? value.toLocaleString() : value}{suffix}
          </p>
          {change !== undefined && (
            <p
              className={cn(
                "mt-1 text-xs font-medium",
                isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
              )}
            >
              {isPositive ? "↑" : "↓"} {Math.abs(change)}% MoM
            </p>
          )}
        </div>
        <div className={cn("rounded-lg bg-zinc-100 p-2.5 dark:bg-zinc-800", iconColor)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
