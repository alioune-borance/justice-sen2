import { matchPath } from "react-router-dom";
import { ROUTE_ACCESS, RoutePath, isScreenAllowed } from "../../auth/config/rbac";
import { isAccessAllowed } from "../../auth/hooks/usePermissions";
import { User } from "../../auth/types/user.types";
import { AppNotification } from "../types/notification";

export const NOTIFICATIONS_PAGE = "/notifications";

// Écran à ouvrir pour une notification : son lien s'il correspond à une route existante que l'utilisateur
// peut ouvrir (mêmes règles que la sidebar), sinon la page des notifications (ex. écran pas encore créé).
export const notificationTarget = (notification: AppNotification, user: User | null): string => {
  const lien = notification.lien?.trim();
  if (!lien || !lien.startsWith("/")) return NOTIFICATIONS_PAGE;
  const pathname = lien.split(/[?#]/)[0];
  const route = (Object.keys(ROUTE_ACCESS) as RoutePath[]).find((path) => matchPath({ path, end: true }, pathname));
  if (!route) return NOTIFICATIONS_PAGE;
  if (!isScreenAllowed(user?.role, pathname) || !isAccessAllowed(user, ROUTE_ACCESS[route])) return NOTIFICATIONS_PAGE;
  return lien;
};

// « il y a 5 min », « il y a 2 h », « hier », puis la date
export const timeAgo = (iso: string): string => {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "à l'instant";
  if (seconds < 3600) return `il y a ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `il y a ${Math.floor(seconds / 3600)} h`;
  if (seconds < 2 * 86400) return "hier";
  if (seconds < 7 * 86400) return `il y a ${Math.floor(seconds / 86400)} jours`;
  return new Date(iso).toLocaleDateString("fr-FR");
};
