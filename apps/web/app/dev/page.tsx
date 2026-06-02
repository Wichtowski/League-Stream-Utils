'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageWrapper } from '@/_components/page-wrapper';
import { Badge } from '@/_components/badge';
import { Button } from '@/_components/button';
import { isElectron } from '@lsu/electron-bridge';

interface HealthData {
  status: string;
  uptime: number;
  timestamp: string;
  postgres: string;
  websockets: { totalClients: number; activeSessions: number };
}

export default function DevPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/health');
      const data = await res.json();
      setHealth(data);
    } catch (e: any) {
      setError(e.message ?? 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10_000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  return (
    <PageWrapper
      title="Dev Tools"
      subtitle="System status & diagnostics"
      actions={
        <Button variant="secondary" size="sm" onClick={fetchHealth} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <StatusCard title="API Health">
          {error ? (
            <Badge variant="error">Unreachable</Badge>
          ) : health ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Status</span>
                <Badge variant={health.status === 'ok' ? 'success' : 'warning'}>
                  {health.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Uptime</span>
                <span className="text-xs font-mono">{formatUptime(health.uptime)}</span>
              </div>
            </div>
          ) : (
            <span className="text-xs text-text-muted">Loading...</span>
          )}
        </StatusCard>

        <StatusCard title="PostgreSQL">
          {health ? (
            <Badge variant={health.postgres === 'connected' ? 'success' : 'error'}>
              {health.postgres}
            </Badge>
          ) : (
            <span className="text-xs text-text-muted">—</span>
          )}
        </StatusCard>

        <StatusCard title="WebSocket Connections">
          {health?.websockets ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Clients</span>
                <span className="text-sm font-medium">{health.websockets.totalClients}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Active Sessions</span>
                <span className="text-sm font-medium">{health.websockets.activeSessions}</span>
              </div>
            </div>
          ) : (
            <span className="text-xs text-text-muted">—</span>
          )}
        </StatusCard>

        <StatusCard title="Runtime">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Environment</span>
              <Badge variant={isElectron() ? 'success' : 'info'}>
                {isElectron() ? 'Electron' : 'Web'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Node Env</span>
              <span className="text-xs font-mono">{process.env.NODE_ENV ?? 'unknown'}</span>
            </div>
          </div>
        </StatusCard>
      </div>
    </PageWrapper>
  );
}

function StatusCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-raised p-4">
      <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}
