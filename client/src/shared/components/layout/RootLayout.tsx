import { Outlet } from "react-router-dom";
import { useAuthInit } from "@shared/hooks/useAuthInit";
import { PageLoader } from "../common/PageLoader";

export function RootLayout() {
  const isInitialized = useAuthInit();

  if (!isInitialized) return <PageLoader />;

  return <Outlet />;
}
