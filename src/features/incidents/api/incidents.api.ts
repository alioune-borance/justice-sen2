import { axiosInstance } from '../../../shared/api/axiosInstance';
import { Incident, DisciplinaryRecord } from '../types/incident';

const PRISONERS = 'prisoners';

type Params = { page?: number; size?: number };

export const getIncidents = async (params?: Params): Promise<Incident[]> => {
  const { data } = await axiosInstance.get<Incident[]>(PRISONERS + '/?expand=disciplinary_records', { params });
  return data;
};

export const getPrisonerById = async (id: number): Promise<Incident> => {
  const { data } = await axiosInstance.get<Incident>(PRISONERS + `/${id}/?expand=disciplinary_records`);
  return data;
};

export const addDisciplinaryRecord = async (
  prisonerId: number,
  newRecord: DisciplinaryRecord
): Promise<Incident> => {
  const { data: current } = await axiosInstance.get<Incident>(
    `${PRISONERS}/${prisonerId}/?expand=disciplinary_records`
  );
  const updatedRecords = [...(current.disciplinary_records ?? []), newRecord];
  await axiosInstance.patch<Incident>(
    `${PRISONERS}/${prisonerId}/?expand=disciplinary_records`,
    { disciplinary_records: updatedRecords }
  );
  // Refetch pour obtenir la version à jour confirmée par le backend
  const { data: updated } = await axiosInstance.get<Incident>(
    `${PRISONERS}/${prisonerId}/?expand=disciplinary_records`
  );
  return updated;
};
