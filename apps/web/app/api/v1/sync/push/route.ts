import { NextRequest } from 'next/server';
import { withAuth } from '@lsu/auth';
import { getDb } from '@lsu/db';
import { json, error, unauthorized, forbidden, parseBody } from '@/api/_helpers';
import { sql } from 'kysely';

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

type SyncedTable = (typeof SYNCED_TABLES)[number];

interface SyncChange {
  table: string;
  action: 'insert' | 'update' | 'delete';
  data: Record<string, unknown>;
  local_id: string;
  updated_at: string;
}

interface SyncPushRequest {
  changes: SyncChange[];
}

function isValidTable(table: string): table is SyncedTable {
  return SYNCED_TABLES.includes(table as SyncedTable);
}

export async function POST(request: NextRequest) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);

  const db = getDb('online');

  const user = await db
    .selectFrom('users')
    .select(['plan', 'plan_expires_at'])
    .where('id', '=', auth.user.userId)
    .executeTakeFirst();

  if (!user || user.plan !== 'pro') {
    return forbidden('Cloud sync requires a Pro plan');
  }
  if (user.plan_expires_at && new Date(user.plan_expires_at) < new Date()) {
    return forbidden('Pro plan has expired');
  }

  const body = await parseBody<SyncPushRequest>(request);
  if (!body?.changes || !Array.isArray(body.changes)) {
    return error('Invalid request body');
  }

  if (body.changes.length > 500) {
    return error('Too many changes in single push (max 500)');
  }

  const applied: number[] = [];
  const conflicts: { table: string; local_id: string; cloud_id: string; resolution: string }[] = [];
  const idMappings: { local_id: string; cloud_id: string; table: string }[] = [];

  for (let i = 0; i < body.changes.length; i++) {
    const change = body.changes[i];
    if (!isValidTable(change.table)) continue;

    try {
      if (change.action === 'insert') {
        const { local_id, ...insertData } = change.data as Record<string, unknown>;
        const result = await db
          .insertInto(change.table)
          .values({
            ...insertData,
            sync_status: 'synced',
            last_synced_at: new Date(),
            cloud_id: null,
          } as any)
          .returning('id')
          .executeTakeFirst();

        if (result) {
          idMappings.push({
            local_id: change.local_id,
            cloud_id: result.id as string,
            table: change.table,
          });
          applied.push(i);
        }
      } else if (change.action === 'update') {
        const existing = await db
          .selectFrom(change.table)
          .select(['id', 'updated_at'] as any[])
          .where('id' as any, '=', change.local_id)
          .executeTakeFirst();

        if (existing) {
          const cloudTime = new Date((existing as any).updated_at ?? 0).getTime();
          const localTime = new Date(change.updated_at).getTime();

          if (localTime >= cloudTime) {
            const { local_id, id, created_at, ...updateData } = change.data as Record<string, unknown>;
            await db
              .updateTable(change.table)
              .set({
                ...updateData,
                sync_status: 'synced',
                last_synced_at: new Date(),
              } as any)
              .where('id' as any, '=', change.local_id)
              .execute();
            applied.push(i);
          } else {
            conflicts.push({
              table: change.table,
              local_id: change.local_id,
              cloud_id: (existing as any).id,
              resolution: 'cloud_wins',
            });
          }
        }
      } else if (change.action === 'delete') {
        await db
          .deleteFrom(change.table)
          .where('id' as any, '=', change.local_id)
          .execute();
        applied.push(i);
      }
    } catch (err: any) {
      conflicts.push({
        table: change.table,
        local_id: change.local_id,
        cloud_id: '',
        resolution: `error: ${err.message}`,
      });
    }
  }

  return json({
    applied: applied.length,
    conflicts,
    id_mappings: idMappings,
  });
}
