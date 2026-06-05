import type { NextRequest } from "next/server";

import { withAuth } from "@lsu/auth";
import { getSessions, createSession } from "@lsu/draft/queries";

import { json, error, unauthorized, parseBody } from "@/api/_helpers";

export async function GET(request: NextRequest) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);

  const sessions = await getSessions();

  return json(sessions);
}

export async function POST(request: NextRequest) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);

  const body = await parseBody<{
    config: Record<string, unknown>;
    teams: { blue: Record<string, unknown>; red: Record<string, unknown> };
    password?: string;
    type?: "static" | "lcu" | "tournament" | "web";
  }>(request);

  if (!body?.config || !body?.teams) {
    return error("config and teams required");
  }

  const session = await createSession({
    sessionId: crypto.randomUUID(),
    type: body.type,
    config: body.config,
    teams: body.teams,
    createdBy: auth.user.userId,
    password: body.password,
  });

  return json(session, 201);
}
