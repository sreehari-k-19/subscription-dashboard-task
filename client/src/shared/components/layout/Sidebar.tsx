import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Layers,
  CreditCard,
  User,
  BarChart3,
  Users,
  ListOrdered,
  LogOut,
  Zap,
} from "lucide-react";
import { cn } from "@lib/cn";
import { useAuthStore } from "@store/authStore";
import { api } from "@lib/axios";
import { clearTokenTimer } from "@shared/lib/tokenTimer";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const userNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Plans", href: "/plans", icon: Layers },
  { label: "Billing", href: "/billing", icon: CreditCard },
  { label: "Profile", href: "/profile", icon: User },
];

const adminNav: NavItem[] = [
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Subscriptions", href: "/admin/subscriptions", icon: ListOrdered },
  { label: "Users", href: "/admin/users", icon: Users },
];

export function Sidebar() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
  const navItems = isAdmin ? adminNav : userNav;

  async function handleLogout() {
    try {
      await api.post("/auth/logout"); // cookie sent automatically
    } catch {
      // Logout best-effort
    } finally {
      clearAuth();
      clearTokenTimer();
      navigate("/login");
    }
  }

  return (
    <aside className="flex h-screen w-[240px] shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-zinc-200 px-5 dark:border-zinc-800">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          SubDash
        </span>
        {isAdmin && (
          <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            Admin
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        <ul className="space-y-0.5">
          {navItems.map((item) => (
            <li key={item.href}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                  )
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User footer */}
      <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
        <div className="mb-2 flex items-center gap-2.5 rounded-lg px-3 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-900 dark:text-brand-300">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-zinc-900 dark:text-zinc-50">
              {user?.name}
            </p>
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
              {user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-950 dark:hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
