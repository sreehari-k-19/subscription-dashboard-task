import { format } from "date-fns";
import { Bell } from "lucide-react";
import {
  useNotifications,
  useMarkAllNotificationsRead,
} from "@features/notifications/api/notifications.api";
import { cn } from "@lib/cn";

export function NotificationsSection() {
  const { data, isLoading } = useNotifications(20);
  const markAll = useMarkAllNotificationsRead();

  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-zinc-500" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Notifications</h2>
          {(data?.unreadCount ?? 0) > 0 && (
            <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs font-bold text-white">
              {data!.unreadCount}
            </span>
          )}
        </div>
        {(data?.unreadCount ?? 0) > 0 && (
          <button
            onClick={() => markAll.mutate()}
            className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="mt-1.5 h-2 w-2 shrink-0 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                  <div className="h-3 w-56 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                </div>
              </div>
            ))}
          </div>
        ) : !data?.notifications.length ? (
          <div className="p-8 text-center text-sm text-zinc-500">No notifications yet</div>
        ) : (
          data.notifications.map((n) => (
            <div
              key={n._id}
              className={cn(
                "flex items-start gap-3 px-5 py-3.5 transition-colors",
                !n.isRead && "bg-brand-50/40 dark:bg-brand-950/20"
              )}
            >
              <div
                className={cn(
                  "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                  !n.isRead ? "bg-brand-600" : "bg-zinc-200 dark:bg-zinc-700"
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{n.title}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{n.message}</p>
              </div>
              <span className="shrink-0 text-xs text-zinc-400">
                {format(new Date(n.createdAt), "MMM d")}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
