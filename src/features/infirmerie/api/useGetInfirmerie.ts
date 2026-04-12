import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HealthRecord } from '../types/infirmerie';
import { getInfirmeriePatients, getPrisonerById, addHealthRecord } from './infirmerie.api';

export const useGetInfirmeriePatients = () =>
  useQuery({
    queryKey: ['infirmerie'],
    queryFn: () => getInfirmeriePatients(),
    staleTime: 5 * 60 * 1000,
  });

export const useGetInfirmeriePatientById = (id: number) =>
  useQuery({
    queryKey: ['infirmerie', id],
    queryFn: () => getPrisonerById(id),
    enabled: !!id && id > 0,
    staleTime: 5 * 60 * 1000,
  });

export const useAddHealthRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ prisonerId, record }: { prisonerId: number; record: HealthRecord }) =>
      addHealthRecord(prisonerId, record),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['infirmerie'] }),
    onError: (error: unknown) => console.error('Error adding health record:', error),
  });
};
