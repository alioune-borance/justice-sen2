import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../../shared/api/axiosInstance";
import { AppNotification, NotificationFilters, NotificationPage, PAGE_SIZE } from "../types/notification";

// Rafraîchissement du compteur de la cloche
const UNREAD_REFRESH_MS = 60 * 1000;

export const getNotifications = async (filters: NotificationFilters = {}): Promise<NotificationPage> => {
  const { data } = await axiosInstance.get<NotificationPage>("notifications/", {
    params: {
      page: filters.page ?? 1,
      page_size: filters.pageSize ?? PAGE_SIZE,
      non_lues: filters.lecture === "non_lues" ? 1 : undefined,
      lues: filters.lecture === "lues" ? 1 : undefined,
    },
  });
  return data;
};

export const getUnreadCount = async (): Promise<number> => {
  const { data } = await axiosInstance.get<{ non_lues: number }>("notifications/unread-count/");
  return data.non_lues;
};

export const markAsRead = async (id: number): Promise<AppNotification> => {
  const { data } = await axiosInstance.post<AppNotification>(`notifications/${id}/read/`, {});
  return data;
};

export const markAllAsRead = async (): Promise<number> => {
  const { data } = await axiosInstance.post<{ marquees: number }>("notifications/read-all/", {});
  return data.marquees;
};

// --- Hooks ---------------------------------------------------------------------------------------
export const useUnreadCount = (enabled = true) =>
  useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: getUnreadCount,
    enabled,
    staleTime: 15 * 1000,
    refetchInterval: enabled ? UNREAD_REFRESH_MS : false,
    // Retour sur l'onglet : compteur à jour (la config globale désactive ce rafraîchissement)
    refetchOnWindowFocus: true,
  });

export const useNotifications = (filters: NotificationFilters = {}, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ["notifications", "list", filters],
    queryFn: () => getNotifications(filters),
    enabled: options?.enabled ?? true,
    staleTime: 15 * 1000,
  });

const useInvalidateNotifications = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["notifications"] });
};

export const useMarkAsRead = () => {
  const invalidate = useInvalidateNotifications();
  return useMutation({ mutationFn: markAsRead, onSuccess: invalidate });
};

export const useMarkAllAsRead = () => {
  const invalidate = useInvalidateNotifications();
  return useMutation({ mutationFn: markAllAsRead, onSuccess: invalidate });
};
