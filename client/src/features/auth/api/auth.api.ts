import { useMutation } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "@lib/axios";
import { useAuthStore } from "@store/authStore";
import { useToast } from "@store/notificationStore";
import { queryClient } from "@lib/queryClient";
import { initRefreshCycle } from "@shared/lib/silentRefresh";
import { clearTokenTimer } from "@shared/lib/tokenTimer";
import type { User } from "@shared/types";
import type { AxiosError } from "axios";

interface AuthResponse {
  user: User;
  accessToken: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

function extractRawError(err: unknown): string {
  const axiosErr = err as AxiosError<{ error: { message: string } }>;
  return axiosErr.response?.data?.error?.message ?? "";
}

export function getLoginErrorMessage(err: unknown): string {
  const raw = extractRawError(err).toLowerCase();
  if (
    raw.includes("invalid") ||
    raw.includes("incorrect") ||
    raw.includes("credentials") ||
    raw.includes("wrong password") ||
    raw.includes("unauthorized")
  ) {
    return "Incorrect email or password. Please check and try again.";
  }
  if (raw.includes("not found") || raw.includes("no user") || raw.includes("no account")) {
    return "No account found with that email address.";
  }
  return "Couldn't sign you in. Please try again.";
}

export function getRegisterErrorMessage(err: unknown): string {
  const raw = extractRawError(err).toLowerCase();
  if (
    raw.includes("already") ||
    raw.includes("exists") ||
    raw.includes("taken") ||
    raw.includes("duplicate") ||
    raw.includes("in use")
  ) {
    return "An account with this email already exists. Try signing in instead.";
  }
  return "Couldn't create your account. Please try again.";
}

function usePostAuthRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  return (user: User) => {
    const plan = new URLSearchParams(location.search).get("plan");
    if (plan) {
      navigate(`/plans?autoselect=${plan}`);
    } else if (user.role === "admin") {
      navigate("/admin/analytics");
    } else {
      navigate("/dashboard");
    }
  };
}

export function useRegister() {
  const { setAuth } = useAuthStore();
  const toast = useToast();
  const redirect = usePostAuthRedirect();

  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const { data } = await api.post<{ data: AuthResponse }>("/auth/register", payload);
      return data.data;
    },
    onSuccess: ({ user, accessToken }) => {
      setAuth(user, accessToken);
      initRefreshCycle(accessToken);
      toast.success("Welcome!", `Account created for ${user.name}`);
      redirect(user);
    },
    onError: (err) => toast.error("Registration failed", getRegisterErrorMessage(err)),
  });
}

export function useLogin() {
  const { setAuth } = useAuthStore();
  const toast = useToast();
  const redirect = usePostAuthRedirect();

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const { data } = await api.post<{ data: AuthResponse }>("/auth/login", payload);
      return data.data;
    },
    onSuccess: ({ user, accessToken }) => {
      setAuth(user, accessToken);
      initRefreshCycle(accessToken);
      toast.success("Welcome back!", `Signed in as ${user.name}`);
      redirect(user);
    },
    onError: (err) => toast.error("Sign-in failed", getLoginErrorMessage(err)),
  });
}

export function useLogout() {
  const { clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();

  return useMutation({
    mutationFn: async () => {
      // Cookie sent automatically; no body needed
      await api.post("/auth/logout");
    },
    onSuccess: () => {
      clearAuth();
      clearTokenTimer();
      queryClient.clear();
      navigate("/login");
    },
    onError: () => {
      clearAuth();
      clearTokenTimer();
      queryClient.clear();
      navigate("/login");
      toast.warning("Logged out", "Session cleared locally");
    },
  });
}
