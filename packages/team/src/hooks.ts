import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const KEYS = {
  all: ['teams'] as const,
  detail: (id: string) => ['teams', id] as const,
};

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useTeams() {
  return useQuery({
    queryKey: KEYS.all,
    queryFn: () => fetchJSON('/api/v1/teams'),
  });
}

export function useTeam(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => fetchJSON(`/api/v1/teams/${id}`),
    enabled: !!id,
  });
}

export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      tag: string;
      colors: { primary: string; secondary: string; accent: string };
      country?: string;
    }) =>
      fetchJSON('/api/v1/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onMutate: async (newData) => {
      await qc.cancelQueries({ queryKey: KEYS.all });
      const previous = qc.getQueryData(KEYS.all);
      qc.setQueryData(KEYS.all, (old: any[] | undefined) => [
        ...(old ?? []),
        { id: `temp-${Date.now()}`, ...newData, players: [], _optimistic: true },
      ]);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(KEYS.all, context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useUpdateTeam() {
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
    }) =>
      fetchJSON(`/api/v1/teams/${id}`, {
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

export function useDeleteTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJSON(`/api/v1/teams/${id}`, { method: 'DELETE' }),
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
