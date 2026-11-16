// Tableaux de bord nationaux (GET stats/justice/, stats/interieur/ : PDSC stats/indicators.py).
// Stocks (effectifs, occupation) : à la date du jour (`date_stocks`) ; flux : événements datés dans la période.

export type StatsBoard = "justice" | "interieur";

export interface StatsFilters {
  prisons: number[]; // vide = toutes les prisons du périmètre
  date_from: string; // AAAA-MM-JJ
  date_to: string;
}

export interface StatsPrison {
  id: number;
  nom: string;
  capacite: number;
}

interface PrisonLine {
  prison: number;
  prison_nom: string;
}

interface IndicatorBase {
  label: string;
  definition: string;
}

// Indicateur ventilé par catégorie, au national et par prison (la somme des lignes = le total)
export interface Breakdown<K extends string = string> extends IndicatorBase {
  total: number;
  repartition: Record<K, { label: string; total: number }>;
  par_prison: (PrisonLine & { total: number; repartition: Record<K, number> })[];
}

// --- Justice ---------------------------------------------------------------------------------
export type CustodyStatus = "PREVENU" | "ACCUSE" | "CONDAMNE_NON_DEFINITIF" | "CONDAMNE";
export type VisitOutcome = "VALIDEE" | "REFUSEE" | "EN_COURS";

export interface ProvisionalDetention extends IndicatorBase {
  terminees: {
    total: number;
    duree_moyenne_jours: number | null;
    duree_mediane_jours: number | null;
    duree_max_jours: number | null;
  };
  en_cours: { total: number; anciennete_moyenne_jours: number | null };
  par_prison: (PrisonLine & {
    terminees: number;
    duree_moyenne_jours: number | null;
    en_cours: number;
    anciennete_moyenne_jours: number | null;
  })[];
}

export interface VisitRequestsStats extends Omit<Breakdown<VisitOutcome>, "par_prison"> {
  par_circuit: Record<string, { label: string; total: number }>;
  delai_moyen_jours: number | null;
  taux_refus: number | null;
  par_prison: (Breakdown<VisitOutcome>["par_prison"][number] & {
    delai_moyen_jours: number | null;
    taux_refus: number | null;
  })[];
}

export interface JusticeIndicators {
  detenus_par_statut: Breakdown<CustodyStatus>;
  detention_provisoire: ProvisionalDetention;
  decisions_par_type: Breakdown;
  demandes_visite: VisitRequestsStats;
}

// --- Intérieur -------------------------------------------------------------------------------
export interface Occupancy extends IndicatorBase {
  effectif: number;
  capacite: number;
  taux_occupation: number | null; // ratio (0,85 = 85 %)
  prisons_suroccupees: number;
  par_prison: (PrisonLine & {
    effectif: number;
    capacite: number;
    taux_occupation: number | null;
    places_disponibles: number;
  })[];
}

export interface Escapes extends IndicatorBase {
  total: number;
  evades_actuellement: number;
  par_prison: (PrisonLine & { total: number })[];
}

export type TransferStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";

export interface TransfersStats extends IndicatorBase {
  total: number;
  repartition: Record<TransferStatus, { label: string; total: number }>;
  par_prison: (PrisonLine & {
    departs: number;
    arrivees: number;
    effectues_sortants: number;
    effectues_entrants: number;
  })[];
}

export type MovementKey =
  | "ecrous"
  | "transferts_entrants"
  | "transferts_sortants"
  | "liberations"
  | "deces"
  | "sorties_temporaires"
  | "retours_en_retard";

export interface Movements extends IndicatorBase {
  totaux: Record<MovementKey, number>;
  par_prison: (PrisonLine & Record<MovementKey, number>)[];
}

export interface InterieurIndicators {
  occupation: Occupancy;
  incidents_par_type: Breakdown;
  evasions: Escapes;
  transferts: TransfersStats;
  mouvements: Movements;
}

// --- Réponse ---------------------------------------------------------------------------------
export interface IndicatorsByBoard {
  justice: JusticeIndicators;
  interieur: InterieurIndicators;
}

export interface StatsResponse<B extends StatsBoard = StatsBoard> {
  tableau: B;
  periode: { date_from: string; date_to: string };
  date_stocks: string;
  prisons: StatsPrison[];
  indicateurs: IndicatorsByBoard[B];
}
