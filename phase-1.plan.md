# Phase 1: Foundation — Kysely Migration + Image Storage

## Overview

Replace Drizzle ORM with Kysely for single-schema multi-dialect support (Postgres + SQLite).
Migrate image storage from base64-in-DB to MinIO (online) / local files (offline).

## Decisions

- ORM: Kysely (single `Database` TypeScript interface, swap dialect at runtime)
- Online DB: PostgreSQL via `pg` driver
- Offline DB: SQLite via `better-sqlite3`
- Online images: MinIO (S3-compatible, self-hosted in Docker)
- Offline images: Local filesystem, served via API proxy
- Detection: `app_mode=offline` cookie already set by Electron

## Architecture

```
React Client → fetch('/api/v1/...') → API Route → Query Package → getDb(req) → Postgres OR SQLite
                                                                       ↑
                                                        reads `app_mode` cookie
```

```
Image Upload → POST /api/v1/storage/upload → storage package → MinIO OR local fs
Image Read   → GET  /api/v1/storage/[key]  → storage package → MinIO presigned URL OR local file stream
```

---

## Part A: Kysely Migration

### Step 1: Install dependencies

```bash
# In packages/db
bun add kysely pg better-sqlite3
bun add -D @types/better-sqlite3 @types/pg
bun remove drizzle-orm drizzle-kit postgres
```

### Step 2: Define Database interface

Create `packages/db/src/types.ts` — single source of truth for all tables:

```typescript
import { Generated, ColumnType, JSONColumnType } from 'kysely';

// ── Users ───────────────────────────────────────────────────
interface UsersTable {
  id: Generated<string>;                    // uuid, auto-generated
  username: string;
  email: string;
  password_hash: string;
  is_admin: ColumnType<boolean, boolean | undefined, boolean>;
  is_locked: ColumnType<boolean, boolean | undefined, boolean>;
  email_verified: ColumnType<boolean, boolean | undefined, boolean>;
  locked_until: Date | null;
  last_login_at: Date | null;
  last_login_ip: string | null;
  sessions_created_today: ColumnType<number, number | undefined, number>;
  last_session_date: Date | null;
  created_at: ColumnType<Date, Date | undefined, never>;
  updated_at: ColumnType<Date, Date | undefined, Date>;
}

interface SessionsTable { ... }
interface EmailVerificationTokensTable { ... }
interface LoginAttemptsTable { ... }
interface SecurityEventsTable { ... }

// ── Teams ───────────────────────────────────────────────────
interface TeamsTable {
  id: Generated<string>;
  name: string;
  tag: string;
  logo: JSONColumnType<unknown> | null;
  colors: JSONColumnType<{ primary: string; secondary: string; accent: string }>;
  country: string | null;
  owner_id: string;
  created_at: ColumnType<Date, Date | undefined, never>;
  updated_at: ColumnType<Date, Date | undefined, Date>;
}

interface PlayersTable { ... }
interface StaffTable { ... }

// ── Tournaments ─────────────────────────────────────────────
interface TournamentsTable {
  id: Generated<string>;
  name: string;
  type: 'ladder' | 'swiss' | 'round_robin' | 'groups';
  format: 'bo1' | 'bo3' | 'bo5';
  status: 'draft' | 'registration' | 'active' | 'completed' | 'cancelled';
  logo: JSONColumnType<unknown> | null;
  description: string | null;
  organizer_id: string;
  start_date: Date | null;
  end_date: Date | null;
  created_at: ColumnType<Date, Date | undefined, never>;
  updated_at: ColumnType<Date, Date | undefined, Date>;
}

interface TournamentTeamsTable { ... }
interface BracketsTable { ... }
interface MatchesTable { ... }
interface MatchGamesTable { ... }

// ── Other ───────────────────────────────────────────────────
interface CommentatorsTable { ... }
interface MatchCommentatorsTable { ... }
interface ChampionsTable { ... }
interface UserPermissionsTable { ... }
interface TournamentPermissionsTable { ... }
interface PermissionAuditTable { ... }
interface PredictionsTable { ... }

// ── Database (root interface) ───────────────────────────────
export interface Database {
  users: UsersTable;
  sessions: SessionsTable;
  email_verification_tokens: EmailVerificationTokensTable;
  login_attempts: LoginAttemptsTable;
  security_events: SecurityEventsTable;
  teams: TeamsTable;
  players: PlayersTable;
  staff: StaffTable;
  tournaments: TournamentsTable;
  tournament_teams: TournamentTeamsTable;
  brackets: BracketsTable;
  matches: MatchesTable;
  match_games: MatchGamesTable;
  commentators: CommentatorsTable;
  match_commentators: MatchCommentatorsTable;
  champions: ChampionsTable;
  user_permissions: UserPermissionsTable;
  tournament_permissions: TournamentPermissionsTable;
  permission_audit: PermissionAuditTable;
  predictions: PredictionsTable;
}
```

### Step 3: Create dialect factory

Rewrite `packages/db/src/index.ts`:

```typescript
import { Kysely, PostgresDialect, SqliteDialect } from 'kysely';
import { Pool } from 'pg';
import BetterSqlite3 from 'better-sqlite3';
import type { Database } from './types';

let onlineDb: Kysely<Database> | null = null;
let offlineDb: Kysely<Database> | null = null;

export function getDb(mode: 'online' | 'offline' = 'online'): Kysely<Database> {
  if (mode === 'offline') {
    if (!offlineDb) {
      const sqlitePath = process.env.SQLITE_PATH ?? './local.db';
      offlineDb = new Kysely<Database>({
        dialect: new SqliteDialect({ database: new BetterSqlite3(sqlitePath) }),
      });
    }
    return offlineDb;
  }

  if (!onlineDb) {
    onlineDb = new Kysely<Database>({
      dialect: new PostgresDialect({
        pool: new Pool({ connectionString: process.env.DATABASE_URL }),
      }),
    });
  }
  return onlineDb;
}

// Default export for backward compatibility during migration
export const db = getDb('online');

// Helper for API routes
export function getDbForRequest(request: Request): Kysely<Database> {
  const cookies = request.headers.get('cookie') ?? '';
  const isOffline = cookies.includes('app_mode=offline');
  return getDb(isOffline ? 'offline' : 'online');
}
```

### Step 4: Rewrite query packages

Each query function receives `db` as a parameter:

**Before (Drizzle):**

```typescript
export async function getTournaments() {
  return db.query.tournaments.findMany({
    with: { tournamentTeams: { with: { team: true } } },
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });
}
```

**After (Kysely):**

```typescript
export async function getTournaments(db: Kysely<Database>) {
  const tournaments = await db
    .selectFrom('tournaments')
    .selectAll()
    .orderBy('created_at', 'desc')
    .execute();

  // Load related data (Kysely doesn't have automatic relations)
  const ids = tournaments.map((t) => t.id);
  const teamLinks = await db
    .selectFrom('tournament_teams')
    .innerJoin('teams', 'teams.id', 'tournament_teams.team_id')
    .selectAll('tournament_teams')
    .select(['teams.name as team_name', 'teams.tag as team_tag'])
    .where('tournament_teams.tournament_id', 'in', ids)
    .execute();

  return tournaments.map((t) => ({
    ...t,
    teams: teamLinks.filter((tl) => tl.tournament_id === t.id),
  }));
}
```

**Packages to rewrite:**
| Package | File | Query count |
|---------|------|-------------|
| `@lsu/tournament` | `src/queries.ts` | ~10 functions |
| `@lsu/team` | `src/queries.ts` | ~10 functions |
| `@lsu/auth` | `src/session.ts` | ~5 functions |
| `@lsu/auth` | `src/security.ts` | ~4 functions |
| `@lsu/auth` | `src/email.ts` | ~3 functions |
| `@lsu/draft` | `src/queries.ts` | ~3 functions |
| `@lsu/camera` | `src/queries.ts` | ~3 functions |

### Step 5: Update API routes

All API routes that call query functions now pass `db`:

```typescript
// Before
const tournaments = await getTournaments();

// After
const db = getDbForRequest(request);
const tournaments = await getTournaments(db);
```

### Step 6: Migrations

Create `packages/db/src/migrations/` with Kysely migration files:

```typescript
// 001_initial.ts
import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('users')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('username', 'varchar(64)', (col) => col.notNull().unique())
    .addColumn('email', 'varchar(255)', (col) => col.notNull().unique())
    // ... all columns
    .execute();

  // ... all other tables
}

export async function down(db: Kysely<any>): Promise<void> {
  // reverse order
  await db.schema.dropTable('predictions').execute();
  // ...
  await db.schema.dropTable('users').execute();
}
```

SQLite migration variant uses compatible types (TEXT instead of UUID, INTEGER instead of SERIAL).
Both are handled by Kysely's dialect-aware schema builder.

### Step 7: Remove Drizzle

- Delete `packages/db/drizzle.config.ts`
- Delete `packages/db/drizzle/` migration directory
- Delete `packages/db/src/schema/` (replaced by `types.ts` + migrations)
- Remove `drizzle-orm`, `drizzle-kit` from all `package.json` files
- Update all imports: `@lsu/db/schema` → `@lsu/db/types`

### Step 8: Wire SQLite into Electron

In `apps/electron/src/main.ts` — set `SQLITE_PATH` env before anything else:

```typescript
import { app } from 'electron';
import path from 'node:path';

process.env.SQLITE_PATH = path.join(app.getPath('userData'), 'local.db');
```

On first offline launch, run migrations automatically.

---

## Part B: Image Storage (MinIO + Local)

### Step 1: Docker — add MinIO

Add to `docker-compose.yml`:

```yaml
minio:
  image: minio/minio
  ports:
    - '9000:9000'
    - '9001:9001' # console
  environment:
    MINIO_ROOT_USER: lsu_minio
    MINIO_ROOT_PASSWORD: lsu_minio_dev
  command: server /data --console-address ":9001"
  volumes:
    - minio_data:/data
```

### Step 2: Create `packages/storage`

```
packages/storage/
  src/
    index.ts        ← export { upload, getUrl, remove, createStorageForRequest }
    minio.ts        ← MinIO S3 client (online)
    local.ts        ← fs read/write (offline)
    types.ts        ← StorageProvider interface
  package.json
```

**Interface:**

```typescript
interface StorageProvider {
  upload(key: string, data: Buffer, contentType: string): Promise<string>;
  getUrl(key: string): Promise<string>;
  remove(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
```

**Online (MinIO):** Uses `@aws-sdk/client-s3` — upload to bucket, return presigned URL.
**Offline (Local):** Saves to `~/.config/@lsu/electron/uploads/{key}`, returns local path.

### Step 3: API routes for storage

- `POST /api/v1/storage/upload` — multipart form, returns key
- `GET /api/v1/storage/[key]` — returns image (proxy to MinIO or local file)
- `DELETE /api/v1/storage/[key]` — remove image

### Step 4: Migrate existing base64 data

Write a migration script that:

1. Reads all `logo` (jsonb) fields from teams, tournaments, commentators
2. Decodes base64 → uploads to MinIO
3. Updates DB field to `{ key: "teams/abc123.png" }` instead of base64 blob

### Step 5: Update UI components

All image components use `<img src="/api/v1/storage/{key}" />` instead of inline base64.

---

## Tables: Online-only vs Both

| Table                     | Postgres (online) |     SQLite (offline)      |
| ------------------------- | :---------------: | :-----------------------: |
| tournaments               |         ✓         |             ✓             |
| tournament_teams          |         ✓         |             ✓             |
| brackets                  |         ✓         |             ✓             |
| matches                   |         ✓         |             ✓             |
| match_games               |         ✓         |             ✓             |
| teams                     |         ✓         |             ✓             |
| players                   |         ✓         |             ✓             |
| staff                     |         ✓         |             ✓             |
| commentators              |         ✓         |             ✓             |
| match_commentators        |         ✓         |             ✓             |
| champions                 |         ✓         |             ✓             |
| user_permissions          |         ✓         |             ✓             |
| tournament_permissions    |         ✓         |             ✓             |
| users                     |         ✓         | ✗ (offline bypasses auth) |
| sessions                  |         ✓         |             ✗             |
| email_verification_tokens |         ✓         |             ✗             |
| login_attempts            |         ✓         |             ✗             |
| security_events           |         ✓         |             ✗             |
| permission_audit          |         ✓         |             ✗             |
| predictions               |         ✓         |             ✗             |

---

## Files Changed/Created

### New

- `packages/db/src/types.ts`
- `packages/db/src/migrations/001_initial.ts`
- `packages/storage/` (entire package)
- `apps/web/app/api/v1/storage/` (upload, [key] routes)
- `docker-compose.yml` (MinIO service)

### Rewritten

- `packages/db/src/index.ts`
- `packages/db/package.json`
- `packages/tournament/src/queries.ts`
- `packages/team/src/queries.ts`
- `packages/auth/src/session.ts`
- `packages/auth/src/security.ts`
- `packages/auth/src/email.ts`
- `packages/draft/src/queries.ts`
- `packages/camera/src/queries.ts`
- All API routes using query functions (~15 routes)

### Deleted

- `packages/db/src/schema/` (entire directory)
- `packages/db/drizzle.config.ts`
- `packages/db/drizzle/` (migration directory)

---

## Estimated Scope

| Sub-task                   | Files | Complexity       |
| -------------------------- | ----- | ---------------- |
| Database types interface   | 1     | Medium           |
| Dialect factory            | 1     | Low              |
| Migration file             | 1     | Medium           |
| Rewrite tournament queries | 1     | Medium           |
| Rewrite team queries       | 1     | Medium           |
| Rewrite auth queries       | 3     | Medium           |
| Rewrite other queries      | 2     | Low              |
| Update API routes          | ~15   | Low (mechanical) |
| Remove Drizzle cleanup     | ~10   | Low              |
| Storage package            | 4     | Medium           |
| Storage API routes         | 3     | Low              |
| MinIO Docker setup         | 1     | Low              |
| Base64 migration script    | 1     | Medium           |
| Update image components    | ~8    | Low              |
