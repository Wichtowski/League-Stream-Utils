import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const KEYS = {
  all: ['tournaments'] as const,
  detail: (id: string) => ['tournaments', id] as const,
  matches: (tournamentId: string) => ['tournaments', tournamentId, 'matches'] as const,
  match: (id: string) => ['matches', id] as const,
};

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useTournaments() {
  return useQuery({
    queryKey: KEYS.all,
    queryFn: () => fetchJSON('/api/v1/tournaments'),
  });
}

export function useTournament(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => fetchJSON(`/api/v1/tournaments/${id}`),
    enabled: !!id,
  });
}

export function useCreateTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; type: string; format: string; description?: string }) =>
      fetchJSON('/api/v1/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onMutate: async (newData) => {
      await qc.cancelQueries({ queryKey: KEYS.all });
      const previous = qc.getQueryData(KEYS.all);
      qc.setQueryData(KEYS.all, (old: any[] | undefined) => [
        ...(old ?? []),
        {
          id: `temp-${Date.now()}`,
          ...newData,
          status: 'draft',
          tournamentTeams: [],
          _optimistic: true,
        },
      ]);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(KEYS.all, context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useUpdateTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: unknown }) =>
      fetchJSON(`/api/v1/tournaments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onMutate: async (newData) => {
      const { id, ...rest } = newData;
      await qc.cancelQueries({ queryKey: KEYS.detail(id) });
      const previous = qc.getQueryData(KEYS.detail(id));
      qc.setQueryData(KEYS.detail(id), (old: any) => (old ? { ...old, ...rest } : old));
      return { previous, id };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(KEYS.detail(context.id), context.previous);
    },
    onSettled: (_, __, vars) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.detail(vars.id) });
    },
  });
}

export function useDeleteTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJSON(`/api/v1/tournaments/${id}`, { method: 'DELETE' }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: KEYS.all });
      const previous = qc.getQueryData(KEYS.all);
      qc.setQueryData(KEYS.all, (old: any[] | undefined) =>
        (old ?? []).filter((t: any) => t.id !== id),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(KEYS.all, context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useMatch(id: string) {
  return useQuery({
    queryKey: KEYS.match(id),
    queryFn: () => fetchJSON(`/api/v1/matches/${id}`),
    enabled: !!id,
  });
}

export function useUpdateMatch() {
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
    }) =>
      fetchJSON(`/api/v1/matches/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onMutate: async (newData) => {
      const { id, ...rest } = newData;
      await qc.cancelQueries({ queryKey: KEYS.match(id) });
      const previous = qc.getQueryData(KEYS.match(id));
      qc.setQueryData(KEYS.match(id), (old: any) => (old ? { ...old, ...rest } : old));
      return { previous, id };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(KEYS.match(context.id), context.previous);
    },
    onSettled: (_, __, vars) => {
      qc.invalidateQueries({ queryKey: KEYS.match(vars.id) });
    },
  });
}
