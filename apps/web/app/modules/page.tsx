'use client';

import Link from 'next/link';
import { PageWrapper } from '@/_components/page-wrapper';
import { WelcomeScreen } from './_components/welcome-screen';
import { ModuleStats } from './_components/module-stats';
import { useTeams } from '@lsu/team/hooks';
import { useTournaments } from '@lsu/tournament/hooks';

const modules = [
  { name: 'Draft', href: '/modules/draft', description: 'Manage draft sessions' },
  { name: 'Tournaments', href: '/modules/tournaments', description: 'Create & run tournaments' },
  { name: 'Teams', href: '/modules/teams', description: 'Manage rosters & staff' },
  { name: 'Cameras', href: '/modules/cameras', description: 'Configure player streams' },
  { name: 'Commentators', href: '/modules/commentators', description: 'Assign commentators' },
  { name: 'Admin', href: '/modules/admin', description: 'Users & permissions' },
] as const;

export default function ModulesPage() {
  const { data: teams, isPending: teamsPending } = useTeams();
  const { data: tournaments, isPending: tournamentsPending } = useTournaments();

  const hasData = ((teams as any[]) ?? []).length > 0 || ((tournaments as any[]) ?? []).length > 0;
  const loading = teamsPending || tournamentsPending;

  if (!loading && !hasData) {
    return (
      <PageWrapper title="Modules" subtitle="Select a module to get started">
        <WelcomeScreen />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Modules" subtitle="Select a module to get started">
      {hasData && <ModuleStats />}

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            prefetch
            className="group rounded-lg border border-border-subtle bg-surface-raised p-5 transition-all duration-150 hover:border-indigo-500/40 hover:bg-surface-overlay"
          >
            <h2 className="text-sm font-semibold group-hover:text-indigo-400 transition-colors">
              {m.name}
            </h2>
            <p className="mt-1 text-xs text-text-muted">{m.description}</p>
          </Link>
        ))}
      </div>
    </PageWrapper>
  );
}
