import fs from 'node:fs/promises';
import path from 'node:path';
import { app } from 'electron';
import { readConfig } from '../ipc/util';

const SYNCED_TABLES = [
  'teams',
  'players',
  'staff',
  'tournaments',
  'tournament_teams',
  'brackets',
  'matches',
  'match_games',
  'commentators',
  'match_commentators',
  'tournament_permissions',
] as const;

export interface SyncResult {
  pushed: number;
  pulled: number;
  conflicts: number;
  errors: string[];
}

export interface SyncStatus {
  lastSyncedAt: string | null;
  pendingChanges: number;
  isOnline: boolean;
}

export interface SyncProgress {
  stage: 'pushing' | 'pulling' | 'complete' | 'error';
  table: string;
  current: number;
  total: number;
  detail: string;
}

function getSyncMetaPath() {
  return path.join(app.getPath('userData'), 'sync-meta.json');
}

function getSyncLogPath() {
  return path.join(app.getPath('userData'), 'data', 'sync-log.json');
}

async function readSyncMeta(): Promise<{
  lastSyncedAt: string | null;
  idMappings: Record<string, string>;
}> {
  try {
    const raw = await fs.readFile(getSyncMetaPath(), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { lastSyncedAt: null, idMappings: {} };
  }
}

async function writeSyncMeta(meta: { lastSyncedAt: string | null; idMappings: Record<string, string> }) {
  await fs.writeFile(getSyncMetaPath(), JSON.stringify(meta, null, 2));
}

async function readSyncLog(): Promise<
  { table: string; action: string; record_id: string; data: Record<string, unknown>; created_at: string; synced_at: string | null }[]
> {
  try {
    const raw = await fs.readFile(getSyncLogPath(), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeSyncLog(log: unknown[]) {
  const dir = path.dirname(getSyncLogPath());
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(getSyncLogPath(), JSON.stringify(log, null, 2));
}

async function readCollection(name: string): Promise<Record<string, unknown>[]> {
  const filePath = path.join(app.getPath('userData'), 'data', `${name}.json`);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeCollection(name: string, data: Record<string, unknown>[]) {
  const dir = path.join(app.getPath('userData'), 'data');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, `${name}.json`), JSON.stringify(data, null, 2));
}

async function getServerUrl(): Promise<string> {
  const cfg = await readConfig();
  return (cfg.serverUrl as string) || 'http://localhost:3000';
}

async function getAccessToken(): Promise<string | null> {
  const cfg = await readConfig();
  return (cfg.accessToken as string) || null;
}

export class SyncManager {
  private progressCallback: ((progress: SyncProgress) => void) | null = null;

  onProgress(cb: (progress: SyncProgress) => void) {
    this.progressCallback = cb;
  }

  private emit(progress: SyncProgress) {
    this.progressCallback?.(progress);
  }

  async getStatus(): Promise<SyncStatus> {
    const meta = await readSyncMeta();
    const log = await readSyncLog();
    const pending = log.filter((e) => !e.synced_at).length;
    const token = await getAccessToken();

    return {
      lastSyncedAt: meta.lastSyncedAt,
      pendingChanges: pending,
      isOnline: !!token,
    };
  }

  async push(): Promise<SyncResult> {
    const result: SyncResult = { pushed: 0, pulled: 0, conflicts: 0, errors: [] };
    const log = await readSyncLog();
    const meta = await readSyncMeta();
    const pending = log.filter((e) => !e.synced_at);

    if (pending.length === 0) return result;

    const serverUrl = await getServerUrl();
    const token = await getAccessToken();
    if (!token) {
      result.errors.push('Not authenticated');
      return result;
    }

    const changes = pending.map((entry) => ({
      table: entry.table,
      action: entry.action as 'insert' | 'update' | 'delete',
      data: entry.data,
      local_id: entry.record_id,
      updated_at: entry.created_at,
    }));

    this.emit({ stage: 'pushing', table: 'all', current: 0, total: changes.length, detail: `Pushing ${changes.length} changes` });

    try {
      const res = await fetch(`${serverUrl}/api/v1/sync/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `access_token=${token}`,
        },
        body: JSON.stringify({ changes }),
      });

      if (!res.ok) {
        const text = await res.text();
        result.errors.push(`Push failed: ${text}`);
        this.emit({ stage: 'error', table: '', current: 0, total: 0, detail: text });
        return result;
      }

      const body = await res.json() as {
        applied: number;
        conflicts: { table: string; local_id: string; cloud_id: string; resolution: string }[];
        id_mappings: { local_id: string; cloud_id: string; table: string }[];
      };

      result.pushed = body.applied;
      result.conflicts = body.conflicts.length;

      for (const mapping of body.id_mappings) {
        meta.idMappings[`${mapping.table}:${mapping.local_id}`] = mapping.cloud_id;
      }

      const now = new Date().toISOString();
      for (const entry of pending) {
        entry.synced_at = now;
      }
      await writeSyncLog(log);
      meta.lastSyncedAt = now;
      await writeSyncMeta(meta);

      this.emit({ stage: 'pushing', table: 'all', current: changes.length, total: changes.length, detail: `Pushed ${body.applied} changes` });
    } catch (err: any) {
      result.errors.push(err.message);
      this.emit({ stage: 'error', table: '', current: 0, total: 0, detail: err.message });
    }

    return result;
  }

  async pull(): Promise<SyncResult> {
    const result: SyncResult = { pushed: 0, pulled: 0, conflicts: 0, errors: [] };
    const meta = await readSyncMeta();
    const serverUrl = await getServerUrl();
    const token = await getAccessToken();

    if (!token) {
      result.errors.push('Not authenticated');
      return result;
    }

    this.emit({ stage: 'pulling', table: 'all', current: 0, total: SYNCED_TABLES.length, detail: 'Pulling changes from cloud' });

    try {
      const res = await fetch(`${serverUrl}/api/v1/sync/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `access_token=${token}`,
        },
        body: JSON.stringify({
          last_synced_at: meta.lastSyncedAt,
          tables: [...SYNCED_TABLES],
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        result.errors.push(`Pull failed: ${text}`);
        this.emit({ stage: 'error', table: '', current: 0, total: 0, detail: text });
        return result;
      }

      const body = await res.json() as {
        changes: { table: string; action: string; data: Record<string, unknown>; updated_at: string }[];
        sync_timestamp: string;
      };

      for (let i = 0; i < body.changes.length; i++) {
        const change = body.changes[i];
        const collection = await readCollection(change.table);

        const existingIndex = collection.findIndex(
          (r) => r.id === (change.data as any).id,
        );

        if (existingIndex >= 0) {
          const existing = collection[existingIndex];
          const cloudTime = new Date(change.updated_at).getTime();
          const localTime = new Date((existing.updated_at as string) ?? 0).getTime();

          if (cloudTime > localTime) {
            collection[existingIndex] = change.data;
            result.pulled++;
          } else {
            result.conflicts++;
          }
        } else {
          collection.push(change.data);
          result.pulled++;
        }

        await writeCollection(change.table, collection);

        this.emit({
          stage: 'pulling',
          table: change.table,
          current: i + 1,
          total: body.changes.length,
          detail: `Pulled ${change.table}`,
        });
      }

      meta.lastSyncedAt = body.sync_timestamp;
      await writeSyncMeta(meta);
    } catch (err: any) {
      result.errors.push(err.message);
      this.emit({ stage: 'error', table: '', current: 0, total: 0, detail: err.message });
    }

    return result;
  }

  async fullSync(): Promise<SyncResult> {
    const pushResult = await this.push();
    const pullResult = await this.pull();

    this.emit({ stage: 'complete', table: '', current: 0, total: 0, detail: 'Sync complete' });

    return {
      pushed: pushResult.pushed,
      pulled: pullResult.pulled,
      conflicts: pushResult.conflicts + pullResult.conflicts,
      errors: [...pushResult.errors, ...pullResult.errors],
    };
  }

  async resetSync(): Promise<void> {
    try {
      await fs.unlink(getSyncMetaPath());
    } catch {}
    try {
      await fs.unlink(getSyncLogPath());
    } catch {}
  }
}
