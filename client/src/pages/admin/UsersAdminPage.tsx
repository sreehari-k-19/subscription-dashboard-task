import { useState } from "react";
import { Search, Users } from "lucide-react";
import { useAdminUsers } from "@features/admin/api/admin.api";
import { useDebounceSearch } from "@features/admin/hooks/useDebounceSearch";
import { UsersTable } from "@features/admin/components/UsersTable";
import { Pagination } from "@shared/components/common/Pagination";

export function UsersAdminPage() {
  const [page, setPage] = useState(1);
  const [role, setRole] = useState("");
  const { search, debouncedSearch, handleSearch } = useDebounceSearch(() => setPage(1));

  const { data, isLoading } = useAdminUsers({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    role: role || undefined,
  });

  const pagination = data?.meta?.pagination;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-950">
          <Users className="h-5 w-5 text-brand-600 dark:text-brand-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Users</h1>
          {pagination && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{pagination.total} total</p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm outline-none placeholder:text-zinc-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-600"
          />
        </div>
        <select
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1); }}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none focus:border-brand-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        >
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Table + pagination */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <UsersTable data={data?.data} isLoading={isLoading} />
        {pagination && (
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={20}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}
