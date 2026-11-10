export interface Affectation {
  id: number;
  acteur: number;
  acteur_nom: string;
  detenu: number;
  detenu_nom: string;
  fonction: "JUGE_INSTRUCTION" | "GREFFIER" | "AVOCAT";
  fonction_label: string;
  reference_dossier: string;
  date_debut: string;
  date_fin: string | null;
  actif: boolean;
  affecte_par: number | null;
  cree_le: string;
}

export type CreateAffectationDto = Pick<Affectation, "acteur" | "detenu" | "fonction" | "reference_dossier"> & {
  date_debut?: string;
  date_fin?: string | null;
};

export const FONCTIONS_JUDICIAIRES = [
  { value: "JUGE_INSTRUCTION", label: "Juge d'instruction" },
  { value: "GREFFIER", label: "Greffier" },
  { value: "AVOCAT", label: "Avocat" },
] as const;
