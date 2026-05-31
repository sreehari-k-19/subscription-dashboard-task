import { useQuery } from "@tanstack/react-query";
import { api } from "@lib/axios";
import { queryKeys } from "@lib/queryKeys";
import { useAuthStore } from "@store/authStore";

export function useNotificationBell() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data } = useQuery({
    queryKey: queryKeys.notifications.all(),
    queryFn: async () => {
      const res = await api.get("/user/notifications?limit=1&unread=true");
      return res.data.data as { unreadCount: number };
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 30, // refetch every 30s
    refetchInterval: 1000 * 30,
  });

  return { unreadCount: data?.unreadCount ?? 0 };
}
