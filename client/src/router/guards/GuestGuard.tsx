import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@store/authStore";

export function GuestGuard() {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (isAuthenticated) {
    const plan = new URLSearchParams(location.search).get("plan");
    if (plan) {
      return <Navigate to={`/plans?autoselect=${plan}`} replace />;
    }
    return <Navigate to={user?.role === "admin" ? "/admin/analytics" : "/dashboard"} replace />;
  }

  return <Outlet />;
}
