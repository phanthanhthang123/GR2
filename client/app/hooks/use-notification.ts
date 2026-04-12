import { fetchData, updateData } from "@/lib/fetch-utlis";
import type { AppNotification } from "@/type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type NotificationsResponse = {
  err: number;
  response: AppNotification[];
  unreadCount: number;
};

export const useMyNotificationsQuery = (limit = 20) => {
  return useQuery<NotificationsResponse>({
    queryKey: ["my-notifications", limit],
    queryFn: async () => fetchData<NotificationsResponse>(`/notification/my?limit=${limit}`),
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });
};

export const useMarkNotificationReadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) =>
      updateData(`/notification/${notificationId}/read`, {}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["my-notifications"] });
    },
  });
};

export const useMarkAllNotificationsReadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => updateData("/notification/read-all", {}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["my-notifications"] });
    },
  });
};
