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

// Seuls ces détenus peuvent être transférés ou sortir (règle vérifiée aussi par le backend)
export const MOVABLE_STATUSES = ['Prévenu', 'Condamné'];
export const isMovable = (detenu: Pick<Detenu, 'status'>) => MOVABLE_STATUSES.includes(detenu.status);
// Détenus présents dans l'établissement (prévenus ou condamnés) : seuls à recevoir un nouveau dossier médical
export const isInCustody = isMovable;

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