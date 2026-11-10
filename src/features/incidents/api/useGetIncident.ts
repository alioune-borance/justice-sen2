import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DisciplinaryRecord } from '../types/incident';
import {
  getIncidents,
  getPrisonerById,
  addDisciplinaryRecord,
  updateDisciplinaryRecord,
  deleteDisciplinaryRecord,
  decideSanction,
  SanctionAction,
} from './incidents.api';


export const useGetIncidents = () =>
  useQuery({
    queryKey: ['incidents'],
    queryFn: () => getIncidents(),
    staleTime: 5 * 60 * 1000,
  });

export const useGetIncidentById = (id: number) =>
  useQuery({
    queryKey: ['incident', id],
    queryFn: () => getPrisonerById(id),
    enabled: !!id && id > 0,
    staleTime: 5 * 60 * 1000,
  });

const useInvalidateIncidents = () => {
  const queryClient = useQueryClient();
  return (prisonerId: number) => {
    queryClient.invalidateQueries({ queryKey: ['incidents'] });
    queryClient.invalidateQueries({ queryKey: ['incident', prisonerId] });
  };
};

export const useAddDisciplinaryRecord = () => {
  const invalidate = useInvalidateIncidents();
  return useMutation({
    mutationFn: ({ prisonerId, record }: { prisonerId: number; record: DisciplinaryRecord }) =>
      addDisciplinaryRecord(prisonerId, record),
    onSuccess: (_data, { prisonerId }) => invalidate(prisonerId),
    onError: (error: unknown) => console.error('Error adding disciplinary record:', error),
  });
};

export const useUpdateDisciplinaryRecord = () => {
  const invalidate = useInvalidateIncidents();
  return useMutation({
    mutationFn: ({
      prisonerId,
      recordId,
      changes,
    }: {
      prisonerId: number;
      recordId: number;
      changes: Partial<DisciplinaryRecord>;
    }) => updateDisciplinaryRecord(prisonerId, recordId, changes),
    onSuccess: (_data, { prisonerId }) => invalidate(prisonerId),
    onError: (error: unknown) => console.error('Error updating disciplinary record:', error),
  });
};

export const useDecideSanction = () => {
  const invalidate = useInvalidateIncidents();
  return useMutation({
    mutationFn: ({
      prisonerId,
      recordId,
      action,
      reason,
    }: {
      prisonerId: number;
      recordId: number;
      action: SanctionAction;
      reason?: string;
    }) => decideSanction(prisonerId, recordId, action, reason),
    onSuccess: (_data, { prisonerId }) => invalidate(prisonerId),
  });
};

export const useDeleteDisciplinaryRecord = () => {
  const invalidate = useInvalidateIncidents();
  return useMutation({
    mutationFn: ({ prisonerId, recordId }: { prisonerId: number; recordId: number }) =>
      deleteDisciplinaryRecord(prisonerId, recordId),
    onSuccess: (_data, { prisonerId }) => invalidate(prisonerId),
    onError: (error: unknown) => console.error('Error deleting disciplinary record:', error),
  });
};
