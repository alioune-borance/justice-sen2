// get detenus list using axiosInstance
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPrisons } from './prison.api';

export const useGetPrisons = () =>
  useQuery({
    queryKey: ["prisons"],
    queryFn: () => getPrisons(),
    staleTime: 30 * 60 * 1000, 
  });