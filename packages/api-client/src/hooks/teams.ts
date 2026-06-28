import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import type { Team } from "@lsu/types";

import { useApiClient } from "../context";
import { keys } from "../keys";

export function useTeams() {
  const api = useApiClient();

  return useQuery({
    queryKey: keys.teams.all,
    queryFn: () => api.teams.list(),
  });
}

export function useTeam(id: string) {
  const api = useApiClient();

  return useQuery({
    queryKey: keys.teams.detail(id),
    queryFn: () => api.teams.getById(id),
    enabled: !!id,
  });
}

export function useCreateTeam() {
  const api = useApiClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof api.teams.create>[0]) => api.teams.create(data),
    onMutate: async (newData) => {
      await qc.cancelQueries({ queryKey: keys.teams.all });
      const previous = qc.getQueryData<Team[]>(keys.teams.all);
      qc.setQueryData<Team[]>(keys.teams.all, (old) => [
        ...(old ?? []),
        { id: `temp-${Date.now()}`, ...newData, players: [] } as unknown as Team,
      ]);

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(keys.teams.all, context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.teams.all }),
  });
}

export function useUpdateTeam() {
  const api = useApiClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      tag?: string;
      colors?: { primary: string; secondary: string; accent: string };
      country?: string;
    }) => api.teams.update(id, data),
    onMutate: async ({ id, ...rest }) => {
      await qc.cancelQueries({ queryKey: keys.teams.detail(id) });
      const previous = qc.getQueryData<Team>(keys.teams.detail(id));
      qc.setQueryData<Team>(keys.teams.detail(id), (old) => (old ? { ...old, ...rest } : old));

      return { previous, id };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(keys.teams.detail(context.id), context.previous);
    },
    onSettled: (_, __, vars) => {
      qc.invalidateQueries({ queryKey: keys.teams.all });
      qc.invalidateQueries({ queryKey: keys.teams.detail(vars.id) });
    },
  });
}

export function useDeleteTeam() {
  const api = useApiClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.teams.remove(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: keys.teams.all });
      const previous = qc.getQueryData<Team[]>(keys.teams.all);
      qc.setQueryData<Team[]>(keys.teams.all, (old) => (old ?? []).filter((t) => t.id !== id));

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(keys.teams.all, context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.teams.all }),
  });
}
