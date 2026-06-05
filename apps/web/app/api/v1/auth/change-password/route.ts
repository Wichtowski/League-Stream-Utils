import type { NextRequest } from "next/server";

import { changePassword, withAuth, getClientIp } from "@lsu/auth";
import { getDbForRequest } from "@lsu/db";

import { json, error, unauthorized, parseBody } from "@/api/_helpers";

export async function POST(request: NextRequest) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);

  const body = await parseBody<{ currentPassword: string; newPassword: string }>(request);
  if (!body?.currentPassword || !body?.newPassword) {
    return error("Current and new password required");
  }

  const db = getDbForRequest(request);
  const ip = getClientIp(request);
  const result = await changePassword(
    db,
    auth.user.userId,
    body.currentPassword,
    body.newPassword,
    ip,
  );

  if (!result.success) {
    return error(result.error);
  }

  return json({ success: true });
}
