import { PrisonerStatus, prisonerStatusLabel } from "../../detenus/types/detenu";

// Décision de justice (GET court-decisions/). Jamais modifiée ni supprimée : une correction crée la version n+1.
export type TypeDecision =
  | "MANDAT_DE_DEPOT"
  | "MISE_EN_ACCUSATION"
  | "MISE_EN_LIBERTE"
  | "RENVOI"
  | "JUGEMENT"
  | "CONDAMNATION"
  | "CONDAMNATION_DEFINITIVE"
  | "ACQUITTEMENT"
  | "NON_LIEU"
  | "APPEL"
  | "AUTRE";

export type EtatEffet = "AUCUN" | "PROPOSE" | "APPLIQUE" | "ECARTE";
// Codes de Prisoner.status proposables par une décision ("" = aucun effet)
export type StatutPropose = "" | Extract<PrisonerStatus, "PREVENU" | "ACCUSE" | "CONDAMNE_NON_DEFINITIF" | "CONDAMNE" | "LIBERE">;

export interface DecisionJustice {
  id: number;
  detenu: number;
  detenu_nom: string;
  detenu_matricule: string | null;
  prison: number;
  prison_nom: string;
  auteur: number;
  auteur_nom: string | null;
  type: TypeDecision;
  type_label: string;
  date_decision: string;
  juridiction: string;
  reference_affaire: string;
  resume: string;
  a_document: boolean;
  nom_document: string;
  version: number;
  version_precedente: number | null;
  version_suivante: number | null;
  motif_correction: string;
  est_courante: boolean;
  statut_propose: StatutPropose | null;
  peine_proposee: number | null;
  date_liberation_proposee: string | null;
  effet_etat: EtatEffet;
  effet_etat_label: string;
  effet_traite_par_nom: string | null;
  effet_traite_le: string | null;
  effet_motif: string;
  cree_le: string;
}

export interface DecisionInput {
  type: TypeDecision;
  date_decision: string;
  juridiction: string;
  reference_affaire?: string;
  resume: string;
  document?: File | null;
  statut_propose?: StatutPropose;
  peine_proposee?: number | null;
  date_liberation_proposee?: string | null;
}

export type CreateDecisionDto = DecisionInput & { detenu: number };
export type CorrectDecisionDto = Partial<DecisionInput> & { motif_correction: string };

export type DecisionFilters = { detenu?: number; type?: string; effet?: string; historique?: boolean };

export const TYPES_DECISION: { value: TypeDecision; label: string }[] = [
  { value: "MANDAT_DE_DEPOT", label: "Mandat de dépôt" },
  { value: "MISE_EN_ACCUSATION", label: "Mise en accusation (renvoi devant la juridiction de jugement)" },
  { value: "MISE_EN_LIBERTE", label: "Mise en liberté" },
  { value: "RENVOI", label: "Renvoi" },
  { value: "JUGEMENT", label: "Jugement" },
  { value: "CONDAMNATION", label: "Condamnation (susceptible de recours)" },
  { value: "CONDAMNATION_DEFINITIVE", label: "Condamnation définitive" },
  { value: "ACQUITTEMENT", label: "Acquittement" },
  { value: "NON_LIEU", label: "Non-lieu" },
  { value: "APPEL", label: "Appel" },
  { value: "AUTRE", label: "Autre décision" },
];

// Effet proposé par défaut selon le type (même table que justice/models.py, modifiable à la saisie)
export const DEFAULT_EFFECT: Partial<Record<TypeDecision, StatutPropose>> = {
  MANDAT_DE_DEPOT: "PREVENU",
  MISE_EN_ACCUSATION: "ACCUSE",
  CONDAMNATION: "CONDAMNE_NON_DEFINITIF",
  CONDAMNATION_DEFINITIVE: "CONDAMNE",
  MISE_EN_LIBERTE: "LIBERE",
  ACQUITTEMENT: "LIBERE",
  NON_LIEU: "LIBERE",
};

const PROPOSABLE: StatutPropose[] = ["PREVENU", "ACCUSE", "CONDAMNE_NON_DEFINITIF", "CONDAMNE", "LIBERE"];
export const STATUTS_PROPOSES: { value: StatutPropose; label: string }[] = [
  { value: "", label: "Aucun effet sur le statut" },
  ...PROPOSABLE.map((value) => ({ value, label: prisonerStatusLabel(value) })),
];

// Une condamnation proposée exige une peine ; condamnation et libération, une date de libération possible
export const isSentenceProposal = (statut: StatutPropose | null | undefined) =>
  statut === "CONDAMNE_NON_DEFINITIF" || statut === "CONDAMNE";

export const EFFET_STYLES: Record<EtatEffet, string> = {
  AUCUN: "bg-gray-100 text-gray-600",
  PROPOSE: "bg-amber-100 text-amber-800",
  APPLIQUE: "bg-green-100 text-green-800",
  ECARTE: "bg-gray-200 text-gray-700",
};

export const MAX_DECISION_BYTES = 10 * 1024 * 1024;
