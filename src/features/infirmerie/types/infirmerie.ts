// features/infirmerie/types/infirmerie.ts
export interface HealthRecord {
  id?: number;
  medical_condition: string;
  description: string;
  date_of_diagnosis: string;
}

// GET health-activity/ : activité de l'infirmerie SANS donnée médicale (AP / SP), ni pathologie ni description
export interface HealthActivity {
  id: number;
  prisoner: number;
  prisoner_name: string;
  matricule_number: string | null;
  prisoner_status: string;
  date_of_diagnosis: string;
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
