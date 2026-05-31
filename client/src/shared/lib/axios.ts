import axios from "axios";
import { useAuthStore } from "../store/authStore";
import { silentRefresh } from "./silentRefresh";
import { clearTokenTimer } from "./tokenTimer";

const BASE_URL = `${import.meta.env.VITE_API_URL ?? ""}/api/v1`;

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
  withCredentials: true, // sends HttpOnly refresh cookie automatically
});

// Attach access token (in-memory) to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Fallback: silent refresh on 401 (handles timer misses — tab sleep, etc.)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const newToken = await silentRefresh();
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshError) {
        // Only end the session when the server explicitly rejects the refresh token
        // (401/403). Network errors and 5xx should not log the user out.
        const status = (refreshError as import("axios").AxiosError)?.response?.status;
        if (status === 401 || status === 403) {
          useAuthStore.getState().clearAuth();
          clearTokenTimer();
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
