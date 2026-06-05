import type { NextRequest } from "next/server";

import { withAuth } from "@lsu/auth";
import { canManageTournament } from "@lsu/auth/permissions";
import { getDbForRequest } from "@lsu/db";

import { json, error, unauthorized, forbidden, notFound, parseBody } from "@/api/_helpers";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);

  const { id: tournamentId } = await params;
  const db = getDbForRequest(request);

  if (!(await canManageTournament(db, auth.user.userId, tournamentId))) return forbidden();

  const body = await parseBody<{ teamId: string; message?: string }>(request);
  if (!body?.teamId) return error("teamId required");

  const team = await db
    .selectFrom("teams")
    .select("id")
    .where("id", "=", body.teamId)
    .executeTakeFirst();
  if (!team) return notFound("Team not found");

  const existing = await db
    .selectFrom("tournament_invitations")
    .select("id")
    .where("tournament_id", "=", tournamentId)
    .where("team_id", "=", body.teamId)
    .where("status", "=", "pending")
    .executeTakeFirst();

  if (existing) return error("A pending invitation already exists for this team", 409);

  const alreadyRegistered = await db
    .selectFrom("tournament_teams")
    .select("id")
    .where("tournament_id", "=", tournamentId)
    .where("team_id", "=", body.teamId)
    .executeTakeFirst();

  if (alreadyRegistered) return error("Team is already registered in this tournament", 409);

  const invitation = await db
    .insertInto("tournament_invitations")
    .values({
      tournament_id: tournamentId,
      team_id: body.teamId,
      invited_by: auth.user.userId,
      message: body.message ?? null,
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  return json(invitation, 201);
}
