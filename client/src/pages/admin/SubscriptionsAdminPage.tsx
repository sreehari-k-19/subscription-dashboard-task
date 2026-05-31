import { useState } from "react";
import { Search, Download, ListOrdered } from "lucide-react";
import { useAdminSubscriptions, downloadSubscriptionsCSV } from "@features/admin/api/admin.api";
import { useDebounceSearch } from "@features/admin/hooks/useDebounceSearch";
import { SubscriptionsTable } from "@features/admin/components/SubscriptionsTable";
import { Pagination } from "@shared/components/common/Pagination";
import { useToast } from "@store/notificationStore";

const STATUS_OPTIONS = ["", "active", "expired", "cancelled", "pending", "grace_period"];

export function SubscriptionsAdminPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const { search, debouncedSearch, handleSearch } = useDebounceSearch(() => setPage(1));
  const toast = useToast();

  const { data, isLoading } = useAdminSubscriptions({
    page,
    limit: 20,
    status: status || undefined,
    search: debouncedSearch || undefined,
  });

  const pagination = data?.meta?.pagination;

  async function handleExport() {
    try {
      await downloadSubscriptionsCSV();
      toast.success("Export complete", "CSV downloaded");
    } catch {
      toast.error("Export failed");
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-950">
            <ListOrdered className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Subscriptions</h1>
            {pagination && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{pagination.total} total</p>
            )}
          </div>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-600"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none focus:border-brand-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s ? s.replace("_", " ") : "All statuses"}
            </option>
          ))}
        </select>
      </div>

      {/* Table + pagination */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <SubscriptionsTable data={data?.data} isLoading={isLoading} />
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
