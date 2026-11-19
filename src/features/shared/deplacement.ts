export interface Deplacement {
    id: number;
    prisoner: number;
    purpose: string;
    // Renseigné par le backend lors de la validation (lecture seule)
    authorized_by: string;
    notes: string;
    // PENDING | APPROVED | REJECTED | COMPLETED — modifié uniquement par les actions de validation
    status: string;
    decided_by?: number | null;
    decided_at?: string | null;
    decision_reason?: string;
}
