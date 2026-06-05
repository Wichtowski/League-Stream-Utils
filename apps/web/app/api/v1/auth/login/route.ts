import type { NextRequest } from "next/server";

import { login, getClientIp } from "@lsu/auth";
import { getDbForRequest } from "@lsu/db";

import { json, error, parseBody, setCookies } from "@/api/_helpers";

export async function POST(request: NextRequest) {
  const body = await parseBody<{ username: string; password: string }>(request);
  if (!body?.username || !body?.password) {
    return error("Username and password required");
  }

  const db = getDbForRequest(request);
  const ip = getClientIp(request);
  const result = await login(
    db,
    body.username,
    body.password,
    ip,
    request.headers.get("user-agent") ?? undefined,
  );

  if (!result.success) {
    return error(result.error, 401);
  }

  const response = json({ user: result.user });
  setCookies(response, result.tokens);

  return response;
}
