import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const KEYS = {
  all: ['camera-configs'] as const,
  detail: (teamId: string) => ['camera-configs', teamId] as const,
};

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useCameraConfigs() {
  return useQuery({
    queryKey: KEYS.all,
    queryFn: () => fetchJSON('/api/v1/cameras'),
  });
}

export function useCameraConfig(teamId: string) {
  return useQuery({
    queryKey: KEYS.detail(teamId),
    queryFn: () => fetchJSON(`/api/v1/cameras/${teamId}`),
    enabled: !!teamId,
  });
}

export function useUpdateCameraConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      teamId: string;
      players: Array<{ role: string; streamUrl: string; playerName?: string }>;
    }) =>
      fetchJSON(`/api/v1/cameras/${data.teamId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ players: data.players }),
      }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.detail(vars.teamId) });
    },
  });
}

export function useDeleteCameraConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (teamId: string) => fetchJSON(`/api/v1/cameras/${teamId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}
