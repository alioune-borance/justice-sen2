import { axiosInstance } from '../../../shared/api/axiosInstance';
import { Incident, DisciplinaryRecord } from '../types/incident';

const PRISONERS = 'prisoners';

type Params = { page?: number; size?: number };

const recordsUrl = (prisonerId: number) => `${PRISONERS}/${prisonerId}/disciplinary-records/`;

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
): Promise<DisciplinaryRecord> => {
  const { data } = await axiosInstance.post<DisciplinaryRecord>(recordsUrl(prisonerId), newRecord);
  return data;
};

export const updateDisciplinaryRecord = async (
  prisonerId: number,
  recordId: number,
  changes: Partial<DisciplinaryRecord>
): Promise<DisciplinaryRecord> => {
  const { data } = await axiosInstance.patch<DisciplinaryRecord>(`${recordsUrl(prisonerId)}${recordId}/`, changes);
  return data;
};

// Validation / refus de la sanction proposée (SUPERVISEUR ou ADMIN de la prison)
export type SanctionAction = 'approve' | 'reject';

export const decideSanction = async (
  prisonerId: number,
  recordId: number,
  action: SanctionAction,
  reason?: string
): Promise<DisciplinaryRecord> => {
  const { data } = await axiosInstance.post<DisciplinaryRecord>(
    `${recordsUrl(prisonerId)}${recordId}/${action}/`,
    reason ? { reason } : {}
  );
  return data;
};

export const deleteDisciplinaryRecord = async (prisonerId: number, recordId: number): Promise<void> => {
  await axiosInstance.delete(`${recordsUrl(prisonerId)}${recordId}/`);
};
