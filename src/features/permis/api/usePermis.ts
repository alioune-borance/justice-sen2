import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPermis, PermisFilters, revokePermis, verifyPermis } from "./permis.api";

export const useGetPermis = (filters?: PermisFilters, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ["permis", filters ?? {}],
    queryFn: () => getPermis(filters),
    enabled: options?.enabled ?? true,
    staleTime: 60 * 1000,
  });

export const useRevokePermis = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motif }: { id: number; motif: string }) => revokePermis(id, motif),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permis"] });
      queryClient.invalidateQueries({ queryKey: ["demandes-visite"] });
      queryClient.invalidateQueries({ queryKey: ["demande-visite"] });
    },
  });
};

// Pas de cache : chaque vérification est un contrôle tracé
export const useVerifyPermis = () => useMutation({ mutationFn: verifyPermis });
