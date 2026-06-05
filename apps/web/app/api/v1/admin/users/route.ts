import type { NextRequest } from "next/server";

import { withAuth } from "@lsu/auth";
import { getDbForRequest } from "@lsu/db";

import { json, unauthorized, forbidden } from "@/api/_helpers";

export async function GET(request: NextRequest) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);
  if (!auth.user.isAdmin) return forbidden();

  const db = getDbForRequest(request);
  const allUsers = await db
    .selectFrom("users")
    .select([
      "id",
      "username",
      "email",
      "is_admin",
      "is_locked",
      "email_verified",
      "plan",
      "plan_expires_at",
      "must_change_password",
      "last_login_at",
      "created_at",
    ])
    .orderBy("created_at", "desc")
    .execute();

  return json(allUsers);
}
