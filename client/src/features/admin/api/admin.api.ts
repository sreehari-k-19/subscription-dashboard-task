import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@lib/axios";
import { queryKeys } from "@lib/queryKeys";
import { useToast } from "@store/notificationStore";
import type { Analytics, Subscription, User } from "@shared/types";
import type { AxiosError } from "axios";

function extractError(err: unknown): string {
  const e = err as AxiosError<{ error: { message: string } }>;
  return e.response?.data?.error?.message ?? "Something went wrong";
}

export function useAdminAnalytics() {
  return useQuery({
    queryKey: queryKeys.admin.analytics,
    queryFn: async () => {
      const { data } = await api.get<{ data: Analytics }>("/admin/analytics");
      return data.data;
    },
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 2,
  });
}

export function useAdminSubscriptions(params: {
  page: number;
  limit: number;
  status?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: queryKeys.admin.subscriptions(params),
    queryFn: async () => {
      const { data } = await api.get("/admin/subscriptions", { params });
      return data as {
        data: Subscription[];
        meta: { pagination: { page: number; limit: number; total: number; totalPages: number } };
      };
    },
  });
}

export function useAdminUsers(params: {
  page: number;
  limit: number;
  search?: string;
  role?: string;
}) {
  return useQuery({
    queryKey: queryKeys.admin.users(params),
    queryFn: async () => {
      const { data } = await api.get("/admin/users", { params });
      return data as {
        data: User[];
        meta: { pagination: { page: number; limit: number; total: number; totalPages: number } };
      };
    },
  });
}

export function useToggleUserActive() {
  const qc = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await api.patch(`/admin/users/${userId}/toggle-active`);
      return data.data as { isActive: boolean; message: string };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success(result.message);
    },
    onError: (err) => toast.error("Action failed", extractError(err)),
  });
}

export function useAdminAssignPlan() {
  const qc = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (payload: {
      userId: string;
      planId: string;
      billingCycle: "monthly" | "yearly";
      note?: string;
    }) => {
      const { data } = await api.post("/admin/subscriptions/assign", payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "subscriptions"] });
      qc.invalidateQueries({ queryKey: ["admin", "analytics"] });
      toast.success("Plan assigned successfully");
    },
    onError: (err) => toast.error("Assignment failed", extractError(err)),
  });
}

export async function downloadSubscriptionsCSV() {
  const response = await api.get("/admin/subscriptions/export", {
    responseType: "blob",
  });
  const url = URL.createObjectURL(response.data as Blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `subscriptions-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
