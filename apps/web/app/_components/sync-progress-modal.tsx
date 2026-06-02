'use client';

import { useEffect } from 'react';
import { isElectron } from '@lsu/electron-bridge';
import { useSyncStore } from '@lsu/electron-bridge/hooks';

const stageLabels: Record<string, string> = {
  pushing: 'Pushing to cloud',
  pulling: 'Pulling from cloud',
  complete: 'Sync complete',
  error: 'Sync failed',
};

const stageColors: Record<string, string> = {
  pushing: 'from-indigo-500 to-violet-500',
  pulling: 'from-cyan-500 to-blue-500',
  complete: 'from-emerald-500 to-green-500',
  error: 'from-red-500 to-pink-500',
};

export function SyncProgressModal() {
  const { syncing, progress } = useSyncStore();
  const subscribe = useSyncStore((s) => s.subscribe);

  useEffect(() => {
    if (!isElectron()) return;
    const unsub = subscribe();
    return unsub;
  }, [subscribe]);

  if (!syncing || !progress) return null;
  if (progress.stage === 'complete') return null;

  const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-border-subtle bg-surface-raised p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className={`h-3 w-3 rounded-full animate-pulse bg-gradient-to-r ${stageColors[progress.stage] ?? stageColors.pushing}`} />
          <h3 className="text-sm font-medium text-gray-100">
            {stageLabels[progress.stage] ?? 'Syncing...'}
          </h3>
        </div>

        <div className="mb-3">
          <div className="flex justify-between text-xs text-text-muted mb-1">
            <span>{progress.detail}</span>
            <span>{percentage}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-surface-overlay overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r transition-all duration-300 ${stageColors[progress.stage] ?? stageColors.pushing}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {progress.table && (
          <p className="text-[11px] text-text-muted">
            Table: <span className="font-mono text-gray-300">{progress.table}</span>
          </p>
        )}

        {progress.stage === 'error' && (
          <div className="mt-3 rounded-md border border-red-500/30 bg-red-500/10 p-2">
            <p className="text-xs text-red-400">{progress.detail}</p>
          </div>
        )}
      </div>
    </div>
  );
}
