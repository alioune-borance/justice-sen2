// features/infirmerie/types/infirmerie.ts
export interface HealthRecord {
  condition_medical: string;
  description: string;
  date_diagnosis: string;
}

export interface InfirmeriePatient {
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
  health_records: HealthRecord[];
}
