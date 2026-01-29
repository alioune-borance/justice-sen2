import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { UpdateTransfertDto, Transfert } from '../types/transfert';
import { addNewTransfert, getTransfertById, getTransferts, updateTransfert } from './transferts.api';

type UpdateTransfertVariables = { id: number } & UpdateTransfertDto;

export const useGetTransferts = () =>
  useQuery({
    queryKey: ["transferts"],
    queryFn: () => getTransferts(),
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