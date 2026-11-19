import { axiosInstance } from '../../../shared/api/axiosInstance';
import { InfirmeriePatient, HealthRecord, HealthActivity } from '../types/infirmerie';

const PRISONERS = 'prisoners';

const recordsUrl = (prisonerId: number) => `${PRISONERS}/${prisonerId}/health-records/`;

export const getInfirmeriePatients = async (): Promise<InfirmeriePatient[]> => {
  const { data } = await axiosInstance.get<InfirmeriePatient[]>(PRISONERS + '/?expand=health_records');
  return data;
};

// Activité de l'infirmerie de la prison, sans donnée médicale (AP / SP)
export const getHealthActivity = async (): Promise<HealthActivity[]> => {
  const { data } = await axiosInstance.get<HealthActivity[]>('health-activity/');
  return data;
};

export const getPrisonerById = async (id: number): Promise<InfirmeriePatient> => {
  const { data } = await axiosInstance.get<InfirmeriePatient>(PRISONERS + `/${id}/?expand=health_records`);
  return data;
};

export const addHealthRecord = async (
  prisonerId: number,
  newRecord: HealthRecord
): Promise<HealthRecord> => {
  const { data } = await axiosInstance.post<HealthRecord>(recordsUrl(prisonerId), newRecord);
  return data;
};

export const updateHealthRecord = async (
  prisonerId: number,
  recordId: number,
  changes: Partial<HealthRecord>
): Promise<HealthRecord> => {
  const { data } = await axiosInstance.patch<HealthRecord>(`${recordsUrl(prisonerId)}${recordId}/`, changes);
  return data;
};

export const deleteHealthRecord = async (prisonerId: number, recordId: number): Promise<void> => {
  await axiosInstance.delete(`${recordsUrl(prisonerId)}${recordId}/`);
};
