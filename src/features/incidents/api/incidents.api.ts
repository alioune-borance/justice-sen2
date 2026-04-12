import { axiosInstance } from '../../../shared/api/axiosInstance';
import { Incident, DisciplinaryRecord } from '../types/incident';

const PRISONERS = 'api/prisoners';

type Params = { page?: number; size?: number };

export const getIncidents = async (params?: Params): Promise<Incident[]> => {
  const { data } = await axiosInstance.get<Incident[]>(PRISONERS + '/?expand=disciplinary_records', { params });
  return data;
};

export const getPrisonerById = async (id: number): Promise<Incident> => {
  const { data } = await axiosInstance.get<Incident>(PRISONERS + `/${id}/?expand=disciplinary_records`);
  return data;
};

// Récupère le détenu, ajoute le nouveau record, puis PUT
export const addDisciplinaryRecord = async (
  prisonerId: number,
  newRecord: DisciplinaryRecord
): Promise<Incident> => {
  const { data: current } = await axiosInstance.get<Incident>(
    PRISONERS + `/${prisonerId}/?expand=disciplinary_records`
  );
  const updatedRecords = [...(current.disciplinary_records ?? []), newRecord];
  const { data } = await axiosInstance.put<Incident>(PRISONERS + `/${prisonerId}/?expand=disciplinary_records`, {
    ...current,
    disciplinary_records: updatedRecords,
  });
  console.log(data)
  return data;
};
