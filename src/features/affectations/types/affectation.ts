export interface Affectation {
  id: number;
  acteur: number;
  acteur_nom: string;
  detenu: number;
  detenu_nom: string;
  // Lecture seule : rôle de l'acteur (greffier, juge d'instruction, procureur, avocat)
  fonction: string;
  fonction_label: string;
  reference_dossier: string;
  date_debut: string;
  date_fin: string | null;
  actif: boolean;
  affecte_par: number | null;
  cree_le: string;
}

export type CreateAffectationDto = Pick<Affectation, "acteur" | "detenu" | "reference_dossier"> & {
  date_debut?: string;
  date_fin?: string | null;
};

