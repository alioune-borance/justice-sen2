import { useMemo } from "react";
import { keepPreviousData, useQueries, useQuery } from "@tanstack/react-query";
import { getStats } from "./stats.api";
import { StatsBoard, StatsFilters, StatsResponse } from "../types/stats";
import { bucketUnitLabel, isoDate, PeriodBucket, periodBuckets } from "../utils/periods";

const STATS_STALE_TIME = 5 * 60 * 1000;

const statsKey = (board: StatsBoard, filters: StatsFilters) =>
  ["stats", board, [...filters.prisons].sort((a, b) => a - b).join(","), filters.date_from, filters.date_to] as const;

// Tableau de bord complet pour les filtres courants
export const useStats = <B extends StatsBoard>(board: B, filters: StatsFilters, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: statsKey(board, filters),
    queryFn: () => getStats(board, filters),
    staleTime: STATS_STALE_TIME,
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });

// Liste des prisons du périmètre (options du filtre) : réponse sans filtre de prison, sur une seule
// journée pour limiter le calcul des flux.
export const useStatsPrisons = (board: StatsBoard, options?: { enabled?: boolean }) => {
  const today = isoDate(new Date());
  const query = useQuery({
    queryKey: statsKey(board, { prisons: [], date_from: today, date_to: today }),
    queryFn: () => getStats(board, { prisons: [], date_from: today, date_to: today }),
    staleTime: 30 * 60 * 1000,
    enabled: options?.enabled ?? true,
  });
  return { ...query, data: query.data?.prisons };
};

export interface SeriesPoint<B extends StatsBoard> {
  bucket: PeriodBucket;
  data: StatsResponse<B>;
}

// Évolution dans le temps : le backend n'expose pas de série, on interroge le même endpoint par tranche
// (mois, trimestre ou année, voir periodBuckets). Seuls les FLUX ont un sens par tranche : les stocks
// (effectifs, occupation) sont toujours calculés à la date du jour.
export const useStatsSeries = <B extends StatsBoard>(board: B, filters: StatsFilters, options?: { enabled?: boolean }) => {
  const buckets = useMemo(() => periodBuckets(filters.date_from, filters.date_to), [filters.date_from, filters.date_to]);
  const results = useQueries({
    queries: buckets.map((bucket) => {
      const bucketFilters = { prisons: filters.prisons, date_from: bucket.date_from, date_to: bucket.date_to };
      return {
        queryKey: statsKey(board, bucketFilters),
        queryFn: () => getStats(board, bucketFilters),
        staleTime: STATS_STALE_TIME,
        enabled: options?.enabled ?? true,
      };
    }),
  });

  const isLoading = results.some((r) => r.isLoading);
  const isError = results.some((r) => r.isError);
  const dataKey = results.map((r) => r.dataUpdatedAt).join(",");
  const points = useMemo(
    () =>
      results.every((r) => r.data)
        ? buckets.map((bucket, i) => ({ bucket, data: results[i].data as StatsResponse<B> }))
        : [],
    // dataKey résume les résultats (useQueries renvoie un nouveau tableau à chaque rendu)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [buckets, dataKey]
  );
  return {
    points: points as SeriesPoint<B>[],
    isLoading,
    isError,
    unit: bucketUnitLabel(filters.date_from, filters.date_to),
  };
};
