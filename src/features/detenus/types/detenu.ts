// features/detenus/types/detenu.ts
export interface Detenu {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  incarceration_date: string;
  release_date: string;
  prison: number;
  status: string;
  nationality: string;
  national_id: string;
  height: number;
  weight: number;
  matricule_number: string;
  sex: string;
}

// Statuts du détenu : codes renvoyés par le backend (PisonerStatus, migration prisoner/0005)
export type PrisonerStatus =
  | 'PREVENU'
  | 'ACCUSE'
  | 'CONDAMNE_NON_DEFINITIF'
  | 'CONDAMNE'
  | 'LIBERE'
  | 'EVADE'
  | 'DECEDE';

// Ordre d'affichage (listes, filtres) et libellés FR (mêmes que le backend)
export const PRISONER_STATUSES: { value: PrisonerStatus; label: string; plural: string }[] = [
  { value: 'PREVENU', label: 'Prévenu', plural: 'Prévenus' },
  { value: 'ACCUSE', label: 'Accusé', plural: 'Accusés' },
  { value: 'CONDAMNE_NON_DEFINITIF', label: 'Condamné (non définitif)', plural: 'Condamnés (non définitif)' },
  { value: 'CONDAMNE', label: 'Condamné (définitif)', plural: 'Condamnés (définitif)' },
  { value: 'LIBERE', label: 'Libéré', plural: 'Libérés' },
  { value: 'EVADE', label: 'Évadé', plural: 'Évadés' },
  { value: 'DECEDE', label: 'Décédé', plural: 'Décédés' },
];

const LABELS = new Map<string, string>(PRISONER_STATUSES.map((s) => [s.value, s.label]));
export const prisonerStatusLabel = (status: string | null | undefined): string =>
  status ? LABELS.get(status) ?? status : '—';

// Familles (mêmes que prisoner/models.py)
// Phase judiciaire : demandes de visite traitées par le greffe puis le magistrat
export const JUDICIAL_STATUSES: PrisonerStatus[] = ['PREVENU', 'ACCUSE'];
// Condamnés : demandes de visite traitées par la prison
export const SENTENCED_STATUSES: PrisonerStatus[] = ['CONDAMNE_NON_DEFINITIF', 'CONDAMNE'];
// En détention : seuls à pouvoir être transférés, sortir ou recevoir un nouveau dossier médical
export const IN_CUSTODY_STATUSES: PrisonerStatus[] = [...JUDICIAL_STATUSES, ...SENTENCED_STATUSES];
export const CLOSED_STATUSES: PrisonerStatus[] = ['LIBERE', 'EVADE', 'DECEDE'];

const has = (list: PrisonerStatus[], status: string) => (list as string[]).includes(status);
export const isJudicialStage = (detenu: Pick<Detenu, 'status'>) => has(JUDICIAL_STATUSES, detenu.status);
export const isSentenced = (detenu: Pick<Detenu, 'status'>) => has(SENTENCED_STATUSES, detenu.status);
export const isInCustody = (detenu: Pick<Detenu, 'status'>) => has(IN_CUSTODY_STATUSES, detenu.status);
export const isClosed = (detenu: Pick<Detenu, 'status'>) => has(CLOSED_STATUSES, detenu.status);

// Seuls ces détenus peuvent être transférés ou sortir (règle vérifiée aussi par le backend)
export const MOVABLE_STATUSES = IN_CUSTODY_STATUSES;
export const isMovable = isInCustody;

export const PRISONER_STATUS_STYLES: Record<PrisonerStatus, string> = {
  PREVENU: 'bg-amber-100 text-amber-800',
  ACCUSE: 'bg-orange-100 text-orange-800',
  CONDAMNE_NON_DEFINITIF: 'bg-rose-100 text-rose-800',
  CONDAMNE: 'bg-red-100 text-red-800',
  LIBERE: 'bg-green-100 text-green-800',
  EVADE: 'bg-gray-200 text-gray-800',
  DECEDE: 'bg-gray-200 text-gray-600',
};
// Filtre de liste : 'all', une famille ('JUDICIAIRE', 'CONDAMNES') ou un statut exact
export const STATUS_FAMILY_FILTERS = [
  { value: 'JUDICIAIRE', label: 'Prévenus et accusés' },
  { value: 'CONDAMNES', label: 'Condamnés (définitifs ou non)' },
] as const;
export const matchesStatusFilter = (status: string, filter: string) =>
  filter === 'all' ||
  (filter === 'JUDICIAIRE' && has(JUDICIAL_STATUSES, status)) ||
  (filter === 'CONDAMNES' && has(SENTENCED_STATUSES, status)) ||
  status === filter;

export const prisonerStatusStyle = (status: string) =>
  PRISONER_STATUS_STYLES[status as PrisonerStatus] ?? 'bg-gray-100 text-gray-700';

// For creating (without id)
export type CreateDetenuDto = Omit<Detenu, 'id'>;

// For updating (partial without id)
export type UpdateDetenuDto = Partial<Omit<Detenu, 'id'>>;

// For table display
export interface InmateTableRow extends Detenu {
  ecrouNumber: string;
  prisonName: string;
  status: string;
  timeServed: string;
  sentence: string;
}