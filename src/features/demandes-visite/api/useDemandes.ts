import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addPieceDemande,
  createDemande,
  DemandeAction,
  getDemande,
  getDemandes,
  postDemandeAction,
  reviewPieceDemande,
} from "./demandes.api";
import { DemandeFilters, StatutPieceDemande, TypePieceDemande } from "../types/demande";

export const useGetDemandes = (filters?: DemandeFilters, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ["demandes-visite", filters ?? {}],
    queryFn: () => getDemandes(filters),
    enabled: options?.enabled ?? true,
    staleTime: 30 * 1000,
  });

export const useGetDemande = (id: number) =>
  useQuery({ queryKey: ["demande-visite", id], queryFn: () => getDemande(id), enabled: !!id, staleTime: 15 * 1000 });

// Liste, détail et permis (une validation émet un permis, un refus automatique en révoque)
const useInvalidateDemandes = () => {
  const queryClient = useQueryClient();
  return (id?: number) => {
    queryClient.invalidateQueries({ queryKey: ["demandes-visite"] });
    if (id) queryClient.invalidateQueries({ queryKey: ["demande-visite", id] });
    queryClient.invalidateQueries({ queryKey: ["permis"] });
  };
};

export const useCreateDemande = () => {
  const invalidate = useInvalidateDemandes();
  return useMutation({ mutationFn: createDemande, onSuccess: () => invalidate() });
};

export const useAddPieceDemande = () => {
  const invalidate = useInvalidateDemandes();
  return useMutation({
    mutationFn: ({ id, type, fichier }: { id: number; type: TypePieceDemande; fichier: File }) =>
      addPieceDemande(id, type, fichier),
    onSuccess: (_data, { id }) => invalidate(id),
  });
};

export const useDemandeAction = () => {
  const invalidate = useInvalidateDemandes();
  return useMutation({
    mutationFn: ({ id, action, body }: { id: number; action: DemandeAction; body?: Record<string, string> }) =>
      postDemandeAction(id, action, body),
    onSuccess: (_data, { id }) => invalidate(id),
  });
};

export const useReviewPieceDemande = () => {
  const invalidate = useInvalidateDemandes();
  return useMutation({
    mutationFn: ({
      pieceId,
      statut,
      commentaire,
    }: {
      demandeId: number;
      pieceId: number;
      statut: Exclude<StatutPieceDemande, "A_VERIFIER">;
      commentaire?: string;
    }) => reviewPieceDemande(pieceId, statut, commentaire),
    onSuccess: (_data, { demandeId }) => invalidate(demandeId),
  });
};
