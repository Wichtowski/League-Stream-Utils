'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/_components/button';
import { Badge } from '@/_components/badge';
import { DataTable } from '@/_components/data-table';
import { Select, Input } from '@/_components/input';
import { Skeleton } from '@lsu/ui/skeleton';
import { useAuth } from '@/_components/auth-provider';

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function post(url: string, body?: unknown) {
  return fetchJSON(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

function patch(url: string, body: unknown) {
  return fetchJSON(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const BASE_ROLE_OPTIONS = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'commentator', label: 'Commentator' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'organizer', label: 'Organizer' },
  { value: 'admin', label: 'Admin' },
];

const DEVELOPER_ROLE_OPTION = { value: 'developer', label: 'Developer' };

const PLAN_OPTIONS = [
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro' },
];

const roleBadgeVariant: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  developer: 'success',
  admin: 'error',
  organizer: 'warning',
  moderator: 'info',
  commentator: 'default',
  viewer: 'default',
};

interface User {
  id: string;
  username: string;
  email: string;
  is_admin: boolean;
  is_locked: boolean;
  email_verified?: boolean;
  plan?: string;
  plan_expires_at?: string;
  last_login_at: string | null;
  created_at: string;
}

export function UsersTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const { isDeveloper } = useAuth();

  const roleOptions = useMemo(
    () => (isDeveloper ? [...BASE_ROLE_OPTIONS, DEVELOPER_ROLE_OPTION] : BASE_ROLE_OPTIONS),
    [isDeveloper],
  );

  const { data: users, isPending, isError } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => fetchJSON<User[]>('/api/v1/admin/users'),
  });

  const toggleLock = useMutation({
    mutationFn: ({ userId, isLocked }: { userId: string; isLocked: boolean }) =>
      patch(`/api/v1/admin/users/${userId}`, { isLocked }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  const deleteUser = useMutation({
    mutationFn: (userId: string) =>
      fetchJSON(`/api/v1/admin/users/${userId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  const changeRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      patch(`/api/v1/admin/users/${userId}/role`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  const changePlan = useMutation({
    mutationFn: ({ userId, plan }: { userId: string; plan: string }) =>
      patch(`/api/v1/admin/users/${userId}/plan`, { plan }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  const forceReset = useMutation({
    mutationFn: (userId: string) => post(`/api/v1/admin/users/${userId}/force-reset`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  const impersonate = useMutation({
    mutationFn: (userId: string) => post(`/api/v1/admin/users/${userId}/impersonate`),
    onSuccess: () => window.location.reload(),
  });

  const resendVerification = useMutation({
    mutationFn: (userId: string) => post(`/api/v1/admin/users/${userId}/resend-verification`),
  });

  const filtered = (users ?? []).filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  if (isPending) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height="56px" rounded="lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
        Failed to load users
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by username or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <DataTable
        columns={[
          {
            key: 'username',
            header: 'Username',
            render: (u: User) => <span className="font-medium">{u.username}</span>,
          },
          {
            key: 'email',
            header: 'Email',
            render: (u: User) => (
              <span className="text-text-muted">
                {u.email}
                {u.email_verified === false && (
                  <Badge variant="warning">Unverified</Badge>
                )}
              </span>
            ),
          },
          {
            key: 'role',
            header: 'Role',
            render: (u: User) => (
              <Select
                options={roleOptions}
                value={u.is_admin ? 'admin' : 'viewer'}
                onChange={(e) => changeRole.mutate({ userId: u.id, role: e.target.value })}
                className="!w-28 !py-1 text-xs"
              />
            ),
            className: 'w-36',
          },
          {
            key: 'plan',
            header: 'Plan',
            render: (u: User) => (
              <Select
                options={PLAN_OPTIONS}
                value={u.plan ?? 'free'}
                onChange={(e) => changePlan.mutate({ userId: u.id, plan: e.target.value })}
                className="!w-20 !py-1 text-xs"
              />
            ),
            className: 'w-28',
          },
          {
            key: 'status',
            header: 'Status',
            render: (u: User) =>
              u.is_locked ? (
                <Badge variant="error">Locked</Badge>
              ) : (
                <Badge variant="success">Active</Badge>
              ),
            className: 'w-24',
          },
          {
            key: 'lastLogin',
            header: 'Last Login',
            render: (u: User) => (
              <span className="text-xs text-text-muted">
                {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : 'Never'}
              </span>
            ),
            className: 'w-28',
          },
          {
            key: 'actions',
            header: '',
            render: (u: User) => (
              <div className="flex flex-wrap gap-1 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLock.mutate({ userId: u.id, isLocked: !u.is_locked });
                  }}
                >
                  {u.is_locked ? 'Unlock' : 'Lock'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    impersonate.mutate(u.id);
                  }}
                >
                  Impersonate
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    forceReset.mutate(u.id);
                  }}
                >
                  Force Reset
                </Button>
                {u.email_verified === false && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      resendVerification.mutate(u.id);
                    }}
                  >
                    Resend Email
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete ${u.username}?`)) deleteUser.mutate(u.id);
                  }}
                >
                  Delete
                </Button>
              </div>
            ),
            className: 'w-auto text-right',
          },
        ]}
        data={filtered}
        keyExtractor={(u: User) => u.id}
        onRowClick={(u) => setExpandedUser(expandedUser === u.id ? null : u.id)}
        emptyMessage="No users"
      />

      {expandedUser && <UserSessions userId={expandedUser} />}
    </div>
  );
}

function UserSessions({ userId }: { userId: string }) {
  const { data: sessions, isPending } = useQuery({
    queryKey: ['admin', 'users', userId, 'sessions'],
    queryFn: () => fetchJSON<any[]>(`/api/v1/admin/users/${userId}/sessions`),
  });

  if (isPending) return <Skeleton height="40px" rounded="lg" />;

  if (!sessions?.length) {
    return (
      <div className="rounded-lg border border-border-subtle bg-surface-raised p-3 text-sm text-text-muted">
        No active sessions
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border-subtle bg-surface-raised p-4">
      <h4 className="mb-2 text-sm font-medium">Active Sessions</h4>
      <div className="space-y-2">
        {sessions.map((s: any) => (
          <div key={s.id} className="flex items-center gap-4 rounded bg-surface px-3 py-2 text-xs">
            <span className="text-text-muted">{s.ip ?? 'Unknown IP'}</span>
            <span className="truncate text-text-muted max-w-48">{s.user_agent ?? 'Unknown'}</span>
            <span className="ml-auto text-text-muted">
              Last used: {new Date(s.last_used_at).toLocaleString()}
            </span>
            {s.impersonated_by && <Badge variant="warning">Impersonated</Badge>}
          </div>
        ))}
      </div>
    </div>
  );
}
