import { useRef, useEffect, useState } from "react";
import {
  Bell, CreditCard, Package, Shield, BellRing,
  CheckCheck, X,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@lib/cn";
import { useAuthStore } from "@store/authStore";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  NOTIFICATIONS_BASE_KEY,
} from "../api/notifications.api";

const TYPE_CONFIG = {
  subscription: {
    icon: Package,
    color: "text-brand-600 bg-brand-100 dark:bg-brand-950 dark:text-brand-400",
  },
  payment: {
    icon: CreditCard,
    color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400",
  },
  admin: {
    icon: Shield,
    color: "text-purple-600 bg-purple-100 dark:bg-purple-950 dark:text-purple-400",
  },
  system: {
    icon: BellRing,
    color: "text-zinc-600 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400",
  },
} as const;

export function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data, isLoading } = useNotifications(20);
  const unreadCount = isAuthenticated ? (data?.unreadCount ?? 0) : 0;

  // Refetch immediately when panel opens
  useEffect(() => {
    if (open) queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_BASE_KEY });
  }, [open, queryClient]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const markOne = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  return (
    <div ref={wrapperRef} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className={cn(
          "relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
          open
            ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
            : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
        )}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-10 z-50 w-[340px] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-400">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAll.mutate()}
                  disabled={markAll.isPending}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-brand-600 transition-colors hover:bg-brand-50 disabled:opacity-50 dark:text-brand-400 dark:hover:bg-brand-950/40"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto scrollbar-thin">
            {isLoading ? (
              <div className="space-y-px">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex gap-3 px-4 py-3">
                    <div className="h-7 w-7 shrink-0 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                    <div className="flex-1 space-y-2 pt-0.5">
                      <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                      <div className="h-3 w-full animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !data?.notifications.length ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Bell className="mb-2 h-6 w-6 text-zinc-300 dark:text-zinc-700" />
                <p className="text-xs text-zinc-400 dark:text-zinc-500">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
                {data.notifications.map((n) => {
                  const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.system;
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={n._id}
                      onClick={() => { if (!n.isRead) markOne.mutate(n._id); }}
                      className={cn(
                        "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40",
                        !n.isRead && "bg-brand-50/60 dark:bg-brand-950/20"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                          cfg.color
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              "text-xs leading-snug text-zinc-900 dark:text-zinc-50",
                              n.isRead ? "font-medium" : "font-semibold"
                            )}
                          >
                            {n.title}
                          </p>
                          {!n.isRead && (
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                          {n.message}
                        </p>
                        <p className="mt-1 text-[10px] text-zinc-400 dark:text-zinc-500">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
