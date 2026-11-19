import React from "react";
import { AlertTriangle, CalendarClock, Gavel, Hourglass } from "lucide-react";
import { AppNotification, NotificationType } from "../types/notification";
import { timeAgo } from "../utils/notificationLink";

const ICONS: Record<NotificationType, { icon: React.ReactNode; style: string }> = {
  AUDIENCE_RAPPEL: { icon: <CalendarClock className="h-4 w-4" />, style: "bg-blue-100 text-blue-700" },
  AUDIENCE_VEILLE: { icon: <CalendarClock className="h-4 w-4" />, style: "bg-orange-100 text-orange-700" },
  DECISION_JUSTICE: { icon: <Gavel className="h-4 w-4" />, style: "bg-purple-100 text-purple-700" },
  INCIDENT: { icon: <AlertTriangle className="h-4 w-4" />, style: "bg-red-100 text-red-700" },
  PREVENUS_OUBLIES: { icon: <Hourglass className="h-4 w-4" />, style: "bg-amber-100 text-amber-800" },
};

interface Props {
  notification: AppNotification;
  // Liste déroulante : message tronqué ; page : message complet (le récapitulatif tient sur plusieurs lignes)
  compact?: boolean;
}

// Contenu d'une notification : icône du type, titre, message, date, point bleu si non lue
export const NotificationItem: React.FC<Props> = ({ notification: n, compact = false }) => {
  const kind = ICONS[n.type] ?? { icon: <CalendarClock className="h-4 w-4" />, style: "bg-gray-100 text-gray-600" };
  return (
    <div className="flex items-start gap-3 text-left">
      <span className={`mt-0.5 flex-shrink-0 rounded-full p-1.5 ${kind.style}`} title={n.type_label}>{kind.icon}</span>
      <div className="min-w-0 flex-1">
        <p className={`text-sm ${n.lue ? "text-gray-700" : "font-semibold text-gray-900"}`}>{n.titre}</p>
        <p className={`text-sm text-gray-600 ${compact ? "line-clamp-2" : "whitespace-pre-line"}`}>{n.message}</p>
        <p className="mt-1 text-xs text-gray-400" title={new Date(n.cree_le).toLocaleString("fr-FR")}>
          {timeAgo(n.cree_le)}
          {!compact && ` — ${n.type_label}`}
        </p>
      </div>
      {!n.lue && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-600" aria-label="Non lue" />}
    </div>
  );
};
