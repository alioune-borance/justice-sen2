import { axiosInstance } from '../../../shared/api/axiosInstance';
import { InfirmeriePatient, HealthRecord } from '../types/infirmerie';

const PRISONERS = 'prisoners';

export const getInfirmeriePatients = async (): Promise<InfirmeriePatient[]> => {
  const { data } = await axiosInstance.get<InfirmeriePatient[]>(PRISONERS + '/?expand=health_records');
  return data;
};

export const getPrisonerById = async (id: number): Promise<InfirmeriePatient> => {
  const { data } = await axiosInstance.get<InfirmeriePatient>(PRISONERS + `/${id}/?expand=health_records`);
  return data;
};

export const addHealthRecord = async (
  prisonerId: number,
  newRecord: HealthRecord
): Promise<InfirmeriePatient> => {
  const { data: current } = await axiosInstance.get<InfirmeriePatient>(
    PRISONERS + `/${prisonerId}/?expand=health_records`
  );
  const updatedRecords = [...(current.health_records ?? []), newRecord];
  const { data } = await axiosInstance.put<InfirmeriePatient>(
    PRISONERS + `/${prisonerId}/?expand=health_records`,
    
    {
      ...current,
      health_records: updatedRecords,
    }
  );
  return data;
};
