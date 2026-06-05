import type { NextRequest } from "next/server";

import { withAuth } from "@lsu/auth";
import { getDbForRequest } from "@lsu/db";
import { addPlayer } from "@lsu/team/queries";

import { json, error, unauthorized, parseBody } from "@/api/_helpers";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);

  const { id } = await params;
  const body = await parseBody<{
    inGameName: string;
    tag: string;
    role: "TOP" | "JUNGLE" | "MID" | "BOTTOM" | "SUPPORT";
    isSub?: boolean;
    puuid?: string;
    firstName?: string;
    lastName?: string;
    country?: string;
    rank?: string;
  }>(request);

  if (!body?.inGameName || !body?.tag || !body?.role) {
    return error("inGameName, tag, and role required");
  }

  const db = getDbForRequest(request);
  const player = await addPlayer(db, { ...body, teamId: id });

  return json(player, 201);
}
