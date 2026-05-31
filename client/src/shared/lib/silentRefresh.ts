import axios, { AxiosError } from "axios";
import { useAuthStore } from "../store/authStore";
import { scheduleTokenRefresh, clearTokenTimer } from "./tokenTimer";
import type { User } from "../types";

const BASE_URL = `${import.meta.env.VITE_API_URL ?? ""}/api/v1`;

interface RefreshResponse {
  data: {
    accessToken: string;
    user: User;
  };
}

// Deduplicates concurrent refresh calls — all callers share one in-flight request
let refreshPromise: Promise<string> | null = null;

function isAuthError(err: unknown): boolean {
  const status = (err as AxiosError)?.response?.status;
  return status === 401 || status === 403;
}

function scheduleNext(accessToken: string): void {
  scheduleTokenRefresh(accessToken, () => {
    silentRefresh().catch((err) => {
      // Only revoke session for actual auth rejections, not network/server errors
      if (isAuthError(err)) {
        useAuthStore.getState().clearAuth();
        clearTokenTimer();
      }
    });
  });
}

export async function silentRefresh(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = axios
    .post<RefreshResponse>(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true })
    .then(({ data }) => {
      const { accessToken, user } = data.data;
      useAuthStore.getState().setAuth(user, accessToken);
      scheduleNext(accessToken);
      return accessToken;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

// Call after login/register to start the refresh cycle
export function initRefreshCycle(accessToken: string): void {
  scheduleNext(accessToken);
}
