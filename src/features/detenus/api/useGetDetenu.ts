// get detenus list using axiosInstance
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { getDetenus, getDetenuById, addNewDetenu, updateDetenu, releaseDetenu } from "./detenus.api";
import { Detenu, UpdateDetenuDto } from '../types/detenu';


type UpdateDetenuVariables = { id: number } & UpdateDetenuDto;

export const useGetDetenus = () =>
  useQuery({
    queryKey: ["detenus"],
    queryFn: () => getDetenus(),
    staleTime: 30 * 60 * 1000, 
  });

export const useGetDetenuById = (id: number, p0: { enabled: boolean; }) =>
  useQuery({
    queryKey: ["detenu", id],
    queryFn: () => getDetenuById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, 
  });


export const useCreateDetenu = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addNewDetenu,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['detenus'] });
    },
    onError: (error: any) => {
      console.error('Error creating detenu:', error);
    },
  });
};


export const useReleaseDetenu = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, release_date }: { id: number; release_date?: string }) => releaseDetenu(id, release_date),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['detenus'] });
      queryClient.invalidateQueries({ queryKey: ['detenu', variables.id] });
    },
  });
};


export const useUpdateDetenu = (): UseMutationResult<
  Detenu, // Return type
  Error, // Error type
  UpdateDetenuVariables, // Variables type
  unknown // Context type (usually unknown)
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: UpdateDetenuVariables) => 
      updateDetenu(id, data),
    onSuccess: (data: Detenu, variables: UpdateDetenuVariables) => {
      queryClient.invalidateQueries({ queryKey: ['detenus'] });
      queryClient.invalidateQueries({ queryKey: ['detenu', variables.id] });
    },
    onError: (error: Error) => {
      console.error('Error updating detenu:', error);
    },
  });
};