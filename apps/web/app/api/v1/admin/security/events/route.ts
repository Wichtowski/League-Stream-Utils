import type { NextRequest } from "next/server";

import { withAuth } from "@lsu/auth";
import { getDbForRequest } from "@lsu/db";

import { json, unauthorized, forbidden } from "@/api/_helpers";

export async function GET(request: NextRequest) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);
  if (!auth.user.isAdmin) return forbidden();

  const db = getDbForRequest(request);
  const url = new URL(request.url);
  const eventType = url.searchParams.get("type");
  const userId = url.searchParams.get("userId");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 100), 500);
  const offset = Number(url.searchParams.get("offset") ?? 0);

  let query = db
    .selectFrom("security_events")
    .leftJoin("users", "users.id", "security_events.user_id")
    .select([
      "security_events.id",
      "security_events.event_type",
      "security_events.ip",
      "security_events.user_id",
      "security_events.metadata",
      "security_events.created_at",
      "users.username",
    ])
    .orderBy("security_events.created_at", "desc")
    .limit(limit)
    .offset(offset);

  if (eventType) query = query.where("security_events.event_type", "=", eventType);
  if (userId) query = query.where("security_events.user_id", "=", userId);

  const events = await query.execute();

  return json(events);
}
