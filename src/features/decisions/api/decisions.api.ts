import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../../shared/api/axiosInstance";
import { downloadFile, MULTIPART } from "../../../shared/api/download";
import { CorrectDecisionDto, CreateDecisionDto, DecisionFilters, DecisionInput, DecisionJustice } from "../types/decision";

// Périmètre appliqué par le backend : prison actuelle du détenu, ministère de la Justice, acteurs affectés
export const getDecisions = async (filters?: DecisionFilters): Promise<DecisionJustice[]> => {
  const { data } = await axiosInstance.get<DecisionJustice[]>("court-decisions/", {
    params: {
      detenu: filters?.detenu || undefined,
      type: filters?.type || undefined,
      effet: filters?.effet || undefined,
      historique: filters?.historique ? 1 : undefined,
    },
  });
  return data;
};

export const getDecision = async (id: number): Promise<DecisionJustice> => {
  const { data } = await axiosInstance.get<DecisionJustice>(`court-decisions/${id}/`);
  return data;
};

// Multipart : seuls les champs renseignés sont envoyés (en correction, les autres reprennent la version corrigée)
const toFormData = (fields: Partial<DecisionInput> & { detenu?: number; motif_correction?: string }) => {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (value instanceof File) form.append(key, value);
    else form.append(key, String(value));
  });
  return form;
};

export const createDecision = async (dto: CreateDecisionDto): Promise<DecisionJustice> => {
  const { data } = await axiosInstance.post<DecisionJustice>("court-decisions/", toFormData(dto), MULTIPART);
  return data;
};

export const correctDecision = async (id: number, dto: CorrectDecisionDto): Promise<DecisionJustice> => {
  const { data } = await axiosInstance.post<DecisionJustice>(`court-decisions/${id}/correct/`, toFormData(dto), MULTIPART);
  return data;
};

// Prison (AP / SP) : appliquer ou écarter l'effet proposé sur le statut du détenu
export const applyDecisionEffect = async (id: number): Promise<DecisionJustice> => {
  const { data } = await axiosInstance.post<DecisionJustice>(`court-decisions/${id}/apply-status/`, {});
  return data;
};

export const dismissDecisionEffect = async (id: number, motif: string): Promise<DecisionJustice> => {
  const { data } = await axiosInstance.post<DecisionJustice>(`court-decisions/${id}/dismiss-status/`, { motif });
  return data;
};

export const downloadDecision = (decision: Pick<DecisionJustice, "id" | "nom_document">) =>
  downloadFile(`court-decisions/${decision.id}/download/`, decision.nom_document || `decision-${decision.id}.pdf`);

// --- Hooks ---------------------------------------------------------------------------------------
export const useGetDecisions = (filters?: DecisionFilters, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ["decisions", filters ?? {}],
    queryFn: () => getDecisions(filters),
    enabled: options?.enabled ?? true,
    staleTime: 30 * 1000,
  });

export const useGetDecision = (id: number) =>
  useQuery({ queryKey: ["decision", id], queryFn: () => getDecision(id), enabled: !!id });

const useInvalidateDecisions = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["decisions"] });
    queryClient.invalidateQueries({ queryKey: ["decision"] });
    // Appliquer un effet change le statut du détenu (et peut refuser des demandes, révoquer des permis)
    queryClient.invalidateQueries({ queryKey: ["detenus"] });
    queryClient.invalidateQueries({ queryKey: ["detenu"] });
    queryClient.invalidateQueries({ queryKey: ["demandes-visite"] });
    queryClient.invalidateQueries({ queryKey: ["permis"] });
  };
};

export const useCreateDecision = () => {
  const invalidate = useInvalidateDecisions();
  return useMutation({ mutationFn: createDecision, onSuccess: invalidate });
};

export const useCorrectDecision = () => {
  const invalidate = useInvalidateDecisions();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: number } & CorrectDecisionDto) => correctDecision(id, dto),
    onSuccess: invalidate,
  });
};

export const useDecisionEffect = () => {
  const invalidate = useInvalidateDecisions();
  return useMutation({
    mutationFn: ({ id, apply, motif }: { id: number; apply: boolean; motif?: string }) =>
      apply ? applyDecisionEffect(id) : dismissDecisionEffect(id, motif ?? ""),
    onSuccess: invalidate,
  });
};
