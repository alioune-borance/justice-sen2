import { Deplacement } from "../../shared/deplacement";

// features/transferts/types/transfert.ts
export interface Transfert extends Deplacement{
    transfer_date: string;
    date: string;
    from_prison: number;
    to_prison: number;
    priority: string;
}

// Champs gérés par le serveur : statut et décision (actions approve / reject / complete)
type ServerManaged = 'id' | 'authorized_by' | 'status' | 'decided_by' | 'decided_at' | 'decision_reason';

// For creating (without id)
export type CreateTransfertDto = Omit<Transfert, ServerManaged>;

// For updating (partial without id)
export type UpdateTransfertDto = Partial<CreateTransfertDto>

export interface TransfertTableRow extends Transfert {
    detenu_name: string;
    type_transfert: string;
    motif: string;
    priorite: string;
    status: string;
    actions: string
}