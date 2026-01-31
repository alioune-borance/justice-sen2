import { Deplacement } from "../../shared/deplacement";

export interface Sortie extends Deplacement {
    date: string;
    destination: string;
    due_return_date: string;
    is_returned: boolean;
    actual_return_date: string;
}

// For creating (without id)
export type CreateSortieDto = Omit<Sortie,'id'>;

// For updating (partial without id)
export type UpdateSortieDto = Partial<Omit<Sortie, 'id'>>

export interface SortieTableRow extends Sortie {
    detenu_name: string;
    date_prevue: string;
}