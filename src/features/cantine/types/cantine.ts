// Compte argent (dime) et cantine (PDSC cantine/). Montants en francs CFA entiers.
// Le solde n'est jamais calculé ici : il vient du backend (somme du journal).

// --- Compte et journal (money-accounts/, money-operations/) -----------------------------------
export type PeriodePlafond = "JOUR" | "SEMAINE" | "MOIS";

export interface PlafondsStatus {
  periode: PeriodePlafond;
  debut_periode: string;
  depot_max: number;
  depot_utilise: number;
  depot_restant: number;
  depense_max: number;
  depense_utilisee: number;
  depense_restante: number;
}

export interface CompteArgent {
  id: number;
  detenu: number;
  detenu_nom: string;
  matricule: string | null;
  prison: number;
  solde: number;
  plafonds: PlafondsStatus;
}

export type TypeOperation = "DEPOT" | "ACHAT" | "REMBOURSEMENT" | "REPRISE";

export interface OperationCompte {
  id: number;
  compte: number;
  detenu: number;
  type: TypeOperation;
  type_label: string;
  montant: number; // signé : crédit > 0, achat < 0
  solde_apres: number;
  libelle: string;
  cree_le: string;
  // Masqués au proche pour les opérations des autres proches
  auteur?: number | null;
  auteur_nom?: string;
  par_moi: boolean;
  paiement: number | null;
  commande: number | null;
}

// --- Dépôts (money-deposits/) ----------------------------------------------------------------
export type MoyenPaiement = "WAVE" | "ORANGE_MONEY";
export type StatutPaiement = "INITIE" | "CONFIRME" | "ECHOUE";

export interface PaiementDepot {
  id: number;
  proche: number;
  proche_nom: string;
  detenu: number;
  prison: number;
  montant: number;
  moyen: MoyenPaiement;
  telephone: string;
  statut: StatutPaiement;
  statut_label: string;
  reference_externe: string | null;
  url_paiement: string;
  motif_echec: string;
  cree_le: string;
  confirme_le: string | null;
}

export interface CreateDepotDto {
  detenu: number;
  montant: number;
  moyen: MoyenPaiement;
  telephone: string;
}

export const MOYENS_PAIEMENT: { value: MoyenPaiement; label: string }[] = [
  { value: "WAVE", label: "Wave" },
  { value: "ORANGE_MONEY", label: "Orange Money" },
];

// --- Catalogue (canteen-products/) -----------------------------------------------------------
export interface ProduitCantine {
  id: number;
  prison: number;
  nom: string;
  description: string;
  prix: number;
  stock: number;
  actif: boolean;
  cree_le: string;
  modifie_le: string;
}

// `prison` est imposée par le backend (établissement de l'ADMIN_PRISON)
export type ProduitInput = Pick<ProduitCantine, "nom" | "description" | "prix" | "stock" | "actif">;

// --- Plafonds (canteen-limits/) --------------------------------------------------------------
export interface PlafondsCantine {
  id: number;
  prison: number;
  periode: PeriodePlafond;
  depot_max: number;
  depense_max: number;
  modifie_par: number | null;
  modifie_le: string;
}

export type PlafondsInput = Pick<PlafondsCantine, "periode" | "depot_max" | "depense_max">;

export const PERIODES_PLAFOND: { value: PeriodePlafond; label: string; courant: string }[] = [
  { value: "JOUR", label: "Jour", courant: "aujourd'hui" },
  { value: "SEMAINE", label: "Semaine", courant: "cette semaine" },
  { value: "MOIS", label: "Mois", courant: "ce mois-ci" },
];

export const periodeLabel = (periode: PeriodePlafond) => PERIODES_PLAFOND.find((p) => p.value === periode)?.label ?? periode;
export const periodeCourante = (periode: PeriodePlafond) =>
  PERIODES_PLAFOND.find((p) => p.value === periode)?.courant ?? "sur la période";

// --- Commandes (canteen-orders/) -------------------------------------------------------------
export type StatutCommande = "EN_ATTENTE" | "PREPAREE" | "LIVREE" | "ANNULEE";

export interface LigneCommande {
  id: number;
  produit: number;
  nom_produit: string;
  prix_unitaire: number; // figé à la commande
  quantite: number;
  montant: number;
}

export interface CommandeCantine {
  id: number;
  proche: number;
  proche_nom: string;
  detenu: number;
  detenu_nom: string;
  prison: number;
  statut: StatutCommande;
  statut_label: string;
  montant_total: number;
  lignes: LigneCommande[];
  cree_le: string;
  preparee_le: string | null;
  preparee_par: number | null;
  livree_le: string | null;
  livree_par: number | null;
  annulee_le: string | null;
  annulee_par: number | null;
  motif_annulation: string;
}

export interface CreateCommandeDto {
  detenu: number;
  lignes: { produit: number; quantite: number }[];
}

export type CommandeAction = "prepare" | "deliver" | "cancel";

export const STATUTS_COMMANDE: { value: StatutCommande; label: string }[] = [
  { value: "EN_ATTENTE", label: "En attente" },
  { value: "PREPAREE", label: "Préparée" },
  { value: "LIVREE", label: "Livrée" },
  { value: "ANNULEE", label: "Annulée" },
];

export const MAX_QUANTITE_LIGNE = 100;
