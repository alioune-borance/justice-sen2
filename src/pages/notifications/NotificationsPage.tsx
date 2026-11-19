import React from "react";
import { useSearchParams } from "react-router-dom";
import { Bell, Check, CheckCheck, ChevronLeft, ChevronRight } from "lucide-react";
import {
  useMarkAllAsRead,
  useMarkAsRead,
  useNotifications,
  useUnreadCount,
} from "../../features/notifications/api/notifications.api";
import { NotificationItem } from "../../features/notifications/components/NotificationItem";
import { useOpenNotification } from "../../features/notifications/hooks/useOpenNotification";
import { PAGE_SIZE, ReadFilter } from "../../features/notifications/types/notification";
import { getApiErrorMessage } from "../../shared/api/errorMessages";

const FILTERS: { value: ReadFilter; label: string }[] = [
  { value: "toutes", label: "Toutes" },
  { value: "non_lues", label: "Non lues" },
  { value: "lues", label: "Lues" },
];

const EMPTY: Record<ReadFilter, string> = {
  toutes: "Aucune notification.",
  non_lues: "Aucune notification non lue.",
  lues: "Aucune notification lue.",
};

// Toutes les notifications de l'utilisateur, paginées, avec un filtre lues / non lues
export const NotificationsPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const lecture: ReadFilter = FILTERS.find((f) => f.value === params.get("lecture"))?.value ?? "toutes";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const { data, isLoading, isError } = useNotifications({ page, lecture });
  const { data: unread = 0 } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAll = useMarkAllAsRead();
  const openNotification = useOpenNotification();

  // Filtre et page dans l'URL (le filtre ramène à la première page)
  const update = (next: { lecture?: ReadFilter; page?: number }) => {
    const search = new URLSearchParams(params);
    const value = next.lecture ?? lecture;
    if (value === "toutes") search.delete("lecture");
    else search.set("lecture", value);
    const target = next.page ?? 1;
    if (target > 1) search.set("page", String(target));
    else search.delete("page");
    setParams(search, { replace: true });
  };

  const count = data?.count ?? 0;
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const error = markAll.error ?? markAsRead.error;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-2"><Bell className="h-6 w-6 text-blue-600" /></div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Notifications</h2>
            <p className="text-sm text-gray-500">
              {unread > 0 ? `${unread} non lue${unread > 1 ? "s" : ""}` : "Tout est lu"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => markAll.mutate()}
          disabled={unread === 0 || markAll.isPending}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <CheckCheck className="h-4 w-4" /> Tout marquer comme lu
        </button>
      </div>

      <div className="flex gap-2" role="tablist" aria-label="Filtre de lecture">
        {FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            role="tab"
            aria-selected={lecture === filter.value}
            onClick={() => update({ lecture: filter.value })}
            className={`rounded-full px-3 py-1 text-sm ${
              lecture === filter.value ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{getApiErrorMessage(error)}</p>
      )}

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        {isError ? (
          <p className="p-6 text-sm text-red-600">Impossible de charger les notifications.</p>
        ) : isLoading ? (
          <p className="p-6 text-sm text-gray-500">Chargement…</p>
        ) : !data || data.results.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">{EMPTY[lecture]}</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {data.results.map((notification) => (
              <li key={notification.id} className={`flex items-start gap-3 p-4 ${notification.lue ? "" : "bg-blue-50/40"}`}>
                <button
                  type="button"
                  onClick={() => openNotification(notification)}
                  className="min-w-0 flex-1 hover:opacity-80"
                >
                  <NotificationItem notification={notification} />
                </button>
                {!notification.lue && (
                  <button
                    type="button"
                    onClick={() => markAsRead.mutate(notification.id)}
                    disabled={markAsRead.isPending}
                    className="flex flex-shrink-0 items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" /> Marquer comme lue
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {count > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {count} notification{count > 1 ? "s" : ""} — page {page} sur {pages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => update({ page: page - 1 })}
              disabled={page <= 1}
              className="flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" /> Précédent
            </button>
            <button
              type="button"
              onClick={() => update({ page: page + 1 })}
              disabled={!data?.next}
              className="flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
            >
              Suivant <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
