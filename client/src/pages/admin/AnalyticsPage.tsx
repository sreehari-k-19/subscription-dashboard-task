import { format } from "date-fns";
import {
  DollarSign, Users, TrendingDown, TrendingUp, BarChart3,
  Activity,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { useAdminAnalytics } from "@features/admin/api/admin.api";
import { StatCard } from "@shared/components/common/StatCard";
import { SkeletonCard, Skeleton } from "@shared/components/common/SkeletonCard";
import { useThemeStore } from "@store/themeStore";

const CHART_COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

export function AnalyticsPage() {
  const { data, isLoading } = useAdminAnalytics();
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === "dark";

  const axisColor = isDark ? "#71717a" : "#a1a1aa";
  const tooltipBg = isDark ? "#18181b" : "#ffffff";
  const tooltipBorder = isDark ? "#3f3f46" : "#e4e4e7";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-950">
          <BarChart3 className="h-5 w-5 text-brand-600 dark:text-brand-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Command Center</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Real-time business metrics</p>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              title="Monthly Recurring Revenue"
              value={data?.metrics.mrr.toFixed(2) ?? "0"}
              change={data?.metrics.mrrGrowth}
              icon={DollarSign}
              prefix="$"
              iconColor="text-emerald-600"
            />
            <StatCard
              title="Active Subscribers"
              value={data?.metrics.activeSubscribers ?? 0}
              change={data?.metrics.momGrowth}
              icon={Users}
              iconColor="text-brand-600"
            />
            <StatCard
              title="Churn Rate"
              value={`${data?.metrics.churnRate ?? 0}%`}
              icon={TrendingDown}
              iconColor="text-red-500"
            />
            <StatCard
              title="Total Users"
              value={data?.metrics.totalUsers ?? 0}
              icon={TrendingUp}
              iconColor="text-purple-600"
            />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Bar chart — sign-ups over time (3/5) */}
        <div className="lg:col-span-3 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Sign-ups (Last 30 days)
          </h2>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.signupsTimeline ?? []}>
                <XAxis
                  dataKey="date"
                  tickFormatter={(v: string) => format(new Date(v), "MMM d")}
                  tick={{ fontSize: 11, fill: axisColor }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: axisColor }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    border: `1px solid ${tooltipBorder}`,
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  labelFormatter={(v: string) => format(new Date(v), "MMM d, yyyy")}
                />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Sign-ups" maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Donut chart — plan distribution (2/5) */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Plan Distribution
          </h2>
          {isLoading ? (
            <Skeleton className="h-48 w-full rounded-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data?.planDistribution ?? []}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {data?.planDistribution.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  formatter={(v: string) => (
                    <span style={{ fontSize: 11, color: axisColor }}>{v}</span>
                  )}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    border: `1px solid ${tooltipBorder}`,
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Activity feed */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-zinc-500" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Recent Activity</h2>
        </div>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {data?.recentActivity.map((event) => (
              <div key={event._id} className="flex items-center gap-3 py-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-950">
                  <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                    {event.userEmail?.charAt(0).toUpperCase() ?? "?"}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-zinc-700 dark:text-zinc-300">
                    <span className="font-medium">{event.userEmail ?? "Unknown"}</span>
                    {" · "}
                    <span className="text-zinc-500 capitalize">{event.action.replace(/_/g, " ").toLowerCase()}</span>
                  </p>
                </div>
                <span className="shrink-0 text-xs text-zinc-400">
                  {format(new Date(event.createdAt), "MMM d, HH:mm")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
