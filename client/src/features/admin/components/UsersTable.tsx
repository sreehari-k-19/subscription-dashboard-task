import { format } from "date-fns";
import { ShieldCheck, UserX, UserCheck } from "lucide-react";
import { useToggleUserActive } from "../api/admin.api";
import { Skeleton } from "@shared/components/common/SkeletonCard";
import { cn } from "@lib/cn";
import type { User } from "@shared/types";

interface UsersTableProps {
  data: User[] | undefined;
  isLoading: boolean;
}

const COLUMNS = ["User", "Role", "Status", "Joined", "Last login", "Actions"];

export function UsersTable({ data, isLoading }: UsersTableProps) {
  const toggleActive = useToggleUserActive();

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
                {[...Array(6)].map((__, j) => (
                  <td key={j} className="px-4 py-3">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))
          ) : !data?.length ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                No users found
              </td>
            </tr>
          ) : (
            data.map((user) => (
              <tr
                key={user.id}
                className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
              >
                {/* User */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-900 dark:text-brand-300">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">{user.name}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{user.email}</p>
                    </div>
                  </div>
                </td>

                {/* Role */}
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                      user.role === "admin"
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    )}
                  >
                    {user.role === "admin" && <ShieldCheck className="h-3 w-3" />}
                    {user.role}
                  </span>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                      user.isActive
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    )}
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </td>

                {/* Joined */}
                <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                  {format(new Date(user.createdAt), "MMM d, yyyy")}
                </td>

                {/* Last login */}
                <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                  {user.lastLoginAt ? format(new Date(user.lastLoginAt), "MMM d, HH:mm") : "—"}
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  {user.role !== "admin" && (
                    <button
                      onClick={() => toggleActive.mutate(user.id)}
                      disabled={toggleActive.isPending}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
                        user.isActive
                          ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                          : "text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                      )}
                    >
                      {user.isActive ? (
                        <UserX className="h-3.5 w-3.5" />
                      ) : (
                        <UserCheck className="h-3.5 w-3.5" />
                      )}
                      {user.isActive ? "Deactivate" : "Activate"}
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
