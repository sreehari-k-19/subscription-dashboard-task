import { createBrowserRouter, Navigate } from "react-router-dom";
import { AuthGuard } from "./guards/AuthGuard";
import { GuestGuard } from "./guards/GuestGuard";
import { RoleGuard } from "./guards/RoleGuard";
import { AppShell } from "@shared/components/layout/AppShell";
import { RootLayout } from "@shared/components/layout/RootLayout";

// Pages — lazy loaded
import { lazy, Suspense } from "react";
import { PageLoader } from "@shared/components/common/PageLoader";

const LoginPage = lazy(() => import("@pages/auth/LoginPage").then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("@pages/auth/RegisterPage").then((m) => ({ default: m.RegisterPage })));
const PricingPage = lazy(() => import("@pages/user/PricingPage").then((m) => ({ default: m.PricingPage })));
const DashboardPage = lazy(() => import("@pages/user/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const PlansPage = lazy(() => import("@pages/user/PlansPage").then((m) => ({ default: m.PlansPage })));
const BillingPage = lazy(() => import("@pages/user/BillingPage").then((m) => ({ default: m.BillingPage })));
const ProfilePage = lazy(() => import("@pages/user/ProfilePage").then((m) => ({ default: m.ProfilePage })));
const AnalyticsPage = lazy(() => import("@pages/admin/AnalyticsPage").then((m) => ({ default: m.AnalyticsPage })));
const SubscriptionsAdminPage = lazy(() => import("@pages/admin/SubscriptionsAdminPage").then((m) => ({ default: m.SubscriptionsAdminPage })));
const UsersAdminPage = lazy(() => import("@pages/admin/UsersAdminPage").then((m) => ({ default: m.UsersAdminPage })));
const NotFoundPage = lazy(() => import("@pages/errors/NotFoundPage").then((m) => ({ default: m.NotFoundPage })));
const UnauthorizedPage = lazy(() => import("@pages/errors/UnauthorizedPage").then((m) => ({ default: m.UnauthorizedPage })));

const wrap = (Component: React.ComponentType) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // Public pricing page
      { path: "/pricing", element: wrap(PricingPage) },

      // Guest-only routes
      {
        element: <GuestGuard />,
        children: [
          { path: "/login", element: wrap(LoginPage) },
          { path: "/register", element: wrap(RegisterPage) },
        ],
      },

      // Authenticated routes
      {
        element: <AuthGuard />,
        children: [
          {
            element: <AppShell />,
            children: [
              // User routes
              { path: "/dashboard", element: wrap(DashboardPage) },
              { path: "/plans", element: wrap(PlansPage) },
              { path: "/billing", element: wrap(BillingPage) },
              { path: "/profile", element: wrap(ProfilePage) },

              // Admin-only routes
              {
                element: <RoleGuard allowedRoles={["admin"]} />,
                children: [
                  { path: "/admin/analytics", element: wrap(AnalyticsPage) },
                  { path: "/admin/subscriptions", element: wrap(SubscriptionsAdminPage) },
                  { path: "/admin/users", element: wrap(UsersAdminPage) },
                ],
              },
            ],
          },
        ],
      },

      // Root redirect
      { path: "/", element: <Navigate to="/pricing" replace /> },
      { path: "/unauthorized", element: wrap(UnauthorizedPage) },
      { path: "*", element: wrap(NotFoundPage) },
    ],
  },
]);
