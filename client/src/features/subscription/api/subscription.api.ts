import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@lib/axios";
import { queryKeys } from "@lib/queryKeys";
import { useToast } from "@store/notificationStore";
import type { Plan, Subscription, ProrationPreview, BillingCycle } from "@shared/types";
import type { AxiosError } from "axios";

function extractError(err: unknown): string {
  const e = err as AxiosError<{ error: { message: string } }>;
  return e.response?.data?.error?.message ?? "Something went wrong";
}

export function usePlans() {
  return useQuery({
    queryKey: queryKeys.plans.all,
    queryFn: async () => {
      const { data } = await api.get<{ data: Plan[] }>("/plans");
      return data.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useMySubscription(enabled = true) {
  return useQuery({
    queryKey: queryKeys.subscriptions.me,
    queryFn: async () => {
      const { data } = await api.get<{ data: Subscription | null }>("/subscriptions/me");
      return data.data;
    },
    enabled,
  });
}

export function useSubscriptionHistory() {
  return useQuery({
    queryKey: queryKeys.subscriptions.history,
    queryFn: async () => {
      const { data } = await api.get<{ data: Subscription[] }>("/subscriptions/me/history");
      return data.data;
    },
  });
}

export function useProrationPreview(newPlanId: string, billingCycle: BillingCycle, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.subscriptions.prorationPreview(newPlanId),
    queryFn: async () => {
      const { data } = await api.get<{ data: ProrationPreview }>(
        `/subscriptions/proration-preview/${newPlanId}`,
        { params: { billingCycle } }
      );
      return data.data;
    },
    enabled,
  });
}

export function useSubscribe() {
  const qc = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({
      planId,
      billingCycle,
      couponCode,
    }: {
      planId: string;
      billingCycle: BillingCycle;
      couponCode?: string;
    }) => {
      const { data } = await api.post(`/subscriptions/${planId}`, {
        billingCycle,
        couponCode,
      });
      return data.data as { subscription: Subscription; sessionUrl: string | null };
    },
    onSuccess: (data: { subscription: unknown; sessionUrl: string | null }) => {
      if (data.sessionUrl) {
        // Paid plan — redirect to Stripe Checkout
        window.location.href = data.sessionUrl;
      } else {
        // Free plan — activate immediately
        qc.invalidateQueries({ queryKey: queryKeys.subscriptions.me });
        toast.success("Subscribed!", "Your plan is now active.");
      }
    },
    onError: (err) => toast.error("Subscription failed", extractError(err)),
  });
}

export function useSwitchPlan() {
  const qc = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({
      newPlanId,
      billingCycle,
    }: {
      newPlanId: string;
      billingCycle: BillingCycle;
    }) => {
      const { data } = await api.patch(`/subscriptions/switch/${newPlanId}`, { billingCycle });
      return data.data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.subscriptions.me });
      qc.invalidateQueries({ queryKey: queryKeys.subscriptions.history });
      qc.removeQueries({ queryKey: queryKeys.subscriptions.prorationPreview(vars.newPlanId) });
      toast.success("Plan switched!", "Your new plan is active.");
    },
    onError: (err) => toast.error("Plan switch failed", extractError(err)),
  });
}

export function useCancelSubscription() {
  const qc = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (reason?: string) => {
      await api.patch("/subscriptions/cancel", { reason });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.subscriptions.me });
      qc.invalidateQueries({ queryKey: queryKeys.subscriptions.history });
      toast.success("Subscription cancelled");
    },
    onError: (err) => toast.error("Cancellation failed", extractError(err)),
  });
}

export function useToggleAutoRenew() {
  const qc = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (autoRenew: boolean) => {
      await api.patch("/subscriptions/auto-renew", { autoRenew });
    },
    onSuccess: (_, autoRenew) => {
      qc.invalidateQueries({ queryKey: queryKeys.subscriptions.me });
      toast.success(`Auto-renew ${autoRenew ? "enabled" : "disabled"}`);
    },
    onError: (err) => toast.error("Failed to update auto-renew", extractError(err)),
  });
}
