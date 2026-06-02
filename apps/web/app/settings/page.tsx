'use client';

import { useState, useEffect } from 'react';
import { PageWrapper } from '@/_components/page-wrapper';
import { Button } from '@/_components/button';
import { Badge } from '@/_components/badge';
import { isElectron } from '@lsu/electron-bridge';
import type { AssetTreeNode } from '@lsu/electron-bridge';
import {
  useElectronStore,
  useOBSElectron,
  useBackupStore,
  useSyncStore,
} from '@lsu/electron-bridge/hooks';
import { Input } from '@/_components/input';

type Tab = 'general' | 'assets' | 'obs' | 'backups' | 'sync';

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export default function SettingsPage() {
  const electron = isElectron();
  const [tab, setTab] = useState<Tab>('general');

  const tabs: { id: Tab; label: string; electronOnly?: boolean }[] = [
    { id: 'general', label: 'General' },
    { id: 'assets', label: 'Game Assets', electronOnly: true },
    { id: 'obs', label: 'OBS', electronOnly: true },
    { id: 'backups', label: 'Backups', electronOnly: true },
    { id: 'sync', label: 'Cloud Sync', electronOnly: true },
  ];

  const visibleTabs = tabs.filter((t) => !t.electronOnly || electron);

  return (
    <PageWrapper title="Settings" subtitle="Manage your preferences">
      <div className="flex gap-2 border-b border-border-subtle pb-3 mb-6">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              tab === t.id
                ? 'bg-gradient-to-r from-indigo-500/15 to-violet-500/10 text-indigo-400'
                : 'text-text-muted hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'general' && <GeneralTab />}
      {tab === 'assets' && electron && <AssetsTab />}
      {tab === 'obs' && electron && <OBSTab />}
      {tab === 'backups' && electron && <BackupsTab />}
      {tab === 'sync' && electron && <SyncTab />}
    </PageWrapper>
  );
}

function GeneralTab() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border-subtle bg-surface-raised p-4">
        <h3 className="text-sm font-medium mb-1">Environment</h3>
        <div className="flex items-center gap-2">
          <Badge variant={isElectron() ? 'success' : 'info'}>
            {isElectron() ? 'Desktop (Electron)' : 'Web'}
          </Badge>
        </div>
      </div>
      <div className="rounded-lg border border-border-subtle bg-surface-raised p-4">
        <h3 className="text-sm font-medium mb-1">Theme</h3>
        <p className="text-xs text-text-muted">Dark theme is currently the only option.</p>
      </div>
    </div>
  );
}

function AssetsTab() {
  const {
    cacheStats,
    assetTree,
    integrityResults,
    loading,
    refreshCacheStats,
    refreshAssetTree,
    runIntegrityCheck,
    clearCache,
  } = useElectronStore();

  useEffect(() => {
    refreshCacheStats();
    refreshAssetTree();
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border-subtle bg-surface-raised p-4">
        <h3 className="text-sm font-medium mb-3">Asset Cache</h3>
        {cacheStats ? (
          <div className="flex gap-6 text-sm mb-3">
            <div>
              <span className="text-text-muted">Files:</span>{' '}
              <span className="font-medium">{cacheStats.totalFiles}</span>
            </div>
            <div>
              <span className="text-text-muted">Size:</span>{' '}
              <span className="font-medium">{formatBytes(cacheStats.totalSize)}</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-text-muted mb-3">Loading...</p>
        )}
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              refreshCacheStats();
              refreshAssetTree();
            }}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button variant="secondary" size="sm" onClick={clearCache} disabled={loading}>
            Clear Cache
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border-subtle bg-surface-raised p-4">
        <h3 className="text-sm font-medium mb-3">Folder Structure</h3>
        {assetTree && assetTree.length > 0 ? (
          <div className="max-h-80 overflow-y-auto rounded-md border border-border-subtle bg-surface p-2 font-mono text-xs">
            {assetTree.map((node) => (
              <TreeNodeView key={node.name} node={node} depth={0} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-text-muted">No assets downloaded yet.</p>
        )}
      </div>

      <div className="rounded-lg border border-border-subtle bg-surface-raised p-4">
        <h3 className="text-sm font-medium mb-3">Integrity Check</h3>
        {integrityResults ? (
          <div className="flex gap-6 text-sm mb-3">
            <div>
              <Badge variant="success">{integrityResults.valid} valid</Badge>
            </div>
            <div>
              <Badge variant="error">{integrityResults.corrupted} corrupted</Badge>
            </div>
            <div>
              <Badge variant="warning">{integrityResults.missing} missing</Badge>
            </div>
          </div>
        ) : (
          <p className="text-xs text-text-muted mb-3">Run a check to scan asset files.</p>
        )}
        <Button variant="secondary" size="sm" onClick={runIntegrityCheck} disabled={loading}>
          {loading ? 'Checking...' : 'Run Check'}
        </Button>
      </div>
    </div>
  );
}

function TreeNodeView({ node, depth }: { node: AssetTreeNode; depth: number }) {
  const [expanded, setExpanded] = useState(depth < 1);
  const isDir = node.type === 'directory';
  const childCount = isDir ? (node.children?.length ?? 0) : 0;

  return (
    <div>
      <button
        onClick={() => isDir && setExpanded((v) => !v)}
        className={`flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left transition-colors hover:bg-surface-overlay ${isDir ? 'cursor-pointer' : 'cursor-default'}`}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        {isDir ? (
          <span className={`text-text-muted transition-transform ${expanded ? 'rotate-90' : ''}`}>
            ▸
          </span>
        ) : (
          <span className="text-text-muted opacity-0">▸</span>
        )}
        <span className={isDir ? 'text-indigo-400' : 'text-gray-300'}>{node.name}</span>
        {isDir && <span className="text-text-muted ml-1">({childCount})</span>}
        {!isDir && node.size != null && (
          <span className="ml-auto text-text-muted">{formatBytes(node.size)}</span>
        )}
      </button>
      {isDir &&
        expanded &&
        node.children?.map((child) => (
          <TreeNodeView key={child.name} node={child} depth={depth + 1} />
        ))}
    </div>
  );
}

function OBSTab() {
  const { connected, scenes, currentScene, connecting, error, connect, disconnect, switchScene } =
    useOBSElectron();
  const [url, setUrl] = useState('ws://localhost:4455');
  const [password, setPassword] = useState('');

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border-subtle bg-surface-raised p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Connection</h3>
          <Badge variant={connected ? 'success' : 'default'}>
            {connected ? 'Connected' : connecting ? 'Connecting...' : 'Disconnected'}
          </Badge>
        </div>
        {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
        {!connected ? (
          <div className="space-y-3">
            <Input
              label="WebSocket URL"
              id="obs-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Input
              label="Password"
              id="obs-pw"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              size="sm"
              onClick={() => connect(url, password || undefined)}
              disabled={connecting}
            >
              {connecting ? 'Connecting...' : 'Connect'}
            </Button>
          </div>
        ) : (
          <Button variant="secondary" size="sm" onClick={disconnect}>
            Disconnect
          </Button>
        )}
      </div>

      {connected && (
        <div className="rounded-lg border border-border-subtle bg-surface-raised p-4">
          <h3 className="text-sm font-medium mb-3">Scenes</h3>
          <div className="grid grid-cols-3 gap-2">
            {(scenes as any[]).map((s: any) => {
              const name = s.sceneName ?? s;
              const active = name === currentScene;
              return (
                <button
                  key={name}
                  onClick={() => switchScene(name)}
                  className={`rounded-md px-3 py-2 text-sm transition-colors border ${
                    active
                      ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400'
                      : 'border-border-subtle bg-surface hover:bg-surface-overlay text-text-muted'
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function BackupsTab() {
  const { backups, loading, refreshBackups, createBackup, restoreBackup, deleteBackup } =
    useBackupStore();

  useEffect(() => {
    refreshBackups();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Database Backups</h3>
        <Button size="sm" onClick={createBackup} disabled={loading}>
          Create Backup
        </Button>
      </div>

      {backups.length === 0 ? (
        <div className="rounded-lg border border-border-subtle bg-surface-raised p-8 text-center text-sm text-text-muted">
          No backups yet
        </div>
      ) : (
        <div className="space-y-2">
          {backups.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-raised px-4 py-3"
            >
              <span className="text-sm font-mono text-text-muted">{b.id}</span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => restoreBackup(b.id)}
                  disabled={loading}
                >
                  Restore
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm('Delete this backup?')) deleteBackup(b.id);
                  }}
                  disabled={loading}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SyncTab() {
  const { status, syncing, lastResult, refreshStatus, fullSync, push, pull, resetSync } =
    useSyncStore();

  useEffect(() => {
    refreshStatus();
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border-subtle bg-surface-raised p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Cloud Sync (Pro)</h3>
          <Badge variant={syncing ? 'warning' : status?.lastSyncedAt ? 'success' : 'default'}>
            {syncing ? 'Syncing...' : status?.lastSyncedAt ? 'Active' : 'Never synced'}
          </Badge>
        </div>

        <div className="space-y-2 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-text-muted">Last sync</span>
            <span>
              {status?.lastSyncedAt ? new Date(status.lastSyncedAt).toLocaleString() : 'Never'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Pending changes</span>
            <span className={status?.pendingChanges ? 'text-amber-300' : ''}>
              {status?.pendingChanges ?? 0}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={() => fullSync()} disabled={syncing}>
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => push()} disabled={syncing}>
            Push Only
          </Button>
          <Button variant="secondary" size="sm" onClick={() => pull()} disabled={syncing}>
            Pull Only
          </Button>
        </div>
      </div>

      {lastResult && (
        <div className="rounded-lg border border-border-subtle bg-surface-raised p-4">
          <h3 className="text-sm font-medium mb-3">Last Sync Result</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-semibold text-emerald-400">{lastResult.pushed}</p>
              <p className="text-xs text-text-muted">Pushed</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-indigo-400">{lastResult.pulled}</p>
              <p className="text-xs text-text-muted">Pulled</p>
            </div>
            <div>
              <p
                className={`text-lg font-semibold ${lastResult.conflicts > 0 ? 'text-amber-400' : 'text-text-muted'}`}
              >
                {lastResult.conflicts}
              </p>
              <p className="text-xs text-text-muted">Conflicts</p>
            </div>
          </div>
          {lastResult.errors.length > 0 && (
            <div className="mt-3 rounded-md border border-red-500/30 bg-red-500/10 p-2">
              {lastResult.errors.map((e, i) => (
                <p key={i} className="text-xs text-red-400">
                  {e}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border border-border-subtle bg-surface-raised p-4">
        <h3 className="text-sm font-medium mb-2">Danger Zone</h3>
        <p className="text-xs text-text-muted mb-3">
          Reset sync metadata to start fresh. Your local data is preserved.
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (confirm('Reset all sync metadata?')) resetSync();
          }}
        >
          Reset Sync
        </Button>
      </div>
    </div>
  );
}
