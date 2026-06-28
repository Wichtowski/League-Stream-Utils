import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import type { Commentator } from "@lsu/types";

import { useApiClient } from "../context";
import { keys } from "../keys";

export function useCommentators() {
  const api = useApiClient();

  return useQuery({
    queryKey: keys.commentators.all,
    queryFn: () => api.commentators.list(),
  });
}

export function useCreateCommentator() {
  const api = useApiClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof api.commentators.create>[0]) =>
      api.commentators.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.commentators.all }),
  });
}

export function useDeleteCommentator() {
  const api = useApiClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.commentators.remove(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: keys.commentators.all });
      const previous = qc.getQueryData<Commentator[]>(keys.commentators.all);
      qc.setQueryData<Commentator[]>(keys.commentators.all, (old) =>
        (old ?? []).filter((c) => c.id !== id),
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(keys.commentators.all, context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.commentators.all }),
  });
}
