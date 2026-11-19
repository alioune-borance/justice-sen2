export type StatutLien = "EN_ATTENTE" | "PIECES_A_COMPLETER" | "ACTIF" | "REFUSE" | "REVOQUE";
export type StatutPiece = "EN_ATTENTE" | "CONFORME" | "NON_CONFORME";

export interface PieceJustificative {
  id: number;
  proche: number;
  lien: number | null;
  type: string;
  type_label: string;
  nom_original: string;
  date_expiration: string | null;
  expiree: boolean;
  statut_verification: StatutPiece;
  statut_verification_label: string;
  commentaire: string;
  depose_le: string;
  verifie_le: string | null;
}

// Demande de lien proche ↔ détenu (GET relative-links/)
export interface LienProche {
  id: number;
  proche: number;
  proche_nom: string;
  proche_email: string;
  proche_telephone: string;
  proche_piece_identite: string;
  proche_statut_compte: string;
  // Masqué au proche tant que le lien n'est pas validé
  detenu: number | null;
  detenu_nom: string | null;
  detenu_prison: number | null;
  nom_complet_detenu_saisi: string;
  date_naissance_detenu_saisie: string | null;
  prison_indiquee: number | null;
  lien_parente: string;
  lien_parente_label: string;
  categorie: "FAMILLE_DIRECTE" | "AUTRE_FAMILLE" | "NON_PARENT";
  motivation: string;
  statut: StatutLien;
  statut_label: string;
  motif_refus: string;
  valide_le: string | null;
  cree_le: string;
  pieces: PieceJustificative[];
}

export type LienAction = "approve" | "reject" | "request-documents" | "revoke";

export const LIENS_PARENTE: { value: string; label: string; nonParent?: boolean }[] = [
  { value: "CONJOINT", label: "Conjoint(e)" },
  { value: "PERE", label: "Père" },
  { value: "MERE", label: "Mère" },
  { value: "ENFANT", label: "Enfant" },
  { value: "FRERE_SOEUR", label: "Frère / sœur" },
  { value: "ALLIE", label: "Allié(e) (belle-famille)" },
  { value: "AUTRE_PARENT", label: "Autre parent" },
  { value: "AMI", label: "Ami(e)", nonParent: true },
  { value: "FIANCE", label: "Fiancé(e)", nonParent: true },
  { value: "AUTRE", label: "Autre relation", nonParent: true },
];

export const TYPES_PIECE: { value: string; label: string }[] = [
  { value: "PIECE_IDENTITE", label: "Pièce d'identité (CNI CEDEAO ou passeport)" },
  { value: "PHOTO_IDENTITE", label: "Photo d'identité" },
  { value: "JUSTIFICATIF_LIEN", label: "Justificatif du lien de parenté ou d'alliance" },
  { value: "MOTIVATION_RELATION", label: "Justification de la relation (non-parent)" },
  { value: "DEMANDE_MANUSCRITE", label: "Demande manuscrite" },
  { value: "AUTRE", label: "Autre pièce" },
];

export const STATUT_LIEN_STYLES: Record<StatutLien, string> = {
  EN_ATTENTE: "bg-yellow-100 text-yellow-800",
  PIECES_A_COMPLETER: "bg-orange-100 text-orange-800",
  ACTIF: "bg-green-100 text-green-800",
  REFUSE: "bg-red-100 text-red-800",
  REVOQUE: "bg-gray-200 text-gray-700",
};

// Inscription d'un proche (POST auth/register/, multipart)
export interface RegisterLink {
  nom_complet_detenu: string;
  date_naissance_detenu: string;
  prison: number | null;
  lien_parente: string;
  motivation: string;
  justificatif: File | null;
}

export interface RegisterForm {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  national_id: string;
  piece_expiration: string;
  password: string;
  piece_identite: File | null;
  photo_1: File | null;
  photo_2: File | null;
  liens: RegisterLink[];
}
