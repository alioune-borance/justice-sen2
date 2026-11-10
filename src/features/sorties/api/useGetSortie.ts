import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { UpdateSortieDto, Sortie } from '../types/sortie';
import { addNewSortie, decideSortie, getSortieById, getSorties, SortieAction, updateSortie } from './sorties.api';

type UpdateSortieVariables = { id: number } & UpdateSortieDto;

// enabled: false quand l'utilisateur n'a pas la permission de lecture (évite un 403 inutile)
export const useGetSorties = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ["sorties"],
    queryFn: () => getSorties(),
    enabled: options?.enabled ?? true,
    staleTime: 30 * 60 * 1000, 
  });

export const useGetSortieById = (id: number) =>
  useQuery({
    queryKey: ["sortie", id],
    queryFn: () => getSortieById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, 
  });


export const useCreateSortie = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addNewSortie,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['sorties'] });
    },
    onError: (error: any) => {
      console.error('Error creating sortie:', error);
    },
  });
};


export const useUpdateSortie = (): UseMutationResult<
  Sortie, // Return type
  Error, // Error type
  UpdateSortieVariables, // Variables type
  unknown // Context type (usually unknown)
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: UpdateSortieVariables) => 
      updateSortie(id, data),
    onSuccess: (data: Sortie, variables: UpdateSortieVariables) => {
      queryClient.invalidateQueries({ queryKey: ['sorties'] });
      queryClient.invalidateQueries({ queryKey: ['sortie', variables.id] });
    },
    onError: (error: Error) => {
      console.error('Error updating sortie:', error);
    },
  });
};
export const useSortieDecision = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, action, reason }: { id: number; action: SortieAction; reason?: string }) =>
      decideSortie(id, action, reason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sorties'] });
      queryClient.invalidateQueries({ queryKey: ['sortie', variables.id] });
    },
  });
};
