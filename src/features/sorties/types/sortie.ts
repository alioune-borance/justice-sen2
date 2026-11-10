import { Deplacement } from "../../shared/deplacement";

export interface Sortie extends Deplacement {
    date: string;
    destination: string;
    due_return_date: string;
    is_returned: boolean;
    actual_return_date: string;
    // Prison de départ, renseignée par le backend (lecture seule)
    prison?: number | null;
}

// Champs gérés par le serveur : statut, décision et prison de départ
type ServerManaged = 'id' | 'authorized_by' | 'status' | 'decided_by' | 'decided_at' | 'decision_reason' | 'prison';

// For creating (without id)
export type CreateSortieDto = Omit<Sortie, ServerManaged>;

// For updating (partial without id)
export type UpdateSortieDto = Partial<CreateSortieDto>

export interface SortieTableRow extends Sortie {
    detenu_name: string;
    date_prevue: string;
}