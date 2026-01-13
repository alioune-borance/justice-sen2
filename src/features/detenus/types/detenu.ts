// features/detenus/types/detenu.ts
export interface Detenu {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  incarceration_date: string;
  release_date: string;
  prison: number;
}

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