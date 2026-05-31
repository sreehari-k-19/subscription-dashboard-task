import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-zinc-950">
      <p className="font-mono text-6xl font-bold text-zinc-200 dark:text-zinc-800">404</p>
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Page not found</h1>
      <Link to="/dashboard" className="text-sm text-brand-600 hover:underline dark:text-brand-400">
        Back to dashboard
      </Link>
    </div>
  );
}
