'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/_components/badge';
import { DataTable } from '@/_components/data-table';
import { Select } from '@/_components/input';
import { Skeleton } from '@lsu/ui/skeleton';

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

const EVENT_TYPE_OPTIONS = [
  { value: '', label: 'All Events' },
  { value: 'login_success', label: 'Login Success' },
  { value: 'login_failed', label: 'Login Failed' },
  { value: 'user_registered', label: 'User Registered' },
  { value: 'password_changed', label: 'Password Changed' },
  { value: 'impersonation_started', label: 'Impersonation' },
];

const eventBadgeVariant: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  login_success: 'success',
  login_failed: 'error',
  user_registered: 'info',
  password_changed: 'warning',
  impersonation_started: 'warning',
};

export function SecurityTab() {
  const [eventType, setEventType] = useState('');

  const { data: events, isPending: eventsLoading } = useQuery({
    queryKey: ['admin', 'security', 'events', eventType],
    queryFn: () => {
      const params = new URLSearchParams({ limit: '50' });
      if (eventType) params.set('type', eventType);
      return fetchJSON<any[]>(`/api/v1/admin/security/events?${params}`);
    },
  });

  const { data: sessionInfo } = useQuery({
    queryKey: ['admin', 'security', 'sessions'],
    queryFn: () =>
      fetchJSON<{ activeSessions: number; totalUsers: number; recentSessions: any[] }>(
        '/api/v1/admin/security/sessions',
      ),
  });

  const { data: loginAttempts } = useQuery({
    queryKey: ['admin', 'security', 'login-attempts'],
    queryFn: () => fetchJSON<any[]>('/api/v1/admin/security/login-attempts?limit=20&success=false'),
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Active Sessions" value={sessionInfo?.activeSessions ?? '—'} />
        <StatCard label="Total Users" value={sessionInfo?.totalUsers ?? '—'} />
        <StatCard
          label="Failed Logins (recent)"
          value={loginAttempts?.length ?? '—'}
          variant="error"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Security Events</h3>
          <Select
            options={EVENT_TYPE_OPTIONS}
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="!w-44 !py-1 text-xs"
          />
        </div>

        {eventsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} height="40px" rounded="lg" />
            ))}
          </div>
        ) : (
          <DataTable
            columns={[
              {
                key: 'event_type',
                header: 'Event',
                render: (e: any) => (
                  <Badge variant={eventBadgeVariant[e.event_type] ?? 'default'}>
                    {e.event_type}
                  </Badge>
                ),
                className: 'w-40',
              },
              {
                key: 'username',
                header: 'User',
                render: (e: any) => <span className="text-text-muted">{e.username ?? '—'}</span>,
              },
              {
                key: 'ip',
                header: 'IP',
                render: (e: any) => (
                  <span className="font-mono text-xs text-text-muted">{e.ip ?? '—'}</span>
                ),
                className: 'w-32',
              },
              {
                key: 'created_at',
                header: 'Time',
                render: (e: any) => (
                  <span className="text-xs text-text-muted">
                    {new Date(e.created_at).toLocaleString()}
                  </span>
                ),
                className: 'w-44',
              },
            ]}
            data={events ?? []}
            keyExtractor={(e: any) => e.id}
            emptyMessage="No security events"
          />
        )}
      </div>

      {loginAttempts && loginAttempts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Recent Failed Login Attempts</h3>
          <DataTable
            columns={[
              {
                key: 'username',
                header: 'Username',
                render: (a: any) => <span className="font-medium">{a.username}</span>,
              },
              {
                key: 'ip',
                header: 'IP',
                render: (a: any) => (
                  <span className="font-mono text-xs text-text-muted">{a.ip}</span>
                ),
                className: 'w-32',
              },
              {
                key: 'attempted_at',
                header: 'Time',
                render: (a: any) => (
                  <span className="text-xs text-text-muted">
                    {new Date(a.attempted_at).toLocaleString()}
                  </span>
                ),
                className: 'w-44',
              },
            ]}
            data={loginAttempts}
            keyExtractor={(a: any) => a.id}
          />
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: string | number;
  variant?: 'error';
}) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-raised p-4">
      <p className="text-xs text-text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${variant === 'error' ? 'text-red-400' : ''}`}>
        {value}
      </p>
    </div>
  );
}
