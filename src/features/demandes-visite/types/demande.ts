import { PermisResume, VisiteurSupplementaire } from "../../permis/types/permis";

// Demande de visite (GET visit-requests/), circuit : prévenu → JUDICIAIRE, condamné → PENITENTIAIRE
export type StatutDemande = "SOUMISE" | "EN_VERIFICATION" | "INCOMPLETE" | "VALIDEE" | "REFUSEE";
export type Circuit = "JUDICIAIRE" | "PENITENTIAIRE";
export type StatutPieceDemande = "A_VERIFIER" | "VERIFIEE" | "REJETEE";
export type TypePieceDemande = "DEMANDE_MANUSCRITE" | "PIECE_IDENTITE" | "PHOTO_IDENTITE" | "JUSTIFICATIF_LIEN" | "AUTRE";

export interface PieceDemande {
  id: number;
  demande: number;
  type: TypePieceDemande;
  type_label: string;
  nom_original: string;
  taille: number;
  type_mime: string;
  statut: StatutPieceDemande;
  statut_label: string;
  commentaire: string;
  verifiee_le: string | null;
  deposee_le: string;
}

export interface HistoriqueDemande {
  id: number;
  evenement: string;
  evenement_label: string;
  de_statut: StatutDemande | "";
  vers_statut: StatutDemande | "";
  auteur: number | null;
  // null : masqué au proche (il voit le rôle) ; « Système » : règle automatique
  auteur_nom: string | null;
  auteur_role: string;
  commentaire: string;
  horodatage: string;
}

export interface DemandeVisite {
  id: number;
  proche: number;
  proche_nom: string;
  lien: number;
  lien_parente: string;
  lien_parente_label: string;
  detenu: number;
  detenu_nom: string;
  detenu_matricule: string | null;
  prison: number;
  prison_nom: string;
  circuit: Circuit;
  circuit_label: string;
  statut: StatutDemande;
  statut_label: string;
  date_souhaitee_debut: string;
  date_souhaitee_fin: string | null;
  visiteurs_supplementaires: VisiteurSupplementaire[];
  message: string;
  motif_refus: string;
  commentaire_complement: string;
  traitee_par: number | null;
  cree_le: string;
  soumise_le: string | null;
  decidee_le: string | null;
  pieces: PieceDemande[];
  historique: HistoriqueDemande[];
  permis: PermisResume | null;
  // Ce qui bloque encore la validation (écran des gestionnaires)
  problemes_validation: string[];
}

export type CreationFileField = "demande_manuscrite" | "piece_identite" | "photo_identite" | "justificatif_lien" | "autre";

export interface CreateDemandeDto {
  lien: number;
  date_souhaitee_debut: string;
  date_souhaitee_fin?: string;
  message?: string;
  visiteurs_supplementaires: VisiteurSupplementaire[];
  // Champ multipart → fichier ; la demande manuscrite est obligatoire
  fichiers: Partial<Record<CreationFileField, File>>;
}

export type DemandeFilters = { statut?: string; circuit?: string; detenu?: number; sans_gestionnaire?: boolean };

export const STATUT_DEMANDE_LABELS: Record<StatutDemande, string> = {
  SOUMISE: "Soumise",
  EN_VERIFICATION: "En vérification",
  INCOMPLETE: "Pièces à compléter",
  VALIDEE: "Validée",
  REFUSEE: "Refusée",
};

export const STATUT_DEMANDE_STYLES: Record<StatutDemande, string> = {
  SOUMISE: "bg-blue-100 text-blue-800",
  EN_VERIFICATION: "bg-indigo-100 text-indigo-800",
  INCOMPLETE: "bg-amber-100 text-amber-800",
  VALIDEE: "bg-green-100 text-green-800",
  REFUSEE: "bg-red-100 text-red-800",
};

export const STATUT_PIECE_STYLES: Record<StatutPieceDemande, string> = {
  A_VERIFIER: "bg-gray-100 text-gray-700",
  VERIFIEE: "bg-green-100 text-green-800",
  REJETEE: "bg-red-100 text-red-800",
};

export const TYPES_PIECE_DEMANDE: { value: TypePieceDemande; label: string }[] = [
  { value: "DEMANDE_MANUSCRITE", label: "Demande manuscrite" },
  { value: "PIECE_IDENTITE", label: "Pièce d'identité" },
  { value: "PHOTO_IDENTITE", label: "Photo d'identité" },
  { value: "JUSTIFICATIF_LIEN", label: "Justificatif du lien" },
  { value: "AUTRE", label: "Autre pièce" },
];

export const CREATION_FILE_FIELDS: { field: CreationFileField; label: string; required?: boolean }[] = [
  { field: "demande_manuscrite", label: "Demande manuscrite", required: true },
  { field: "piece_identite", label: "Pièce d'identité" },
  { field: "photo_identite", label: "Photo d'identité" },
  { field: "justificatif_lien", label: "Justificatif du lien" },
  { field: "autre", label: "Autre pièce" },
];

// Valeurs nationales du backend (settings.py), affichées pour guider la saisie ; le serveur les applique
export const MAX_EXTRA_VISITORS = 2;
export const MAX_VALIDITY_DAYS = 180;
export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;

export const OPEN_STATUSES: StatutDemande[] = ["SOUMISE", "EN_VERIFICATION", "INCOMPLETE"];
