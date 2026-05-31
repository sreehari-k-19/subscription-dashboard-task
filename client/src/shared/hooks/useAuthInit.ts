import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { AxiosError } from "axios";
import { useAuthStore } from "../store/authStore";
import { silentRefresh } from "../lib/silentRefresh";
import { clearTokenTimer } from "../lib/tokenTimer";

function isAuthError(err: unknown): boolean {
  const status = (err as AxiosError)?.response?.status;
  return status === 401 || status === 403;
}

export function useAuthInit(): boolean {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const [isInitialized, setIsInitialized] = useState(false);

  // On app mount: if user was authenticated, exchange cookie for fresh access token
  useEffect(() => {
    if (!isHydrated) return;

    const { isAuthenticated } = useAuthStore.getState();

    if (!isAuthenticated) {
      setIsInitialized(true);
      return;
    }

    silentRefresh()
      .catch((err) => {
        // Only clear session on explicit auth rejection (token invalid/expired)
        // Network errors and 5xx: leave auth state — user retries on next API call
        if (isAuthError(err)) {
          useAuthStore.getState().clearAuth();
          clearTokenTimer();
        }
      })
      .finally(() => setIsInitialized(true));
  }, [isHydrated]);

  // When tab regains focus, check if token is near expiry and refresh proactively
  useEffect(() => {
    if (!isInitialized) return;

    function handleVisibility() {
      if (document.visibilityState !== "visible") return;

      const { accessToken, isAuthenticated } = useAuthStore.getState();
      if (!isAuthenticated) return;

      if (!accessToken) {
        silentRefresh().catch((err) => {
          if (isAuthError(err)) useAuthStore.getState().clearAuth();
        });
        return;
      }

      try {
        const { exp } = jwtDecode<{ exp: number }>(accessToken);
        const remaining = exp * 1000 - Date.now();
        if (remaining < 60_000) {
          silentRefresh().catch((err) => {
            if (isAuthError(err)) useAuthStore.getState().clearAuth();
          });
        }
      } catch {
        silentRefresh().catch((err) => {
          if (isAuthError(err)) useAuthStore.getState().clearAuth();
        });
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [isInitialized]);

  return isInitialized;
}
