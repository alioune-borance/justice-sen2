// Notification in-app (GET notifications/). Chacun ne reçoit que les siennes.
export type NotificationType =
  | "AUDIENCE_RAPPEL"
  | "AUDIENCE_VEILLE"
  | "DECISION_JUSTICE"
  | "INCIDENT"
  | "PREVENUS_OUBLIES";

export interface AppNotification {
  id: number;
  type: NotificationType;
  type_label: string;
  titre: string;
  message: string;
  // Écran du frontend à ouvrir (peut contenir des paramètres), ex. "/decisions?detenu=12&historique=1"
  lien: string;
  objet_type: string;
  objet_id: number | null;
  lue: boolean;
  lue_le: string | null;
  cree_le: string;
}

export interface NotificationPage {
  count: number;
  next: string | null;
  previous: string | null;
  results: AppNotification[];
}

// Filtre de la page « Toutes les notifications »
export type ReadFilter = "toutes" | "non_lues" | "lues";

export interface NotificationFilters {
  page?: number;
  pageSize?: number;
  lecture?: ReadFilter;
}

export const PAGE_SIZE = 20;
