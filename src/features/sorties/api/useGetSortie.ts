import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { UpdateSortieDto, Sortie } from '../types/sortie';
import { addNewSortie, getSortieById, getSorties, updateSortie } from './sorties.api';

type UpdateSortieVariables = { id: number } & UpdateSortieDto;

export const useGetSorties = () =>
  useQuery({
    queryKey: ["sorties"],
    queryFn: () => getSorties(),
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