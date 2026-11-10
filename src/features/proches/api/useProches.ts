import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LienAction } from "../types/proche";
import { decideLien, getLiens, matchLien, reviewPiece, uploadPiece } from "./proches.api";

export const useGetLiens = (params?: { statut?: string; a_rapprocher?: boolean }) =>
  useQuery({
    queryKey: ["liens-proches", params ?? {}],
    queryFn: () => getLiens(params),
    staleTime: 30 * 1000,
  });

const useInvalidateLiens = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["liens-proches"] });
};

export const useDecideLien = () => {
  const invalidate = useInvalidateLiens();
  return useMutation({
    mutationFn: ({ id, action, motif }: { id: number; action: LienAction; motif?: string }) =>
      decideLien(id, action, motif),
    onSuccess: invalidate,
  });
};

export const useMatchLien = () => {
  const invalidate = useInvalidateLiens();
  return useMutation({
    mutationFn: ({ id, detenu }: { id: number; detenu: number }) => matchLien(id, detenu),
    onSuccess: invalidate,
  });
};

export const useReviewPiece = () => {
  const invalidate = useInvalidateLiens();
  return useMutation({
    mutationFn: ({ id, statut, commentaire }: { id: number; statut: "CONFORME" | "NON_CONFORME"; commentaire?: string }) =>
      reviewPiece(id, statut, commentaire),
    onSuccess: invalidate,
  });
};

export const useUploadPiece = () => {
  const invalidate = useInvalidateLiens();
  return useMutation({ mutationFn: uploadPiece, onSuccess: invalidate });
};
