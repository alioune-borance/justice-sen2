import { QueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";

// Réponses définitives : réessayer ne changerait rien (session, droits, périmètre)
const NO_RETRY_STATUSES = new Set([401, 403, 404]);

// Instance partagée : vidée à la déconnexion pour ne jamais montrer les données d'une autre session.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 60 * 1000,
      retry: (failureCount, error) => {
        const status = isAxiosError(error) ? error.response?.status : undefined;
        if (status !== undefined && NO_RETRY_STATUSES.has(status)) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
    },
  },
});
