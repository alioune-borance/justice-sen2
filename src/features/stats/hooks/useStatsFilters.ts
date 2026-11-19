import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { StatsFilters } from "../types/stats";
import { filtersFromSearch, filtersToSearch } from "../utils/periods";

// Filtres du tableau de bord gardés dans l'URL : un lien copié montre la même vue
export const useStatsFilters = () => {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => filtersFromSearch(params), [params]);
  const setFilters = useCallback((next: StatsFilters) => setParams(filtersToSearch(next), { replace: true }), [setParams]);
  return [filters, setFilters] as const;
};
