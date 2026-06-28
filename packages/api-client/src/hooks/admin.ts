import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useApiClient } from "../context";
import { keys } from "../keys";
import type { User } from "../resources/admin";

export function useAdminUsers() {
  const api = useApiClient();

  return useQuery({
    queryKey: keys.admin.users,
    queryFn: () => api.admin.listUsers(),
  });
}

export function useAdminUserSessions(userId: string) {
  const api = useApiClient();

  return useQuery({
    queryKey: keys.admin.userSessions(userId),
    queryFn: () => api.admin.getUserSessions(userId),
    enabled: !!userId,
  });
}

export function useAdminLockUser() {
  const api = useApiClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, lock }: { userId: string; lock: boolean }) =>
      lock ? api.admin.lockUser(userId) : api.admin.unlockUser(userId),
    onMutate: async ({ userId, lock }) => {
      const previous = qc.getQueryData<User[]>(keys.admin.users);
      qc.setQueryData<User[]>(keys.admin.users, (old) =>
        (old ?? []).map((u) => (u.id === userId ? { ...u, is_locked: lock } : u)),
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(keys.admin.users, context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.admin.users }),
  });
}

export function useAdminDeleteUser() {
  const api = useApiClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => api.admin.deleteUser(userId),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.admin.users }),
  });
}

export function useAdminSetUserRole() {
  const api = useApiClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.admin.setUserRole(userId, role),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.admin.users }),
  });
}

export function useAdminSetUserPlan() {
  const api = useApiClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      plan,
      expiresAt,
    }: {
      userId: string;
      plan: string;
      expiresAt?: string;
    }) => api.admin.setUserPlan(userId, plan, expiresAt),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.admin.users }),
  });
}

export function useAdminImpersonate() {
  const api = useApiClient();

  return useMutation({
    mutationFn: (userId: string) => api.admin.impersonateUser(userId),
  });
}

export function useAdminForceReset() {
  const api = useApiClient();

  return useMutation({
    mutationFn: (userId: string) => api.admin.forceResetPassword(userId),
  });
}

export function useAdminResendVerification() {
  const api = useApiClient();

  return useMutation({
    mutationFn: (userId: string) => api.admin.resendVerification(userId),
  });
}

export function useSecurityEvents(eventType?: string) {
  const api = useApiClient();

  return useQuery({
    queryKey: keys.admin.securityEvents(eventType),
    queryFn: () => api.admin.getSecurityEvents({ type: eventType || undefined, limit: 50 }),
  });
}

export function useSessionInfo() {
  const api = useApiClient();

  return useQuery({
    queryKey: keys.admin.sessions,
    queryFn: () => api.admin.getSessionInfo(),
  });
}

export function useLoginAttempts() {
  const api = useApiClient();

  return useQuery({
    queryKey: keys.admin.loginAttempts,
    queryFn: () => api.admin.getLoginAttempts({ limit: 20, success: false }),
  });
}

export function useAdminTournaments() {
  const api = useApiClient();

  return useQuery({
    queryKey: keys.admin.tournaments,
    queryFn: () => api.admin.listTournaments(),
  });
}

export function useAdminUpdateTournament() {
  const api = useApiClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; status?: string }) =>
      api.admin.updateTournament(id, data),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.admin.tournaments }),
  });
}

export function useAdminDeleteTournament() {
  const api = useApiClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.admin.deleteTournament(id),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.admin.tournaments }),
  });
}

export function useSystemHealth() {
  const api = useApiClient();

  return useQuery({
    queryKey: keys.admin.systemHealth,
    queryFn: () => api.admin.getSystemHealth(),
    refetchInterval: 30_000,
  });
}

export type { User };
