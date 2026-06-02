'use client';

import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/_components/badge';
import { Skeleton } from '@lsu/ui/skeleton';

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

interface HealthData {
  status: 'healthy' | 'degraded';
  checks: Record<string, { status: string; detail?: string }>;
  stats: {
    users: number;
    tournaments: number;
    teams: number;
    activeSessions: number;
  };
  runtime: {
    nodeVersion: string;
    uptime: number;
    memoryUsage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
  };
}

function formatBytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function SystemTab() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['admin', 'system', 'health'],
    queryFn: () => fetchJSON<HealthData>('/api/v1/admin/system/health'),
    refetchInterval: 30_000,
  });

  if (isPending) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} height="120px" rounded="lg" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
        Failed to load system health
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-medium">System Status</h3>
        <Badge variant={data.status === 'healthy' ? 'success' : 'warning'}>{data.status}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Section title="Service Checks">
          {Object.entries(data.checks).map(([name, check]) => (
            <div key={name} className="flex items-center justify-between py-1.5">
              <span className="text-sm capitalize">{name}</span>
              <Badge variant={check.status === 'ok' ? 'success' : 'error'}>{check.status}</Badge>
            </div>
          ))}
        </Section>

        <Section title="Database Stats">
          <StatRow label="Users" value={data.stats.users} />
          <StatRow label="Tournaments" value={data.stats.tournaments} />
          <StatRow label="Teams" value={data.stats.teams} />
          <StatRow label="Active Sessions" value={data.stats.activeSessions} />
        </Section>

        <Section title="Runtime">
          <StatRow label="Node Version" value={data.runtime.nodeVersion} />
          <StatRow label="Uptime" value={formatUptime(data.runtime.uptime)} />
        </Section>

        <Section title="Memory">
          <StatRow label="RSS" value={formatBytes(data.runtime.memoryUsage.rss)} />
          <StatRow label="Heap Total" value={formatBytes(data.runtime.memoryUsage.heapTotal)} />
          <StatRow label="Heap Used" value={formatBytes(data.runtime.memoryUsage.heapUsed)} />
          <StatRow label="External" value={formatBytes(data.runtime.memoryUsage.external)} />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-raised p-4">
      <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-text-muted">{title}</h4>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-text-muted">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
