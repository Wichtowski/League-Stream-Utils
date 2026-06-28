import type { NextRequest } from "next/server";

import { withAuth } from "@lsu/auth";
import { getDbForRequest } from "@lsu/db";
import { createMatch } from "@lsu/tournament/queries";

import { json, error, unauthorized, parseBody } from "@/api/_helpers";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);

  const { id } = await params;
  const body = await parseBody<{
    blueTeamId?: string;
    redTeamId?: string;
    format: "bo1" | "bo3" | "bo5";
    roundNumber?: number;
    roundName?: string;
    matchNumber?: number;
    scheduledAt?: string;
  }>(request);

  if (!body?.format) return error("format required");

  const db = getDbForRequest(request);
  const match = await createMatch(db, {
    ...body,
    tournamentId: id,
    scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
  });

  return json(match, 201);
}
