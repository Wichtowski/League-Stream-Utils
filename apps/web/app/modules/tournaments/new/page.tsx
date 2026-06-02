'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageWrapper } from '@/_components/page-wrapper';
import { Button } from '@/_components/button';
import { Input, Textarea, Select } from '@/_components/input';
import { Badge } from '@/_components/badge';
import { toast } from '@/_components/toast';
import { useTeams } from '@lsu/team/hooks';
import { Breadcrumbs } from '@/_components/breadcrumbs';

interface TournamentForm {
  name: string;
  description: string;
  type: 'ladder' | 'swiss' | 'round_robin' | 'groups';
  format: 'bo1' | 'bo3' | 'bo5';
  startDate: string;
  endDate: string;
  teamIds: string[];
}

const INITIAL: TournamentForm = {
  name: '',
  description: '',
  type: 'ladder',
  format: 'bo3',
  startDate: '',
  endDate: '',
  teamIds: [],
};

const STEPS = ['Info', 'Format', 'Teams', 'Review'] as const;

const TYPE_INFO: Record<string, { label: string; description: string }> = {
  ladder: { label: 'Ladder', description: 'Single/double elimination bracket. Teams are seeded and play in a knockout format.' },
  swiss: { label: 'Swiss', description: 'Teams play N rounds, matched by record. No team is eliminated until the final standings.' },
  round_robin: { label: 'Round Robin', description: 'Everyone plays everyone. Final standings by wins.' },
  groups: { label: 'Groups', description: 'Group stage followed by knockout. Split into groups, top teams advance.' },
};

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function TournamentWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<TournamentForm>(INITIAL);
  const [submitting, setSubmitting] = useState(false);

  const canNext =
    step === 0 ? form.name.length >= 2 :
    step === 1 ? true :
    step === 2 ? form.teamIds.length >= 2 :
    true;

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const tournament: any = await fetchJSON('/api/v1/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          type: form.type,
          format: form.format,
          description: form.description || undefined,
          startDate: form.startDate || undefined,
          endDate: form.endDate || undefined,
        }),
      });

      for (const teamId of form.teamIds) {
        await fetchJSON(`/api/v1/tournaments/${tournament.id}/teams`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamId }),
        });
      }

      toast('success', 'Tournament created!');
      router.push('/modules/tournaments');
    } catch (e: any) {
      toast('error', e.message ?? 'Failed to create tournament');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageWrapper title="Create Tournament" subtitle={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`}>
      <Breadcrumbs items={[
        { label: 'Tournaments', href: '/modules/tournaments' },
        { label: 'New Tournament' },
      ]} />
      <div className="mb-6 flex gap-1">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= step ? 'bg-violet-500' : 'bg-surface-raised'
            }`}
          />
        ))}
      </div>

      <div className="mx-auto max-w-lg space-y-6">
        {step === 0 && <StepInfo form={form} setForm={setForm} />}
        {step === 1 && <StepFormat form={form} setForm={setForm} />}
        {step === 2 && <StepTeams form={form} setForm={setForm} />}
        {step === 3 && <StepReview form={form} />}

        <div className="flex justify-between pt-4">
          <Button
            variant="secondary"
            onClick={() => (step === 0 ? router.back() : setStep(step - 1))}
          >
            {step === 0 ? 'Cancel' : 'Back'}
          </Button>

          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Tournament'}
            </Button>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}

function StepInfo({ form, setForm }: { form: TournamentForm; setForm: (f: TournamentForm) => void }) {
  return (
    <div className="space-y-4">
      <Input
        label="Tournament Name"
        id="tname"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="Summer Split 2026"
      />
      <Textarea
        label="Description (optional)"
        id="tdesc"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="Open tournament for all amateur teams..."
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Start Date"
          id="tstart"
          type="date"
          value={form.startDate}
          onChange={(e) => setForm({ ...form, startDate: e.target.value })}
        />
        <Input
          label="End Date"
          id="tend"
          type="date"
          value={form.endDate}
          onChange={(e) => setForm({ ...form, endDate: e.target.value })}
        />
      </div>
    </div>
  );
}

function StepFormat({ form, setForm }: { form: TournamentForm; setForm: (f: TournamentForm) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-medium text-text-muted">Tournament Type</p>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(TYPE_INFO).map(([key, info]) => (
            <button
              key={key}
              onClick={() => setForm({ ...form, type: key as TournamentForm['type'] })}
              className={`rounded-lg border p-4 text-left transition-all ${
                form.type === key
                  ? 'border-violet-500/60 bg-violet-500/10'
                  : 'border-border-subtle bg-surface-raised hover:border-gray-600'
              }`}
            >
              <span className="block text-sm font-medium">{info.label}</span>
              <span className="mt-1 block text-xs text-text-muted">{info.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-text-muted">Match Format</p>
        <div className="flex gap-3">
          {(['bo1', 'bo3', 'bo5'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setForm({ ...form, format: f })}
              className={`flex-1 rounded-lg border px-4 py-3 text-center transition-all ${
                form.format === f
                  ? 'border-violet-500/60 bg-violet-500/10'
                  : 'border-border-subtle bg-surface-raised hover:border-gray-600'
              }`}
            >
              <span className="block text-sm font-semibold">{f.toUpperCase()}</span>
              <span className="block text-xs text-text-muted">
                {f === 'bo1' ? 'Single game' : f === 'bo3' ? 'First to 2' : 'First to 3'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepTeams({ form, setForm }: { form: TournamentForm; setForm: (f: TournamentForm) => void }) {
  const { data: teams, isPending } = useTeams();

  function toggleTeam(id: string) {
    setForm({
      ...form,
      teamIds: form.teamIds.includes(id)
        ? form.teamIds.filter((t) => t !== id)
        : [...form.teamIds, id],
    });
  }

  if (isPending) {
    return <p className="text-sm text-text-muted">Loading teams…</p>;
  }

  if (!teams || (teams as any[]).length === 0) {
    return (
      <div className="rounded-lg border border-border-subtle bg-surface-raised p-8 text-center">
        <p className="text-sm text-text-muted mb-3">No teams available. Create teams first.</p>
        <Button size="sm" onClick={() => window.open('/modules/teams/new', '_blank')}>
          Create Team
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-muted">Select at least 2 teams. Order determines seeding.</p>
      {(teams as any[]).map((t: any) => {
        const selected = form.teamIds.includes(t.id);
        const seedIndex = form.teamIds.indexOf(t.id);
        return (
          <button
            key={t.id}
            onClick={() => toggleTeam(t.id)}
            className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
              selected
                ? 'border-violet-500/60 bg-violet-500/10'
                : 'border-border-subtle bg-surface-raised hover:border-gray-600'
            }`}
          >
            <div
              className="h-8 w-8 rounded-md flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${t.colors?.primary ?? '#6366f1'}, ${t.colors?.secondary ?? '#8b5cf6'})`,
              }}
            />
            <div className="flex-1">
              <span className="font-medium">{t.name}</span>
              <span className="ml-2 text-text-muted">[{t.tag}]</span>
            </div>
            {selected && (
              <Badge variant="info">Seed #{seedIndex + 1}</Badge>
            )}
          </button>
        );
      })}

      {form.teamIds.length < 2 && (
        <p className="text-center text-xs text-text-muted">Select at least 2 teams to continue</p>
      )}
    </div>
  );
}

function StepReview({ form }: { form: TournamentForm }) {
  const { data: teams } = useTeams();
  const teamMap = new Map((teams as any[] ?? []).map((t: any) => [t.id, t]));

  return (
    <div className="rounded-lg border border-border-subtle bg-surface-raised p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-lg">{form.name}</h3>
        {form.description && <p className="mt-1 text-sm text-text-muted">{form.description}</p>}
      </div>

      <div className="flex gap-3">
        <Badge variant="info">{TYPE_INFO[form.type]?.label}</Badge>
        <Badge variant="info">{form.format.toUpperCase()}</Badge>
        {form.startDate && (
          <span className="text-xs text-text-muted">
            {form.startDate}{form.endDate ? ` — ${form.endDate}` : ''}
          </span>
        )}
      </div>

      <div>
        <h4 className="text-xs font-medium uppercase tracking-wider text-text-muted mb-2">
          Teams ({form.teamIds.length})
        </h4>
        <div className="space-y-1">
          {form.teamIds.map((id, i) => {
            const t = teamMap.get(id);
            return (
              <div key={id} className="flex items-center gap-2 text-sm">
                <span className="w-6 text-xs text-text-muted">#{i + 1}</span>
                {t ? (
                  <>
                    <div
                      className="h-5 w-5 rounded"
                      style={{
                        background: `linear-gradient(135deg, ${t.colors?.primary ?? '#6366f1'}, ${t.colors?.secondary ?? '#8b5cf6'})`,
                      }}
                    />
                    <span>{t.name}</span>
                    <span className="text-text-muted">[{t.tag}]</span>
                  </>
                ) : (
                  <span className="text-text-muted">{id}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
