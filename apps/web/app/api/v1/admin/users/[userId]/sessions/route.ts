import type { NextRequest } from "next/server";

import { withAuth } from "@lsu/auth";
import { getDbForRequest } from "@lsu/db";

import { json, unauthorized, forbidden, notFound } from "@/api/_helpers";

interface Params {
  params: Promise<{ userId: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);
  if (!auth.user.isAdmin) return forbidden();

  const { userId } = await params;
  const db = getDbForRequest(request);

  const user = await db
    .selectFrom("users")
    .select("id")
    .where("id", "=", userId)
    .executeTakeFirst();
  if (!user) return notFound("User not found");

  const sessions = await db
    .selectFrom("sessions")
    .select([
      "id",
      "ip",
      "user_agent",
      "created_at",
      "last_used_at",
      "expires_at",
      "is_valid",
      "impersonated_by",
    ])
    .where("user_id", "=", userId)
    .where("is_valid", "=", true)
    .where("expires_at", ">", new Date())
    .orderBy("last_used_at", "desc")
    .execute();

  return json(sessions);
}
