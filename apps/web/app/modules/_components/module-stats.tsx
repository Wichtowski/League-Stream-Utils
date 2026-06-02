'use client';

import { useQuery } from '@tanstack/react-query';

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function ModuleStats() {
  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: () => fetchJSON<any[]>('/api/v1/teams'),
  });

  const { data: tournaments } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => fetchJSON<any[]>('/api/v1/tournaments'),
  });

  const teamCount = teams?.length ?? 0;
  const tournamentCount = tournaments?.length ?? 0;
  const activeTournaments = tournaments?.filter((t: any) => t.status === 'active').length ?? 0;

  return (
    <div className="grid grid-cols-3 gap-3">
      <StatCard label="Teams" value={teamCount} />
      <StatCard label="Active Tournaments" value={activeTournaments} />
      <StatCard label="Total Tournaments" value={tournamentCount} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-raised p-4">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-text-muted">{label}</p>
    </div>
  );
}
