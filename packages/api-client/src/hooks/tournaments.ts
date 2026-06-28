import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import type { Tournament } from "@lsu/types";

import { useApiClient } from "../context";
import { keys } from "../keys";

export function useTournaments() {
  const api = useApiClient();

  return useQuery({
    queryKey: keys.tournaments.all,
    queryFn: () => api.tournaments.list(),
  });
}

export function useTournament(id: string) {
  const api = useApiClient();

  return useQuery({
    queryKey: keys.tournaments.detail(id),
    queryFn: () => api.tournaments.getById(id),
    enabled: !!id,
  });
}

export function useCreateTournament() {
  const api = useApiClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof api.tournaments.create>[0]) =>
      api.tournaments.create(data),
    onMutate: async (newData) => {
      await qc.cancelQueries({ queryKey: keys.tournaments.all });
      const previous = qc.getQueryData<Tournament[]>(keys.tournaments.all);
      qc.setQueryData<Tournament[]>(keys.tournaments.all, (old) => [
        ...(old ?? []),
        {
          id: `temp-${Date.now()}`,
          ...newData,
          status: "draft",
          registeredTeams: [],
        } as unknown as Tournament,
      ]);

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(keys.tournaments.all, context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.tournaments.all }),
  });
}

export function useUpdateTournament() {
  const api = useApiClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: unknown }) =>
      api.tournaments.update(id, data),
    onMutate: async ({ id, ...rest }) => {
      await qc.cancelQueries({ queryKey: keys.tournaments.detail(id) });
      const previous = qc.getQueryData<Tournament>(keys.tournaments.detail(id));
      qc.setQueryData<Tournament>(keys.tournaments.detail(id), (old) =>
        old ? { ...old, ...rest } : old,
      );

      return { previous, id };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(keys.tournaments.detail(context.id), context.previous);
    },
    onSettled: (_, __, vars) => {
      qc.invalidateQueries({ queryKey: keys.tournaments.all });
      qc.invalidateQueries({ queryKey: keys.tournaments.detail(vars.id) });
    },
  });
}

export function useDeleteTournament() {
  const api = useApiClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.tournaments.remove(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: keys.tournaments.all });
      const previous = qc.getQueryData<Tournament[]>(keys.tournaments.all);
      qc.setQueryData<Tournament[]>(keys.tournaments.all, (old) =>
        (old ?? []).filter((t) => t.id !== id),
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(keys.tournaments.all, context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.tournaments.all }),
  });
}

export function useMatch(id: string) {
  const api = useApiClient();

  return useQuery({
    queryKey: keys.matches.detail(id),
    queryFn: () => api.matches.getById(id),
    enabled: !!id,
  });
}

export function useUpdateMatch() {
  const api = useApiClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      status?: string;
      scoreBlue?: number;
      scoreRed?: number;
    }) => api.matches.update(id, data),
    onSettled: (_, __, vars) => {
      qc.invalidateQueries({ queryKey: keys.matches.detail(vars.id) });
    },
  });
}
