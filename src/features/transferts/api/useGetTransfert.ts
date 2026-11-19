import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { UpdateTransfertDto, Transfert } from '../types/transfert';
import { addNewTransfert, decideTransfert, getTransfertById, getTransferts, TransfertAction, updateTransfert } from './transferts.api';

type UpdateTransfertVariables = { id: number } & UpdateTransfertDto;

// enabled: false quand l'utilisateur n'a pas la permission de lecture (évite un 403 inutile)
export const useGetTransferts = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ["transferts"],
    queryFn: () => getTransferts(),
    enabled: options?.enabled ?? true,
    staleTime: 30 * 60 * 1000, 
  });

export const useGetTransfertById = (id: number) =>
  useQuery({
    queryKey: ["transfert", id],
    queryFn: () => {
      console.log("Fetching transfert with ID:", id);
      return getTransfertById(id);
    },
    enabled: !!id && id > 0 && !isNaN(id),
    staleTime: 5 * 60 * 1000, 
  });


export const useCreateTransfert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addNewTransfert,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['transferts'] });
    },
    onError: (error: any) => {
      console.error('Error creating transfert:', error);
    },
  });
};


export const useUpdateTransfert = (): UseMutationResult<
  Transfert, // Return type
  Error, // Error type
  UpdateTransfertVariables, // Variables type
  unknown // Context type (usually unknown)
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: UpdateTransfertVariables) => 
      updateTransfert(id, data),
    onSuccess: (data: Transfert, variables: UpdateTransfertVariables) => {
      queryClient.invalidateQueries({ queryKey: ['transferts'] });
      queryClient.invalidateQueries({ queryKey: ['transfert', variables.id] });
    },
    onError: (error: Error) => {
      console.error('Error updating transfert:', error);
    },
  });
};
export const useTransfertDecision = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, action, reason }: { id: number; action: TransfertAction; reason?: string }) =>
      decideTransfert(id, action, reason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transferts'] });
      queryClient.invalidateQueries({ queryKey: ['transfert', variables.id] });
      // L'arrivée change la prison du détenu
      queryClient.invalidateQueries({ queryKey: ['detenus'] });
    },
  });
};
