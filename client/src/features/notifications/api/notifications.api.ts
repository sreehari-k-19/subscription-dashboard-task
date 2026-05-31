import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@lib/axios";
import { useToast } from "@store/notificationStore";
import type { Notification } from "@shared/types";

export interface NotificationData {
  notifications: Notification[];
  unreadCount: number;
}

// All notification queries share this prefix so one invalidateQueries call clears everything
export const NOTIFICATIONS_BASE_KEY = ["notifications"] as const;

export function useNotifications(limit = 20) {
  return useQuery({
    queryKey: [...NOTIFICATIONS_BASE_KEY, "list", limit] as const,
    queryFn: async () => {
      const res = await api.get<{ data: NotificationData }>(`/user/notifications?limit=${limit}`);
      return res.data.data;
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 30,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/user/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTIFICATIONS_BASE_KEY }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: () => api.patch("/user/notifications/read-all"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIFICATIONS_BASE_KEY });
      toast.success("All notifications marked as read");
    },
  });
}
