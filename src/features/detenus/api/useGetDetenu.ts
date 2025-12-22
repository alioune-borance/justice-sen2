// get detenus list using axiosInstance
import { useQuery } from '@tanstack/react-query';
import { getDetenus } from "./detenus.api";

export const useGetDetenus = () =>
  useQuery({
    queryKey: ["detenus"],
    queryFn: () => getDetenus(),
    staleTime: 30 * 60 * 1000, 
  });
