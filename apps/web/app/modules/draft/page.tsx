'use client';

import { useState } from 'react';
import { PageWrapper } from '@/_components/page-wrapper';
import { Button } from '@/_components/button';
import { Badge } from '@/_components/badge';
import { Modal } from '@/_components/modal';
import { DataTable } from '@/_components/data-table';
import { usedraftSessions, useCreatedraftSession, useDeletedraftSession } from '@lsu/draft/hooks';
import { Skeleton } from '@lsu/ui/skeleton';

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'info'> = {
  waiting: 'default',
  active: 'success',
  paused: 'warning',
  completed: 'info',
};

export default function draftPage() {
  const { data: sessions, isPending, isError } = usedraftSessions();
  const createSession = useCreatedraftSession();
  const deleteSession = useDeletedraftSession();
  const [showCreate, setShowCreate] = useState(false);

  function handleQuickCreate() {
    createSession.mutate(
      {
        config: {
          seriesType: 'bo3',
          currentGame: 1,
          totalGames: 3,
          isFearlessDraft: false,
          patchName: 'latest',
          timers: { pickPhase: 30, banPhase: 30 },
        },
        teams: {
          blue: { name: 'Blue Side' },
          red: { name: 'Red Side' },
        },
      },
      { onSuccess: () => setShowCreate(false) },
    );
  }

  return (
    <PageWrapper
      title="Draft"
      subtitle="Create and manage draft sessions"
      actions={<Button onClick={() => setShowCreate(true)}>New Session</Button>}
    >
      {isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height="56px" rounded="lg" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          Failed to load sessions
        </div>
      ) : (
        <DataTable
          columns={[
            {
              key: 'teams',
              header: 'Match',
              render: (s: any) => (
                <div className="flex items-center gap-2">
                  <span className="text-blue-400">{s.teams?.blue?.name ?? 'Blue'}</span>
                  <span className="text-text-muted">vs</span>
                  <span className="text-red-400">{s.teams?.red?.name ?? 'Red'}</span>
                </div>
              ),
            },
            {
              key: 'phase',
              header: 'Phase',
              render: (s: any) => <span className="text-text-muted capitalize">{s.currentPhase}</span>,
              className: 'w-28',
            },
            {
              key: 'turn',
              header: 'Turn',
              render: (s: any) => <span className="text-text-muted">{s.turnNumber}/22</span>,
              className: 'w-20',
            },
            {
              key: 'status',
              header: 'Status',
              render: (s: any) => <Badge variant={statusVariant[s.status] ?? 'default'}>{s.status}</Badge>,
              className: 'w-28',
            },
            {
              key: 'actions',
              header: '',
              render: (s: any) => (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this session?')) deleteSession.mutate(s.sessionId);
                  }}
                >
                  Delete
                </Button>
              ),
              className: 'w-20 text-right',
            },
          ]}
          data={sessions ?? []}
          keyExtractor={(s: any) => s.sessionId ?? s._id}
          emptyMessage="No draft sessions — create one to get started"
        />
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Draft Session"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleQuickCreate} disabled={createSession.isPending}>
              {createSession.isPending ? 'Creating...' : 'Quick Create'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-muted">
          Creates a standard BO3 draft session with default 30s timers. You can configure teams and settings after creation.
        </p>
      </Modal>
    </PageWrapper>
  );
}
