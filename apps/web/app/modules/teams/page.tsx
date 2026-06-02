'use client';

import { useState } from 'react';
import { PageWrapper } from '@/_components/page-wrapper';
import { Button } from '@/_components/button';
import { Badge } from '@/_components/badge';
import { Modal } from '@/_components/modal';
import { Input } from '@/_components/input';
import { DataTable } from '@/_components/data-table';
import { EmptyState } from '@/_components/empty-state';
import { toast } from '@/_components/toast';
import { useTeams, useCreateTeam, useDeleteTeam } from '@lsu/team/hooks';
import { useCameraConfig, useUpdateCameraConfig } from '@lsu/camera/hooks';
import { Skeleton } from '@lsu/ui/skeleton';
import { useSelection } from '@/_hooks/use-selection';

export default function TeamsPage() {
  const { data: teams, isPending, isError } = useTeams();
  const createTeam = useCreateTeam();
  const deleteTeam = useDeleteTeam();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', tag: '', primary: '#6366f1', secondary: '#8b5cf6', accent: '#a78bfa' });
  const { selectedTeamId, selectTeam } = useSelection();

  function handleCreate() {
    createTeam.mutate(
      { name: form.name, tag: form.tag, colors: { primary: form.primary, secondary: form.secondary, accent: form.accent } },
      {
        onSuccess: () => {
          setShowCreate(false);
          setForm({ name: '', tag: '', primary: '#6366f1', secondary: '#8b5cf6', accent: '#a78bfa' });
          toast('success', 'Team created');
        },
        onError: () => toast('error', 'Failed to create team'),
      },
    );
  }

  return (
    <PageWrapper
      title="Teams"
      subtitle="Manage rosters and staff"
      actions={<Button onClick={() => setShowCreate(true)}>Add Team</Button>}
    >
      {isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height="56px" rounded="lg" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          Failed to load teams
        </div>
      ) : (
        <>
        <DataTable
          columns={[
            {
              key: 'name',
              header: 'Team',
              render: (t: any) => (
                <div className="flex items-center gap-3">
                  <div
                    className="h-8 w-8 rounded-md"
                    style={{ background: `linear-gradient(135deg, ${t.colors?.primary ?? '#6366f1'}, ${t.colors?.secondary ?? '#8b5cf6'})` }}
                  />
                  <div>
                    <span className="font-medium">{t.name}</span>
                    <span className="ml-2 text-text-muted">[{t.tag}]</span>
                  </div>
                </div>
              ),
            },
            {
              key: 'players',
              header: 'Players',
              render: (t: any) => (
                <Badge variant="info">{t.players?.length ?? 0}</Badge>
              ),
              className: 'w-24',
            },
            {
              key: 'country',
              header: 'Region',
              render: (t: any) => <span className="text-text-muted">{t.country ?? '—'}</span>,
              className: 'w-24',
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
                    if (confirm(`Delete ${t.name}?`)) deleteTeam.mutate(t.id, {
                      onSuccess: () => toast('success', 'Team deleted'),
                      onError: () => toast('error', 'Failed to delete team'),
                    });
                  }}
                >
                  Delete
                </Button>
              ),
              className: 'w-20 text-right',
            },
          ]}
          data={teams ?? []}
          keyExtractor={(t: any) => t.id}
          onRowClick={(t: any) => selectTeam(selectedTeamId === t.id ? null : t.id)}
          emptyMessage=""
        />
        {(teams ?? []).length === 0 && (
          <EmptyState
            message="No teams yet — build your roster and get ready to compete."
            actionLabel="Create your first team"
            actionHref="/modules/teams/new"
          />
        )}
        </>
      )}

      {selectedTeamId && (
        <TeamCameraPanel
          teamId={selectedTeamId}
          teamName={(teams as any[])?.find((t: any) => t.id === selectedTeamId)?.name ?? 'Team'}
          onClose={() => selectTeam(null)}
        />
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Team"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.name || !form.tag || createTeam.isPending}>
              {createTeam.isPending ? 'Creating...' : 'Create'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Team Name" id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Team Liquid" />
          <Input label="Tag" id="tag" value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder="TL" maxLength={8} />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Primary" id="primary" type="color" value={form.primary} onChange={(e) => setForm({ ...form, primary: e.target.value })} />
            <Input label="Secondary" id="secondary" type="color" value={form.secondary} onChange={(e) => setForm({ ...form, secondary: e.target.value })} />
            <Input label="Accent" id="accent" type="color" value={form.accent} onChange={(e) => setForm({ ...form, accent: e.target.value })} />
          </div>
        </div>
      </Modal>
    </PageWrapper>
  );
}

const ROLES = ['TOP', 'JUNGLE', 'MID', 'BOTTOM', 'SUPPORT'] as const;

function TeamCameraPanel({
  teamId,
  teamName,
  onClose,
}: {
  teamId: string;
  teamName: string;
  onClose: () => void;
}) {
  const { data: config, isPending } = useCameraConfig(teamId);
  const updateConfig = useUpdateCameraConfig();
  const [players, setPlayers] = useState<
    Array<{ role: string; streamUrl: string; playerName: string }>
  >([]);
  const [initialized, setInitialized] = useState<string | null>(null);

  // sync from fetched config when team changes
  if (config && initialized !== teamId) {
    const c = config as any;
    setPlayers(
      ROLES.map((role) => {
        const existing = c.players?.find((p: any) => p.role === role);
        return {
          role,
          streamUrl: existing?.streamUrl ?? '',
          playerName: existing?.playerName ?? '',
        };
      }),
    );
    setInitialized(teamId);
  }

  if (!initialized && !config) {
    // first load with no existing config
    if (!isPending && initialized !== teamId) {
      setPlayers(ROLES.map((role) => ({ role, streamUrl: '', playerName: '' })));
      setInitialized(teamId);
    }
  }

  function handleSave() {
    const nonEmpty = players.filter((p) => p.streamUrl);
    updateConfig.mutate(
      { teamId, players: nonEmpty },
      {
        onSuccess: () => toast('success', 'Camera config saved'),
        onError: () => toast('error', 'Failed to save camera config'),
      },
    );
  }

  return (
    <div className="mt-6 rounded-lg border border-indigo-500/30 bg-surface-raised p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">
          Cameras — {teamName}
        </h3>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={updateConfig.isPending}
          >
            {updateConfig.isPending ? 'Saving…' : 'Save'}
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
      {isPending ? (
        <Skeleton height="80px" rounded="lg" />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          {players.map((p, i) => (
            <div key={p.role} className="rounded-md border border-border-subtle bg-surface p-3 space-y-2">
              <span className="block text-xs font-medium text-text-muted">{p.role}</span>
              <Input
                id={`cam-name-${p.role}`}
                label="Player"
                value={p.playerName}
                onChange={(e) => {
                  const next = [...players];
                  next[i] = { ...next[i], playerName: e.target.value };
                  setPlayers(next);
                }}
                placeholder="Name"
              />
              <Input
                id={`cam-url-${p.role}`}
                label="Stream URL"
                value={p.streamUrl}
                onChange={(e) => {
                  const next = [...players];
                  next[i] = { ...next[i], streamUrl: e.target.value };
                  setPlayers(next);
                }}
                placeholder="https://..."
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
