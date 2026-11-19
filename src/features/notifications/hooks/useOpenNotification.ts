import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../auth/store/auth.store";
import { useMarkAsRead } from "../api/notifications.api";
import { AppNotification } from "../types/notification";
import { notificationTarget } from "../utils/notificationLink";

// Clic sur une notification : marquée comme lue, puis ouverture de la page concernée
export const useOpenNotification = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { mutate: markAsRead } = useMarkAsRead();
  return useCallback(
    (notification: AppNotification) => {
      if (!notification.lue) markAsRead(notification.id);
      navigate(notificationTarget(notification, user));
    },
    [markAsRead, navigate, user]
  );
};
