// get detenus list using axiosInstance
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPrison, getPrisons, updatePrison } from './prison.api';
import { CreatePrisonDto, UpdatePrisonDto } from '../types/prison';

export const useGetPrisons = () =>
  useQuery({
    queryKey: ["prisons"],
    queryFn: () => getPrisons(),
    staleTime: 30 * 60 * 1000,
  });

export const useCreatePrison = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePrisonDto) => createPrison(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["prisons"] }),
  });
};

export const useUpdatePrison = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdatePrisonDto }) => updatePrison(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["prisons"] }),
  });
};