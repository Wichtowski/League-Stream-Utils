'use client';

import { useState } from 'react';
import { PageWrapper } from '@/_components/page-wrapper';
import { Button } from '@/_components/button';
import { Badge } from '@/_components/badge';
import { Modal } from '@/_components/modal';
import { Input, Select, Textarea } from '@/_components/input';
import { DataTable } from '@/_components/data-table';
import { EmptyState } from '@/_components/empty-state';
import { useTournaments, useCreateTournament, useDeleteTournament } from '@lsu/tournament/hooks';
import { Skeleton } from '@lsu/ui/skeleton';
import { toast } from '@/_components/toast';

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'info' | 'error'> = {
  draft: 'default',
  registration: 'info',
  active: 'success',
  completed: 'default',
  cancelled: 'error',
};

export default function TournamentsPage() {
  const { data: tournaments, isPending, isError } = useTournaments();
  const createTournament = useCreateTournament();
  const deleteTournament = useDeleteTournament();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'ladder', format: 'bo3', description: '' });

  function handleCreate() {
    createTournament.mutate(
      {
        name: form.name,
        type: form.type,
        format: form.format,
        description: form.description || undefined,
      },
      {
        onSuccess: () => {
          setShowCreate(false);
          setForm({ name: '', type: 'ladder', format: 'bo3', description: '' });
          toast('success', 'Tournament created');
        },
        onError: () => toast('error', 'Failed to create tournament'),
      },
    );
  }

  return (
    <PageWrapper
      title="Tournaments"
      subtitle="Create and run tournaments"
      actions={<Button onClick={() => setShowCreate(true)}>Create Tournament</Button>}
    >
      {isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height="56px" rounded="lg" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          Failed to load tournaments
        </div>
      ) : (
        <>
          <DataTable
            columns={[
              {
                key: 'name',
                header: 'Tournament',
                render: (t: any) => <span className="font-medium">{t.name}</span>,
              },
              {
                key: 'type',
                header: 'Type',
                render: (t: any) => (
                  <span className="text-text-muted capitalize">{t.type?.replace('_', ' ')}</span>
                ),
                className: 'w-32',
              },
              {
                key: 'format',
                header: 'Format',
                render: (t: any) => <Badge variant="info">{t.format?.toUpperCase()}</Badge>,
                className: 'w-24',
              },
              {
                key: 'status',
                header: 'Status',
                render: (t: any) => (
                  <Badge variant={statusVariant[t.status] ?? 'default'}>{t.status}</Badge>
                ),
                className: 'w-28',
              },
              {
                key: 'teams',
                header: 'Teams',
                render: (t: any) => (
                  <span className="text-text-muted">{t.tournamentTeams?.length ?? 0}</span>
                ),
                className: 'w-20',
              },
              {
                key: 'actions',
                header: '',
                render: (t: any) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete ${t.name}?`))
                        {deleteTournament.mutate(t.id, {
                          onSuccess: () => toast('success', 'Tournament deleted'),
                          onError: () => toast('error', 'Failed to delete tournament'),
                        });}
                    }}
                  >
                    Delete
                  </Button>
                ),
                className: 'w-20 text-right',
              },
            ]}
            data={tournaments ?? []}
            keyExtractor={(t: any) => t.id}
            emptyMessage=""
          />
          {(tournaments ?? []).length === 0 && (
            <EmptyState
              message="No tournaments yet — set up brackets and manage matches."
              actionLabel="Create a tournament"
              actionHref="/modules/tournaments/new"
            />
          )}
        </>
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Tournament"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!form.name || createTournament.isPending}>
              {createTournament.isPending ? 'Creating...' : 'Create'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Name"
            id="t-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Summer Split 2026"
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Type"
              id="t-type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              options={[
                { value: 'ladder', label: 'Ladder' },
                { value: 'swiss', label: 'Swiss' },
                { value: 'round_robin', label: 'Round Robin' },
                { value: 'groups', label: 'Groups' },
              ]}
            />
            <Select
              label="Format"
              id="t-format"
              value={form.format}
              onChange={(e) => setForm({ ...form, format: e.target.value })}
              options={[
                { value: 'bo1', label: 'Best of 1' },
                { value: 'bo3', label: 'Best of 3' },
                { value: 'bo5', label: 'Best of 5' },
              ]}
            />
          </div>
          <Textarea
            label="Description"
            id="t-desc"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Optional description..."
          />
        </div>
      </Modal>
    </PageWrapper>
  );
}
