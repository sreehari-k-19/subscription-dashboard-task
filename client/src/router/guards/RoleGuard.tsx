import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@store/authStore";

interface RoleGuardProps {
  allowedRoles: string[];
}

export function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const user = useAuthStore((s) => s.user);

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
