import type { NextRequest } from "next/server";

import { withAuth } from "@lsu/auth";
import { getDb } from "@lsu/db";

import { json, error, unauthorized, forbidden, parseBody } from "@/api/_helpers";

const SYNCED_TABLES = [
  "teams",
  "players",
  "staff",
  "tournaments",
  "tournament_teams",
  "brackets",
  "matches",
  "match_games",
  "commentators",
  "match_commentators",
  "tournament_permissions",
] as const;

type SyncedTable = (typeof SYNCED_TABLES)[number];

interface SyncPullRequest {
  last_synced_at: string | null;
  tables: string[];
}

function isValidTable(table: string): table is SyncedTable {
  return SYNCED_TABLES.includes(table as SyncedTable);
}

export async function POST(request: NextRequest) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);

  const db = getDb("online");

  const user = await db
    .selectFrom("users")
    .select(["plan", "plan_expires_at"])
    .where("id", "=", auth.user.userId)
    .executeTakeFirst();

  if (!user || user.plan !== "pro") {
    return forbidden("Cloud sync requires a Pro plan");
  }
  if (user.plan_expires_at && new Date(user.plan_expires_at) < new Date()) {
    return forbidden("Pro plan has expired");
  }

  const body = await parseBody<SyncPullRequest>(request);
  if (!body) {
    return error("Invalid request body");
  }

  const since = body.last_synced_at ? new Date(body.last_synced_at) : null;
  const requestedTables = (body.tables ?? []).filter(isValidTable);

  if (requestedTables.length === 0) {
    return json({ changes: [], sync_timestamp: new Date().toISOString() });
  }

  const changes: {
    table: string;
    action: "insert" | "update";
    data: Record<string, unknown>;
    updated_at: string;
  }[] = [];

  for (const table of requestedTables) {
    let query = db.selectFrom(table).selectAll();

    if (since) {
      query = query.where("updated_at" as never, ">", since) as typeof query;
    }

    const rows = await query.execute();

    for (const row of rows) {
      const r = row as Record<string, unknown>;
      changes.push({
        table,
        action: since ? "update" : "insert",
        data: r,
        updated_at:
          (r.updated_at ?? r.created_at ?? new Date(0))
            ? new Date((r.updated_at ?? r.created_at ?? 0) as string | number).toISOString()
            : new Date().toISOString(),
      });
    }
  }

  return json({
    changes,
    sync_timestamp: new Date().toISOString(),
  });
}
