import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@lib/cn";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

function getPageWindows(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
  if (current >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
}

const btnBase =
  "flex h-7 w-7 items-center justify-center rounded-md border text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40";
const btnDefault =
  "border-zinc-300 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800";
const btnActive =
  "border-brand-500 bg-brand-600 text-white hover:bg-brand-700 dark:border-brand-500";

export function Pagination({ page, totalPages, total, limit, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const pages = getPageWindows(page, totalPages);

  return (
    <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {total === 0 ? "No results" : `${from}–${to} of ${total}`}
      </p>

      <div className="flex items-center gap-1">
        {/* First */}
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className={cn(btnBase, btnDefault)}
          aria-label="First page"
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </button>

        {/* Prev */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className={cn(btnBase, btnDefault)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        {/* Page numbers */}
        {pages.map((p, i) =>
          p === "..." ? (
            <span
              key={`ellipsis-${i}`}
              className="flex h-7 w-5 items-end justify-center pb-0.5 text-xs text-zinc-400"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={cn(btnBase, p === page ? btnActive : btnDefault)}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className={cn(btnBase, btnDefault)}
          aria-label="Next page"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>

        {/* Last */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          className={cn(btnBase, btnDefault)}
          aria-label="Last page"
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
