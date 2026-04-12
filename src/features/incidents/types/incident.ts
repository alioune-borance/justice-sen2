// features/incidents/types/incident.ts
export interface DisciplinaryRecord {
  infraction: string;
  description: string;
  date_of_infraction: string;
}

export interface Incident {
  id: number;
  cell: number;
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
  disciplinary_records: DisciplinaryRecord[];
}

export type CreateIncidentDto = Omit<Incident, 'id'>;
export type UpdateIncidentDto = Partial<CreateIncidentDto>;

