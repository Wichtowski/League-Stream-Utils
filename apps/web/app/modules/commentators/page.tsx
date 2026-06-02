'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageWrapper } from '@/_components/page-wrapper';
import { Button } from '@/_components/button';
import { Modal } from '@/_components/modal';
import { Input } from '@/_components/input';
import { DataTable } from '@/_components/data-table';
import { Skeleton } from '@lsu/ui/skeleton';
import { toast } from '@/_components/toast';

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function CommentatorsPage() {
  const qc = useQueryClient();
  const { data, isPending, isError } = useQuery({ queryKey: ['commentators'], queryFn: () => fetchJSON<any[]>('/api/v1/commentators') });
  const create = useMutation({
    mutationFn: (body: { name: string; socialLinks?: Record<string, string> }) =>
      fetchJSON('/api/v1/commentators', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['commentators'] });
      toast('success', 'Commentator added');
    },
    onError: () => toast('error', 'Failed to add commentator'),
  });
  const remove = useMutation({
    mutationFn: (id: string) => fetchJSON(`/api/v1/commentators/${id}`, { method: 'DELETE' }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['commentators'] });
      const previous = qc.getQueryData(['commentators']);
      qc.setQueryData(['commentators'], (old: any[] | undefined) => (old ?? []).filter((c: any) => c.id !== id));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(['commentators'], context.previous);
      toast('error', 'Failed to delete commentator');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['commentators'] }),
  });

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [twitter, setTwitter] = useState('');

  function handleCreate() {
    const socialLinks: Record<string, string> = {};
    if (twitter) socialLinks.twitter = twitter;
    create.mutate({ name, socialLinks: Object.keys(socialLinks).length ? socialLinks : undefined }, {
      onSuccess: () => { setShowCreate(false); setName(''); setTwitter(''); },
    });
  }

  return (
    <PageWrapper
      title="Commentators"
      subtitle="Manage broadcast talent"
      actions={<Button onClick={() => setShowCreate(true)}>Add Commentator</Button>}
    >
      {isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height="56px" rounded="lg" />)}
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">Failed to load commentators</div>
      ) : (
        <DataTable
          columns={[
            { key: 'name', header: 'Name', render: (c: any) => <span className="font-medium">{c.name}</span> },
            {
              key: 'social',
              header: 'Social',
              render: (c: any) => {
                const links = c.socialLinks as Record<string, string> | null;
                if (!links || Object.keys(links).length === 0) return <span className="text-text-muted">—</span>;
                return <span className="text-text-muted text-xs">{Object.entries(links).map(([k, v]) => `${k}: ${v}`).join(', ')}</span>;
              },
            },
            {
              key: 'actions',
              header: '',
              render: (c: any) => (
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); if (confirm(`Delete ${c.name}?`)) remove.mutate(c.id); }}>
                  Delete
                </Button>
              ),
              className: 'w-20 text-right',
            },
          ]}
          data={data ?? []}
          keyExtractor={(c: any) => c.id}
          emptyMessage="No commentators yet — add broadcast talent to assign them to matches."
        />
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Add Commentator"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!name || create.isPending}>
              {create.isPending ? 'Adding...' : 'Add'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Name" id="c-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
          <Input label="Twitter (optional)" id="c-twitter" value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="@handle" />
        </div>
      </Modal>
    </PageWrapper>
  );
}
