import { axiosInstance } from "../../../shared/api/axiosInstance";
import { Detenu } from "../../../entities/Detenu";

type DetenusParams = {
  page?: number;
  size?: number;
  search?: string;
};

export const getDetenus = async (
    params?: DetenusParams
):  Promise<{ content: Detenu[]; total: number }> => {
  const { data } = await axiosInstance.get<{ content: Detenu[]; total: number }>("/detenus", {
    params
  });
  return data;
};
