import { jwtDecode } from "jwt-decode";

let refreshTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleTokenRefresh(accessToken: string, onRefresh: () => void): void {
  clearTokenTimer();

  try {
    const { exp } = jwtDecode<{ exp: number }>(accessToken);
    const msUntilExpiry = exp * 1000 - Date.now();
    // Refresh 60s before expiry; if already within that window, refresh now
    const delay = Math.max(0, msUntilExpiry - 60_000);
    refreshTimer = setTimeout(onRefresh, delay);
  } catch {
    // Malformed token — skip scheduling
  }
}

export function clearTokenTimer(): void {
  if (refreshTimer !== null) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}
