import { axiosInstance } from "../../../shared/api/axiosInstance";
import { StatsBoard, StatsFilters, StatsResponse } from "../types/stats";

// Lecture seule. Le backend restreint chaque tableau à son ministère (et au SUPER_ADMIN),
// même en mode observation ; 400 si une date ou une prison est invalide.
export const getStats = async <B extends StatsBoard>(board: B, filters: StatsFilters): Promise<StatsResponse<B>> => {
  const { data } = await axiosInstance.get<StatsResponse<B>>(`stats/${board}/`, {
    params: {
      prison: filters.prisons.length ? filters.prisons.join(",") : undefined,
      date_from: filters.date_from,
      date_to: filters.date_to,
    },
  });
  return data;
};
