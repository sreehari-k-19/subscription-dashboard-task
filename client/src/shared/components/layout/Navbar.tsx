import { Sun, Moon, Monitor } from "lucide-react";
import { useThemeStore } from "@store/themeStore";
import { NotificationPanel } from "@features/notifications/components/NotificationPanel";

export function Navbar() {
  const { theme, setTheme } = useThemeStore();

  function cycleTheme() {
    const order: Array<typeof theme> = ["light", "dark", "system"];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
  }

  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  return (
    <header className="flex h-16 shrink-0 items-center justify-end gap-2 border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-900">
      <button
        onClick={cycleTheme}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
        title={`Theme: ${theme}`}
      >
        <ThemeIcon className="h-4 w-4" />
      </button>

      <NotificationPanel />
    </header>
  );
}
