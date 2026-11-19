import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HealthRecord } from '../types/infirmerie';
import {
  getInfirmeriePatients,
  getHealthActivity,
  getPrisonerById,
  addHealthRecord,
  updateHealthRecord,
  deleteHealthRecord,
} from './infirmerie.api';

export const useGetInfirmeriePatients = () =>
  useQuery({
    queryKey: ['infirmerie'],
    queryFn: () => getInfirmeriePatients(),
    staleTime: 5 * 60 * 1000,
  });

export const useGetHealthActivity = (enabled: boolean) =>
  useQuery({
    queryKey: ['infirmerie', 'activite'],
    queryFn: getHealthActivity,
    enabled,
    staleTime: 60 * 1000,
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

export const useUpdateHealthRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      prisonerId,
      recordId,
      changes,
    }: {
      prisonerId: number;
      recordId: number;
      changes: Partial<HealthRecord>;
    }) => updateHealthRecord(prisonerId, recordId, changes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['infirmerie'] }),
    onError: (error: unknown) => console.error('Error updating health record:', error),
  });
};

export const useDeleteHealthRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ prisonerId, recordId }: { prisonerId: number; recordId: number }) =>
      deleteHealthRecord(prisonerId, recordId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['infirmerie'] }),
    onError: (error: unknown) => console.error('Error deleting health record:', error),
  });
};
