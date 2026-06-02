import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const KEYS = {
  all: ['draft-sessions'] as const,
  detail: (id: string) => ['draft-sessions', id] as const,
};

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function usedraftSessions() {
  return useQuery({
    queryKey: KEYS.all,
    queryFn: () => fetchJSON('/api/v1/draft'),
  });
}

export function usedraftSession(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => fetchJSON(`/api/v1/draft/${id}`),
    enabled: !!id,
    refetchInterval: false,
  });
}

export function useCreatedraftSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { config: Record<string, unknown>; teams: Record<string, unknown>; password?: string }) =>
      fetchJSON('/api/v1/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useDeletedraftSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJSON(`/api/v1/draft/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}
