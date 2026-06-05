import type { Kysely } from "kysely";

import type { Database } from "@lsu/db/types";

export async function requirePermission(
  db: Kysely<Database>,
  userId: string,
  permission: "developer" | "admin" | "organizer" | "moderator" | "commentator" | "viewer",
): Promise<boolean> {
  const ROLE_HIERARCHY: Record<string, number> = {
    developer: 6,
    admin: 5,
    organizer: 4,
    moderator: 3,
    commentator: 2,
    viewer: 1,
  };

  const rows = await db
    .selectFrom("user_permissions")
    .select("role")
    .where("user_id", "=", userId)
    .execute();

  if (rows.length === 0) return false;

  const requiredLevel = ROLE_HIERARCHY[permission] ?? 0;

  return rows.some((r) => (ROLE_HIERARCHY[r.role] ?? 0) >= requiredLevel);
}

export async function requireTournamentRole(
  db: Kysely<Database>,
  userId: string,
  tournamentId: string,
  role: "organizer" | "moderator" | "commentator" | "viewer",
): Promise<boolean> {
  const isAdmin = await requirePermission(db, userId, "admin");
  if (isAdmin) return true;

  const ROLE_HIERARCHY: Record<string, number> = {
    organizer: 4,
    moderator: 3,
    commentator: 2,
    viewer: 1,
  };

  const rows = await db
    .selectFrom("tournament_permissions")
    .select("role")
    .where("user_id", "=", userId)
    .where("tournament_id", "=", tournamentId)
    .execute();

  if (rows.length === 0) return false;

  const requiredLevel = ROLE_HIERARCHY[role] ?? 0;

  return rows.some((r) => (ROLE_HIERARCHY[r.role] ?? 0) >= requiredLevel);
}

export async function isTeamOwner(
  db: Kysely<Database>,
  userId: string,
  teamId: string,
): Promise<boolean> {
  const team = await db
    .selectFrom("teams")
    .select("owner_id")
    .where("id", "=", teamId)
    .executeTakeFirst();

  return team?.owner_id === userId;
}

export async function isTournamentOrganizer(
  db: Kysely<Database>,
  userId: string,
  tournamentId: string,
): Promise<boolean> {
  const tournament = await db
    .selectFrom("tournaments")
    .select("organizer_id")
    .where("id", "=", tournamentId)
    .executeTakeFirst();

  return tournament?.organizer_id === userId;
}

export async function canManageTournament(
  db: Kysely<Database>,
  userId: string,
  tournamentId: string,
): Promise<boolean> {
  const isAdmin = await requirePermission(db, userId, "admin");
  if (isAdmin) return true;

  return isTournamentOrganizer(db, userId, tournamentId);
}
