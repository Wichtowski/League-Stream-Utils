import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import type { CameraConfig } from "@lsu/types";

import { useApiClient } from "../context";
import { keys } from "../keys";

export function useCameraConfigs() {
  const api = useApiClient();

  return useQuery({
    queryKey: keys.cameras.all,
    queryFn: () => api.cameras.list(),
  });
}

export function useCameraConfig(teamId: string) {
  const api = useApiClient();

  return useQuery({
    queryKey: keys.cameras.detail(teamId),
    queryFn: () => api.cameras.getByTeam(teamId),
    enabled: !!teamId,
  });
}

export function useUpdateCameraConfig() {
  const api = useApiClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: { teamId: string; players: CameraConfig["players"] }) =>
      api.cameras.update(data.teamId, data.players),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: keys.cameras.all });
      qc.invalidateQueries({ queryKey: keys.cameras.detail(vars.teamId) });
    },
  });
}

export function useDeleteCameraConfig() {
  const api = useApiClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (teamId: string) => api.cameras.remove(teamId),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.cameras.all }),
  });
}
