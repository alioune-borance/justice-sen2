import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../../shared/api/axiosInstance";
import { Affectation, CreateAffectationDto } from "../types/affectation";

// SUPER_ADMIN : toutes ; acteurs judiciaires : les leurs (filtré par le backend)
export const getAffectations = async (): Promise<Affectation[]> => {
  const { data } = await axiosInstance.get<Affectation[]>("judicial-assignments/");
  return data;
};

export const createAffectation = async (payload: CreateAffectationDto): Promise<Affectation> => {
  const { data } = await axiosInstance.post<Affectation>("judicial-assignments/", payload);
  return data;
};

// Fin d'affectation : l'accès de l'acteur au détenu est coupé immédiatement
export const endAffectation = async (id: number): Promise<Affectation> => {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await axiosInstance.patch<Affectation>(`judicial-assignments/${id}/`, { actif: false, date_fin: today });
  return data;
};

export const useGetAffectations = (options?: { enabled?: boolean }) =>
  useQuery({ queryKey: ["affectations"], queryFn: getAffectations, staleTime: 60 * 1000, enabled: options?.enabled ?? true });

export const useCreateAffectation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAffectation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["affectations"] }),
  });
};

export const useEndAffectation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: endAffectation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["affectations"] }),
  });
};
