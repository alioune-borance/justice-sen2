import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import { useMarkAllAsRead, useNotifications, useUnreadCount } from "../api/notifications.api";
import { useOpenNotification } from "../hooks/useOpenNotification";
import { usePermissions } from "../../auth/hooks/usePermissions";
import { NOTIFICATIONS_PAGE } from "../utils/notificationLink";
import { NotificationItem } from "./NotificationItem";

const DROPDOWN_SIZE = 8;

// Cloche de l'en-tête : nombre de non lues (rafraîchi chaque minute) et dernières notifications
export const NotificationBell: React.FC = () => {
  const { can } = usePermissions();
  const allowed = can("notifications:read");
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const { data: unread = 0 } = useUnreadCount(allowed);
  const { data, isLoading, isError } = useNotifications(
    { page: 1, pageSize: DROPDOWN_SIZE },
    { enabled: allowed && open }
  );
  const markAll = useMarkAllAsRead();
  const openNotification = useOpenNotification();

  // Fermeture au clic à l'extérieur et avec Échap
  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (container.current && !container.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!allowed) return null;
  const label = unread > 0 ? `Notifications : ${unread} non lue${unread > 1 ? "s" : ""}` : "Notifications";
  const notifications = data?.results ?? [];

  // Bouton visible en permanence (bordure et libellé), mis en couleur dès qu'il y a des non lues
  return (
    <div className="relative" ref={container}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={label}
        title={label}
        aria-haspopup="true"
        aria-expanded={open}
        className={`relative inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
          unread > 0
            ? "border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100"
            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
        } ${open ? "ring-2 ring-blue-200" : ""}`}
      >
        <Bell className={`h-5 w-5 ${unread > 0 ? "text-blue-700" : "text-gray-500"}`} />
        <span className="hidden sm:inline">Notifications</span>
        {unread > 0 && (
          <span className="relative inline-flex">
            {/* Halo animé, coupé si l'utilisateur a demandé moins d'animations */}
            <span aria-hidden="true" className="absolute inset-0 rounded-full bg-red-500 opacity-60 motion-safe:animate-ping" />
            <span className="relative min-w-[1.5rem] rounded-full bg-red-600 px-1.5 text-center text-xs font-bold leading-6 text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <p className="font-semibold text-gray-800">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                <CheckCheck className="h-4 w-4" /> Tout marquer comme lu
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {isError ? (
              <p className="p-4 text-sm text-red-600">Impossible de charger les notifications.</p>
            ) : isLoading ? (
              <p className="p-4 text-sm text-gray-500">Chargement…</p>
            ) : notifications.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">Aucune notification.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        openNotification(notification);
                      }}
                      className={`w-full px-4 py-3 hover:bg-gray-50 ${notification.lue ? "" : "bg-blue-50/50"}`}
                    >
                      <NotificationItem notification={notification} compact />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Link
            to={NOTIFICATIONS_PAGE}
            onClick={() => setOpen(false)}
            className="block border-t border-gray-100 px-4 py-2 text-center text-sm text-blue-600 hover:bg-gray-50"
          >
            Voir toutes les notifications
          </Link>
        </div>
      )}
    </div>
  );
};
