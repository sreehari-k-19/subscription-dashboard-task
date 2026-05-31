import { cn } from "@lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800", className)} />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <Skeleton className="mb-3 h-4 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="mt-2 h-3 w-16" />
    </div>
  );
}
