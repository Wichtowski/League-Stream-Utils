import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import type { draftSession } from "@lsu/types";

import { useApiClient } from "../context";
import { keys } from "../keys";

export function useDraftSessions() {
  const api = useApiClient();

  return useQuery({
    queryKey: keys.draft.all,
    queryFn: () => api.draft.list(),
  });
}

export function useDraftSession(id: string) {
  const api = useApiClient();

  return useQuery({
    queryKey: keys.draft.detail(id),
    queryFn: () => api.draft.getById(id),
    enabled: !!id,
    refetchInterval: false,
  });
}

export function useCreateDraftSession() {
  const api = useApiClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof api.draft.create>[0]) => api.draft.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.draft.all }),
  });
}

export function useDeleteDraftSession() {
  const api = useApiClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.draft.remove(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: keys.draft.all });
      const previous = qc.getQueryData<draftSession[]>(keys.draft.all);
      qc.setQueryData<draftSession[]>(keys.draft.all, (old) =>
        (old ?? []).filter((s) => s.id !== id),
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(keys.draft.all, context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.draft.all }),
  });
}
