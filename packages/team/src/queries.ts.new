import type { Kysely } from 'kysely';
import type { Database } from '@lsu/db/types';

export async function getTeams(db: Kysely<Database>) {
  const rows = await db
    .selectFrom('teams')
    .selectAll()
    .orderBy('name', 'asc')
    .execute();

  const ids = rows.map((r) => r.id);
  if (ids.length === 0) return [];

  const [playerRows, staffRows] = await Promise.all([
    db.selectFrom('players').selectAll().where('team_id', 'in', ids).execute(),
    db.selectFrom('staff').selectAll().where('team_id', 'in', ids).execute(),
  ]);

  return rows.map((t) => ({
    ...t,
    players: playerRows.filter((p) => p.team_id === t.id),
    staff: staffRows.filter((s) => s.team_id === t.id),
  }));
}

export async function getTeam(db: Kysely<Database>, id: string) {
  const team = await db
    .selectFrom('teams')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst();

  if (!team) return undefined;

  const [players, staffMembers] = await Promise.all([
    db.selectFrom('players').selectAll().where('team_id', '=', id).execute(),
    db.selectFrom('staff').selectAll().where('team_id', '=', id).execute(),
  ]);

  return { ...team, players, staff: staffMembers };
}

export async function createTeam(
  db: Kysely<Database>,
  data: {
    name: string;
    tag: string;
    colors: { primary: string; secondary: string; accent: string };
    country?: string;
    logo?: unknown;
    ownerId: string;
  },
) {
  return db
    .insertInto('teams')
    .values({
      name: data.name,
      tag: data.tag,
      colors: JSON.stringify(data.colors),
      country: data.country ?? null,
      logo: data.logo ? JSON.stringify(data.logo) : null,
      owner_id: data.ownerId,
    })
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function updateTeam(
  db: Kysely<Database>,
  id: string,
  data: Partial<{
    name: string;
    tag: string;
    colors: { primary: string; secondary: string; accent: string };
    country: string;
    logo: unknown;
  }>,
) {
  const set: Record<string, unknown> = { updated_at: new Date() };
  if (data.name !== undefined) set.name = data.name;
  if (data.tag !== undefined) set.tag = data.tag;
  if (data.colors !== undefined) set.colors = JSON.stringify(data.colors);
  if (data.country !== undefined) set.country = data.country;
  if (data.logo !== undefined) set.logo = JSON.stringify(data.logo);

  return db
    .updateTable('teams')
    .set(set)
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirst();
}

export async function deleteTeam(db: Kysely<Database>, id: string) {
  await db.deleteFrom('teams').where('id', '=', id).execute();
}

export async function addPlayer(
  db: Kysely<Database>,
  data: {
    teamId: string;
    inGameName: string;
    tag: string;
    role: 'TOP' | 'JUNGLE' | 'MID' | 'BOTTOM' | 'SUPPORT';
    isSub?: boolean;
    profileImage?: unknown;
    puuid?: string;
    firstName?: string;
    lastName?: string;
    country?: string;
    rank?: string;
  },
) {
  return db
    .insertInto('players')
    .values({
      team_id: data.teamId,
      in_game_name: data.inGameName,
      tag: data.tag,
      role: data.role,
      is_sub: data.isSub ?? false,
      profile_image: data.profileImage ? JSON.stringify(data.profileImage) : null,
      puuid: data.puuid ?? null,
      first_name: data.firstName ?? null,
      last_name: data.lastName ?? null,
      country: data.country ?? null,
      rank: data.rank ?? null,
    })
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function updatePlayer(
  db: Kysely<Database>,
  id: string,
  data: Partial<{
    inGameName: string;
    tag: string;
    role: 'TOP' | 'JUNGLE' | 'MID' | 'BOTTOM' | 'SUPPORT';
    isSub: boolean;
    profileImage: unknown;
    puuid: string;
    firstName: string;
    lastName: string;
    country: string;
    rank: string;
  }>,
) {
  const set: Record<string, unknown> = { updated_at: new Date() };
  if (data.inGameName !== undefined) set.in_game_name = data.inGameName;
  if (data.tag !== undefined) set.tag = data.tag;
  if (data.role !== undefined) set.role = data.role;
  if (data.isSub !== undefined) set.is_sub = data.isSub;
  if (data.profileImage !== undefined) set.profile_image = JSON.stringify(data.profileImage);
  if (data.puuid !== undefined) set.puuid = data.puuid;
  if (data.firstName !== undefined) set.first_name = data.firstName;
  if (data.lastName !== undefined) set.last_name = data.lastName;
  if (data.country !== undefined) set.country = data.country;
  if (data.rank !== undefined) set.rank = data.rank;

  return db
    .updateTable('players')
    .set(set)
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirst();
}

export async function removePlayer(db: Kysely<Database>, id: string) {
  await db.deleteFrom('players').where('id', '=', id).execute();
}

export async function addStaff(
  db: Kysely<Database>,
  data: {
    teamId: string;
    name: string;
    role: string;
    profileImage?: unknown;
  },
) {
  return db
    .insertInto('staff')
    .values({
      team_id: data.teamId,
      name: data.name,
      role: data.role,
      profile_image: data.profileImage ? JSON.stringify(data.profileImage) : null,
    })
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function removeStaff(db: Kysely<Database>, id: string) {
  await db.deleteFrom('staff').where('id', '=', id).execute();
}
