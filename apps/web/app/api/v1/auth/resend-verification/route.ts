import type { NextRequest } from "next/server";

import { resendVerificationEmail, withAuth } from "@lsu/auth";
import { getDbForRequest } from "@lsu/db";

import { json, error } from "@/api/_helpers";

export async function POST(request: NextRequest) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return error(auth.error, auth.status);

  const db = getDbForRequest(request);
  const user = await db
    .selectFrom("users")
    .select("email")
    .where("id", "=", auth.user.userId)
    .executeTakeFirst();

  if (!user) return error("User not found", 404);

  await resendVerificationEmail(db, auth.user.userId, user.email);

  return json({ message: "Verification email sent" });
}
