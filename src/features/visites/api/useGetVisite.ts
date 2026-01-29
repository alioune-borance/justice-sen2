import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { UpdateVisiteDto, Visite } from '../types/visite';
import { addNewVisite, addNewVisitor, getVisiteById, getVisites, getVisitors, updateVisite } from './visites.api';

type UpdateVisiteVariables = { id: number } & UpdateVisiteDto;

export const useGetVisites = () =>
  useQuery({
    queryKey: ["visites"],
    queryFn: () => getVisites(),
    staleTime: 30 * 60 * 1000, 
  });

export const useGetVisiteById = (id: number) =>
  useQuery({
    queryKey: ["visite", id],
    queryFn: () => getVisiteById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, 
  });


export const useCreateVisite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addNewVisite,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['visites'] });
    },
    onError: (error: any) => {
      console.error('Error creating visite:', error);
    },
  });
};


export const useUpdateVisite = (): UseMutationResult<
  Visite, // Return type
  Error, // Error type
  UpdateVisiteVariables, // Variables type
  unknown // Context type (usually unknown)
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: UpdateVisiteVariables) => 
      updateVisite(id, data),
    onSuccess: (data: Visite, variables: UpdateVisiteVariables) => {
      queryClient.invalidateQueries({ queryKey: ['visites'] });
      queryClient.invalidateQueries({ queryKey: ['visite', variables.id] });
    },
    onError: (error: Error) => {
      console.error('Error updating visite:', error);
    },
  });
};

export const useGetVisitors = () =>
  useQuery({
    queryKey: ["visitors"],
    queryFn: () => getVisitors(),
    staleTime: 30 * 60 * 1000, 
  });

export const useCreateVisitor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addNewVisitor,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
    },
    onError: (error: any) => {
      console.error('Error creating visitor:', error);
    },
  });
};