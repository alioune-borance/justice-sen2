import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreateUserDto, UpdateUserDto } from "../types/user";
import { createUser, getUsers, setUserActive, updateUser, UsersFilters } from "./users.api";

export const useGetUsers = (filters?: UsersFilters, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ["users", filters ?? {}],
    queryFn: () => getUsers(filters),
    enabled: options?.enabled ?? true,
    staleTime: 60 * 1000,
  });

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserDto) => createUser(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number } & UpdateUserDto) => updateUser(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
};

export const useSetUserActive = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => setUserActive(id, active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
};
