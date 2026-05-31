import { useMutation } from "@tanstack/react-query";
import { api } from "@lib/axios";
import { useAuthStore } from "@store/authStore";
import { useToast } from "@store/notificationStore";
import type { User } from "@shared/types";

interface ProfileUpdatePayload {
  name: string;
  phone?: string;
}

export function useUpdateProfile() {
  const { setAuth, accessToken } = useAuthStore();
  const toast = useToast();

  return useMutation({
    mutationFn: async (data: ProfileUpdatePayload) => {
      const res = await api.patch<{ data: User }>("/user/profile", data);
      return res.data.data;
    },
    onSuccess: (updated) => {
      if (updated && accessToken) setAuth(updated, accessToken);
      toast.success("Profile updated");
    },
    onError: () => toast.error("Update failed"),
  });
}
