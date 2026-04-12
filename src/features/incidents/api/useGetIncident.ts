import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Incident, DisciplinaryRecord } from '../types/incident';
import { getIncidents, getPrisonerById, addDisciplinaryRecord } from './incidents.api';


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

export const useAddDisciplinaryRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ prisonerId, record }: { prisonerId: number; record: DisciplinaryRecord }) =>
      addDisciplinaryRecord(prisonerId, record),
    onSuccess: (updatedIncident) => {
      // Mise à jour directe du cache pour éviter de dépendre du endpoint liste
      queryClient.setQueryData<Incident[]>(['incidents'], (old = []) => {
        const exists = old.some((i) => i.id === updatedIncident.id);
        if (exists) {
          return old.map((i) => i.id === updatedIncident.id ? updatedIncident : i);
        }
        return [...old, updatedIncident];
      });
    },
    onError: (error: unknown) => console.error('Error adding disciplinary record:', error),
  });
};
