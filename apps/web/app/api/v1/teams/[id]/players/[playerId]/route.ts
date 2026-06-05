import type { NextRequest } from "next/server";

import { withAuth } from "@lsu/auth";
import { getDbForRequest } from "@lsu/db";
import { updatePlayer, removePlayer } from "@lsu/team/queries";

import { json, error, unauthorized, parseBody } from "@/api/_helpers";

interface Params {
  params: Promise<{ id: string; playerId: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);

  const { playerId } = await params;
  const body = await parseBody<Record<string, unknown>>(request);
  if (!body) return error("Request body required");

  const db = getDbForRequest(request);
  const player = await updatePlayer(db, playerId, body as Record<string, unknown>);

  return json(player);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);

  const { playerId } = await params;
  const db = getDbForRequest(request);
  await removePlayer(db, playerId);

  return json({ success: true });
}
