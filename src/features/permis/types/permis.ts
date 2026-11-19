// Permis de visite (GET visit-permits/). Le PDF se télécharge par visit-permits/{id}/download/.
export type EtatPermis = "VALIDE" | "PAS_ENCORE_VALIDE" | "EXPIRE" | "REVOQUE";
export type ResultatVerification = EtatPermis | "INTROUVABLE";

export interface VisiteurSupplementaire {
  nom: string;
  piece_identite: string;
}

export interface PermisVisite {
  id: number;
  numero: string;
  code_verification: string;
  etat: EtatPermis;
  etat_label: string;
  demande: number;
  detenu: number;
  detenu_nom: string;
  detenu_matricule: string | null;
  prison: number;
  prison_nom: string;
  titulaire: number;
  titulaire_nom: string;
  titulaire_piece: string;
  visiteurs_supplementaires: VisiteurSupplementaire[];
  valide_du: string;
  valide_au: string;
  signataire_nom: string;
  signataire_qualite: string;
  emis_le: string;
  revoque_le: string | null;
  motif_revocation: string;
}

// Résumé inclus dans une demande de visite
export type PermisResume = Pick<PermisVisite, "id" | "numero" | "etat" | "valide_du" | "valide_au" | "revoque_le">;

export interface VerificationResponse {
  resultat: ResultatVerification;
  resultat_label: string;
  permis: PermisVisite | null;
}

export const ETAT_PERMIS_LABELS: Record<EtatPermis, string> = {
  VALIDE: "Valide",
  PAS_ENCORE_VALIDE: "Pas encore valide",
  EXPIRE: "Expiré",
  REVOQUE: "Révoqué",
};

export const ETAT_PERMIS_STYLES: Record<ResultatVerification, string> = {
  VALIDE: "bg-green-100 text-green-800",
  PAS_ENCORE_VALIDE: "bg-amber-100 text-amber-800",
  EXPIRE: "bg-gray-200 text-gray-700",
  REVOQUE: "bg-red-100 text-red-800",
  INTROUVABLE: "bg-red-100 text-red-800",
};
