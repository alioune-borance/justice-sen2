// features/incidents/types/incident.ts
// Sanction proposée avec l'incident, validée par un SUPERVISEUR ou un ADMIN de la prison
export type SanctionStatus = 'NONE' | 'PROPOSED' | 'APPROVED' | 'REJECTED';

export interface DisciplinaryRecord {
  id?: number;
  infraction: string;
  description: string;
  date_of_infraction: string;
  sanction?: string;
  // Champs gérés par le serveur (lecture seule)
  prison?: number | null;
  sanction_status?: SanctionStatus;
  sanction_decided_by?: number | null;
  sanction_decided_at?: string | null;
  sanction_decision_reason?: string;
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

