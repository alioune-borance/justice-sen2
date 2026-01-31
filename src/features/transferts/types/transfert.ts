import { Deplacement } from "../../shared/deplacement";

// features/transferts/types/transfert.ts
export interface Transfert extends Deplacement{
    transfer_date: string;
    from_prison: number;
    to_prison: number;
    priority: string;
}

// For creating (without id)
export type CreateTransfertDto = Omit<Transfert,'id'>;

// For updating (partial without id)
export type UpdateTransfertDto = Partial<Omit<Transfert, 'id'>>

export interface TransfertTableRow extends Transfert {
    detenu_name: string;
    type_transfert: string;
    motif: string;
    priorite: string;
    status: string;
    actions: string
}