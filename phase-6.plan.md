# Phase 6: Cloud Sync (Pro Plan)

## Overview

Allow Pro users to sync their offline SQLite data to the cloud Postgres database.
This bridges the gap between offline and online modes — users can work locally
and push changes to the cloud when ready.

---

## Prerequisites

- Phase 1 complete (Kysely, SQLite working offline)
- Phase 2 complete (plan flag on users, `pro` plan exists)
- User has a Pro account AND has been using offline mode

---

## Architecture

```
                    ┌─────────────┐
                    │   Cloud     │
                    │  Postgres   │
                    └──────▲──────┘
                           │ HTTPS
                           │ POST /api/v1/sync/push
                           │ POST /api/v1/sync/pull
                    ┌──────┴──────┐
                    │  Electron   │
                    │   Client    │
                    │             │
                    │  ┌────────┐ │
                    │  │ SQLite │ │
                    │  └────────┘ │
                    └─────────────┘
```

---

## Sync Strategy

### Conflict Resolution: Last-Write-Wins (LWW)

Every synced table has an `updated_at` timestamp. When conflicts occur:
- Compare `updated_at` timestamps
- The newer record wins
- Conflicts are logged for manual review (optional)

### Sync Direction

1. **Push (local → cloud)**: Upload local changes to Postgres
2. **Pull (cloud → local)**: Download cloud changes to SQLite
3. **Full sync**: Push then pull

### Change Tracking

Add a `sync_status` column to all synced tables in SQLite:

```typescript
interface SyncMetadata {
  sync_status: 'synced' | 'pending' | 'conflict';
  last_synced_at: Date | null;
  cloud_id: string | null; // maps to Postgres UUID
}
```

New SQLite-only table: `sync_log`

```typescript
interface SyncLogTable {
  id: Generated<number>;
  table_name: string;
  record_id: string;
  action: 'insert' | 'update' | 'delete';
  data: string; // JSON snapshot
  created_at: Date;
  synced_at: Date | null;
}
```

---

## Step 1: Sync Service (Electron side)

Create `apps/electron/src/sync/`:

```
apps/electron/src/sync/
  index.ts       ← SyncManager class
  push.ts        ← push local changes to cloud
  pull.ts        ← pull cloud changes to local
  tracker.ts     ← change tracking hooks for SQLite
  conflict.ts    ← conflict resolution logic
```

### SyncManager

```typescript
class SyncManager {
  async push(): Promise<SyncResult> { ... }
  async pull(): Promise<SyncResult> { ... }
  async fullSync(): Promise<SyncResult> { ... }
  async getStatus(): Promise<SyncStatus> { ... }
}

interface SyncResult {
  pushed: number;
  pulled: number;
  conflicts: number;
  errors: string[];
}

interface SyncStatus {
  lastSyncedAt: Date | null;
  pendingChanges: number;
  isOnline: boolean;
}
```

### IPC Handlers

```typescript
ipcMain.handle('sync:push', () => syncManager.push());
ipcMain.handle('sync:pull', () => syncManager.pull());
ipcMain.handle('sync:full', () => syncManager.fullSync());
ipcMain.handle('sync:status', () => syncManager.getStatus());
```

---

## Step 2: Sync API Routes (Server side)

### Push Endpoint

`POST /api/v1/sync/push`

```typescript
// Request body
interface SyncPushRequest {
  changes: Array<{
    table: string;
    action: 'insert' | 'update' | 'delete';
    data: Record<string, unknown>;
    local_id: string;
    updated_at: string;
  }>;
}

// Response
interface SyncPushResponse {
  applied: number;
  conflicts: Array<{
    table: string;
    local_id: string;
    cloud_id: string;
    resolution: 'local_wins' | 'cloud_wins';
  }>;
  id_mappings: Array<{
    local_id: string;
    cloud_id: string;
    table: string;
  }>;
}
```

### Pull Endpoint

`POST /api/v1/sync/pull`

```typescript
// Request body
interface SyncPullRequest {
  last_synced_at: string | null;
  tables: string[]; // which tables to pull
}

// Response
interface SyncPullResponse {
  changes: Array<{
    table: string;
    action: 'insert' | 'update' | 'delete';
    data: Record<string, unknown>;
    updated_at: string;
  }>;
  sync_timestamp: string;
}
```

### Auth

- All sync endpoints require valid access token
- Check that user has `pro` plan
- Rate limit: max 1 sync per minute

---

## Step 3: Sync UI

### Sync Status Indicator (Sidebar)

Below the offline indicator, show sync status:

```
┌─────────────────────────┐
│ 🟡 Offline Mode         │  ← existing
├─────────────────────────┤
│ ☁️ 5 changes pending    │  ← new
│ Last synced: 2 hours ago│
│ [Sync Now]              │
└─────────────────────────┘
```

### Sync Settings (in /settings)

```
Cloud Sync (Pro)
├── Sync frequency: [Manual ▾] / Hourly / Real-time
├── Last sync: May 29, 2026 at 14:30
├── Pending changes: 5
├── [Sync Now] button
├── Sync history (last 10 syncs with status)
└── [Reset sync] — clear all sync metadata, start fresh
```

### Sync Progress Modal

When syncing, show:
```
Syncing...
├── ✓ Pushing teams (3 changes)
├── ✓ Pushing tournaments (1 change)
├── ⟳ Pushing matches (2 changes)...
├── ○ Pulling updates
└── Progress: 60%
```

### Conflict Resolution UI (future)

If conflicts arise beyond LWW:
- Show diff view: local vs cloud version
- User picks which to keep
- For now: LWW automatic, log conflicts for admin review

---

## Step 4: First Sync (Onboarding)

When a user switches from offline to online for the first time:

1. Prompt: "You have local data. Would you like to sync it to the cloud?"
2. User signs in / creates account
3. Full push of all local data to cloud
4. Cloud assigns proper UUIDs, returns ID mappings
5. SQLite records updated with `cloud_id` references
6. Future changes tracked incrementally

---

## Synced Tables

| Table | Sync | Notes |
|-------|:----:|-------|
| tournaments | ✓ | Full sync |
| tournament_teams | ✓ | Linked to tournaments + teams |
| brackets | ✓ | JSON data synced as-is |
| matches | ✓ | Full sync |
| match_games | ✓ | Full sync |
| teams | ✓ | Full sync |
| players | ✓ | Linked to teams |
| staff | ✓ | Linked to teams |
| commentators | ✓ | Full sync |
| match_commentators | ✓ | Linked to matches + commentators |
| champions | ✗ | DDragon data, same everywhere |
| user_permissions | ✗ | Server-managed |
| tournament_permissions | ✓ | Synced with tournaments |

---

## Edge Cases

1. **User creates team offline, then goes online**: Team gets pushed, `owner_id` mapped to their cloud user ID
2. **Two devices offline**: Not supported initially. One device must sync before the other.
3. **Tournament with external teams**: If a team doesn't exist in the cloud, it's created during push.
4. **Deleted records**: Soft deletes tracked in sync_log. Propagated on next sync.
5. **Schema version mismatch**: Sync API includes schema version. If mismatch, force app update.

---

## Files Changed/Created

### New
- `apps/electron/src/sync/index.ts`
- `apps/electron/src/sync/push.ts`
- `apps/electron/src/sync/pull.ts`
- `apps/electron/src/sync/tracker.ts`
- `apps/electron/src/sync/conflict.ts`
- `apps/electron/src/ipc/sync.ts` — IPC handlers
- `apps/web/app/api/v1/sync/push/route.ts`
- `apps/web/app/api/v1/sync/pull/route.ts`
- `apps/web/app/_components/sync-status.tsx`
- `apps/web/app/_components/sync-progress-modal.tsx`
- `apps/web/app/settings/_components/sync-settings.tsx`
- `packages/db/src/migrations/00X_sync_metadata.ts`

### Modified
- `apps/electron/src/preload.ts` — add sync IPC calls
- `apps/electron/src/main.ts` — initialize SyncManager
- `packages/electron-bridge/src/index.ts` — add sync API types
- `packages/electron-bridge/src/hooks.ts` — add `useSyncStatus` store
- `apps/web/app/_components/side-nav.tsx` — add sync indicator
- `apps/web/app/settings/page.tsx` — add sync settings section
