import type { NextRequest } from "next/server";

import { withAuth } from "@lsu/auth";
import { getDbForRequest } from "@lsu/db";

import { json, error, unauthorized, forbidden, notFound, parseBody } from "@/api/_helpers";

interface Params {
  params: Promise<{ userId: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);
  if (!auth.user.isAdmin) return forbidden();

  const { userId } = await params;
  const body = await parseBody<{
    plan: "free" | "pro";
    planExpiresAt?: string | null;
  }>(request);

  if (!body?.plan || !["free", "pro"].includes(body.plan)) {
    return error('plan must be "free" or "pro"');
  }

  const db = getDbForRequest(request);

  const user = await db
    .selectFrom("users")
    .select("id")
    .where("id", "=", userId)
    .executeTakeFirst();
  if (!user) return notFound("User not found");

  const updated = await db
    .updateTable("users")
    .set({
      plan: body.plan,
      plan_expires_at: body.planExpiresAt ? new Date(body.planExpiresAt) : null,
      updated_at: new Date(),
    })
    .where("id", "=", userId)
    .returning(["id", "username", "plan", "plan_expires_at"])
    .executeTakeFirstOrThrow();

  await db
    .insertInto("permission_audit")
    .values({
      user_id: userId,
      action: "plan_changed",
      resource: "users",
      metadata: JSON.stringify({ plan: body.plan, planExpiresAt: body.planExpiresAt ?? null }),
      performed_by: auth.user.userId,
    })
    .execute();

  return json(updated);
}
