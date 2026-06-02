'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/_components/button';
import { DataTable } from '@/_components/data-table';
import { Select } from '@/_components/input';
import { Skeleton } from '@lsu/ui/skeleton';

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

interface Tournament {
  id: string;
  name: string;
  type: string;
  format: string;
  status: string;
  organizer_id: string;
  organizer_username: string;
  start_date: string | null;
  created_at: string;
}

export function TournamentsTab() {
  const qc = useQueryClient();

  const {
    data: tournaments,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['admin', 'tournaments'],
    queryFn: () => fetchJSON<Tournament[]>('/api/v1/admin/tournaments'),
  });

  const updateTournament = useMutation({
    mutationFn: ({ id, ...body }: { id: string; status?: string }) =>
      fetchJSON(`/api/v1/admin/tournaments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'tournaments'] }),
  });

  const deleteTournament = useMutation({
    mutationFn: (id: string) => fetchJSON(`/api/v1/admin/tournaments/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'tournaments'] }),
  });

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
        Failed to load tournaments
      </div>
    );
  }

  const byStatus = (tournaments ?? []).reduce(
    (acc, t) => {
      acc[t.status] = (acc[t.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        {Object.entries(byStatus).map(([status, count]) => (
          <div
            key={status}
            className="rounded-lg border border-border-subtle bg-surface-raised px-4 py-2"
          >
            <span className="text-xs text-text-muted capitalize">{status}</span>
            <span className="ml-2 text-sm font-semibold">{count}</span>
          </div>
        ))}
        <div className="rounded-lg border border-border-subtle bg-surface-raised px-4 py-2">
          <span className="text-xs text-text-muted">Total</span>
          <span className="ml-2 text-sm font-semibold">{tournaments?.length ?? 0}</span>
        </div>
      </div>

      <DataTable
        columns={[
          {
            key: 'name',
            header: 'Name',
            render: (t: Tournament) => <span className="font-medium">{t.name}</span>,
          },
          {
            key: 'organizer',
            header: 'Organizer',
            render: (t: Tournament) => (
              <span className="text-text-muted">{t.organizer_username}</span>
            ),
          },
          {
            key: 'type',
            header: 'Type',
            render: (t: Tournament) => (
              <span className="text-xs text-text-muted capitalize">{t.type.replace('_', ' ')}</span>
            ),
            className: 'w-28',
          },
          {
            key: 'status',
            header: 'Status',
            render: (t: Tournament) => (
              <Select
                options={[
                  { value: 'draft', label: 'Draft' },
                  { value: 'registration', label: 'Registration' },
                  { value: 'active', label: 'Active' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
                value={t.status}
                onChange={(e) => updateTournament.mutate({ id: t.id, status: e.target.value })}
                className="!w-28 !py-1 text-xs"
              />
            ),
            className: 'w-36',
          },
          {
            key: 'created',
            header: 'Created',
            render: (t: Tournament) => (
              <span className="text-xs text-text-muted">
                {new Date(t.created_at).toLocaleDateString()}
              </span>
            ),
            className: 'w-28',
          },
          {
            key: 'actions',
            header: '',
            render: (t: Tournament) => (
              <div className="flex gap-1 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete tournament "${t.name}"?`)) deleteTournament.mutate(t.id);
                  }}
                >
                  Delete
                </Button>
              </div>
            ),
            className: 'w-24 text-right',
          },
        ]}
        data={tournaments ?? []}
        keyExtractor={(t: Tournament) => t.id}
        emptyMessage="No tournaments"
      />
    </div>
  );
}
