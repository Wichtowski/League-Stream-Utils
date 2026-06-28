import type { Kysely } from 'kysely';
import type { Database } from '@lsu/db/types';

export async function getTournaments(db: Kysely<Database>) {
  const rows = await db
    .selectFrom('tournaments')
    .selectAll()
    .orderBy('created_at', 'desc')
    .execute();

  const ids = rows.map((r) => r.id);
  if (ids.length === 0) return [];

  const ttRows = await db
    .selectFrom('tournament_teams')
    .innerJoin('teams', 'teams.id', 'tournament_teams.team_id')
    .selectAll('tournament_teams')
    .select([
      'teams.id as t_id',
      'teams.name as t_name',
      'teams.tag as t_tag',
      'teams.logo as t_logo',
      'teams.colors as t_colors',
      'teams.country as t_country',
      'teams.owner_id as t_owner_id',
      'teams.created_at as t_created_at',
      'teams.updated_at as t_updated_at',
    ])
    .where('tournament_teams.tournament_id', 'in', ids)
    .execute();

  return rows.map((t) => ({
    ...t,
    tournamentTeams: ttRows
      .filter((tt) => tt.tournament_id === t.id)
      .map((tt) => ({
        id: tt.id,
        tournament_id: tt.tournament_id,
        team_id: tt.team_id,
        seed: tt.seed,
        registered_at: tt.registered_at,
        team: {
          id: tt.t_id,
          name: tt.t_name,
          tag: tt.t_tag,
          logo: tt.t_logo,
          colors: tt.t_colors,
          country: tt.t_country,
          owner_id: tt.t_owner_id,
          created_at: tt.t_created_at,
          updated_at: tt.t_updated_at,
        },
      })),
  }));
}

export async function getTournament(db: Kysely<Database>, id: string) {
  const tournament = await db
    .selectFrom('tournaments')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst();

  if (!tournament) return undefined;

  const ttRows = await db
    .selectFrom('tournament_teams')
    .innerJoin('teams', 'teams.id', 'tournament_teams.team_id')
    .selectAll('tournament_teams')
    .select([
      'teams.id as t_id',
      'teams.name as t_name',
      'teams.tag as t_tag',
      'teams.logo as t_logo',
      'teams.colors as t_colors',
      'teams.country as t_country',
      'teams.owner_id as t_owner_id',
      'teams.created_at as t_created_at',
      'teams.updated_at as t_updated_at',
    ])
    .where('tournament_teams.tournament_id', '=', id)
    .execute();

  const teamIds = ttRows.map((tt) => tt.t_id);
  const playerRows = teamIds.length > 0
    ? await db.selectFrom('players').selectAll().where('team_id', 'in', teamIds).execute()
    : [];

  const bracket = await db
    .selectFrom('brackets')
    .selectAll()
    .where('tournament_id', '=', id)
    .executeTakeFirst();

  const matchRows = await db
    .selectFrom('matches')
    .selectAll()
    .where('tournament_id', '=', id)
    .orderBy('round_number', 'asc')
    .orderBy('match_number', 'asc')
    .execute();

  const matchIds = matchRows.map((m) => m.id);
  const gameRows = matchIds.length > 0
    ? await db.selectFrom('match_games').selectAll().where('match_id', 'in', matchIds).execute()
    : [];

  const allTeamIds = [
    ...matchRows.map((m) => m.blue_team_id).filter(Boolean),
    ...matchRows.map((m) => m.red_team_id).filter(Boolean),
  ] as string[];
  const uniqueTeamIds = [...new Set(allTeamIds)];
  const matchTeams = uniqueTeamIds.length > 0
    ? await db.selectFrom('teams').selectAll().where('id', 'in', uniqueTeamIds).execute()
    : [];
  const teamMap = Object.fromEntries(matchTeams.map((t) => [t.id, t]));

  return {
    ...tournament,
    tournamentTeams: ttRows.map((tt) => ({
      id: tt.id,
      tournament_id: tt.tournament_id,
      team_id: tt.team_id,
      seed: tt.seed,
      registered_at: tt.registered_at,
      team: {
        id: tt.t_id,
        name: tt.t_name,
        tag: tt.t_tag,
        logo: tt.t_logo,
        colors: tt.t_colors,
        country: tt.t_country,
        owner_id: tt.t_owner_id,
        created_at: tt.t_created_at,
        updated_at: tt.t_updated_at,
        players: playerRows.filter((p) => p.team_id === tt.t_id),
      },
    })),
    bracket: bracket ?? null,
    matches: matchRows.map((m) => ({
      ...m,
      blueTeam: m.blue_team_id ? teamMap[m.blue_team_id] ?? null : null,
      redTeam: m.red_team_id ? teamMap[m.red_team_id] ?? null : null,
      games: gameRows.filter((g) => g.match_id === m.id),
    })),
  };
}

export async function createTournament(
  db: Kysely<Database>,
  data: {
    name: string;
    type: 'ladder' | 'swiss' | 'round_robin' | 'groups';
    format: 'bo1' | 'bo3' | 'bo5';
    organizerId: string;
    description?: string;
    logo?: unknown;
    startDate?: Date;
    endDate?: Date;
  },
) {
  return db
    .insertInto('tournaments')
    .values({
      name: data.name,
      type: data.type,
      format: data.format,
      organizer_id: data.organizerId,
      description: data.description ?? null,
      logo: data.logo ? JSON.stringify(data.logo) : null,
      start_date: data.startDate ?? null,
      end_date: data.endDate ?? null,
    })
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function updateTournament(
  db: Kysely<Database>,
  id: string,
  data: Partial<{
    name: string;
    type: 'ladder' | 'swiss' | 'round_robin' | 'groups';
    format: 'bo1' | 'bo3' | 'bo5';
    status: 'draft' | 'registration' | 'active' | 'completed' | 'cancelled';
    description: string;
    logo: unknown;
    startDate: Date;
    endDate: Date;
  }>,
) {
  const set: Record<string, unknown> = { updated_at: new Date() };
  if (data.name !== undefined) set.name = data.name;
  if (data.type !== undefined) set.type = data.type;
  if (data.format !== undefined) set.format = data.format;
  if (data.status !== undefined) set.status = data.status;
  if (data.description !== undefined) set.description = data.description;
  if (data.logo !== undefined) set.logo = JSON.stringify(data.logo);
  if (data.startDate !== undefined) set.start_date = data.startDate;
  if (data.endDate !== undefined) set.end_date = data.endDate;

  return db
    .updateTable('tournaments')
    .set(set)
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirst();
}

export async function deleteTournament(db: Kysely<Database>, id: string) {
  await db.deleteFrom('tournaments').where('id', '=', id).execute();
}

export async function registerTeam(db: Kysely<Database>, tournamentId: string, teamId: string, seed?: number) {
  return db
    .insertInto('tournament_teams')
    .values({ tournament_id: tournamentId, team_id: teamId, seed: seed ?? null })
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function unregisterTeam(db: Kysely<Database>, tournamentId: string, teamId: string) {
  await db
    .deleteFrom('tournament_teams')
    .where('tournament_id', '=', tournamentId)
    .where('team_id', '=', teamId)
    .execute();
}

export async function saveBracket(db: Kysely<Database>, tournamentId: string, data: unknown) {
  const existing = await db
    .selectFrom('brackets')
    .selectAll()
    .where('tournament_id', '=', tournamentId)
    .executeTakeFirst();

  if (existing) {
    return db
      .updateTable('brackets')
      .set({ data: JSON.stringify(data), updated_at: new Date() })
      .where('id', '=', existing.id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  return db
    .insertInto('brackets')
    .values({ tournament_id: tournamentId, data: JSON.stringify(data) })
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function createMatch(
  db: Kysely<Database>,
  data: {
    tournamentId: string;
    blueTeamId?: string;
    redTeamId?: string;
    format: 'bo1' | 'bo3' | 'bo5';
    roundNumber?: number;
    roundName?: string;
    matchNumber?: number;
    scheduledAt?: Date;
  },
) {
  return db
    .insertInto('matches')
    .values({
      tournament_id: data.tournamentId,
      blue_team_id: data.blueTeamId ?? null,
      red_team_id: data.redTeamId ?? null,
      format: data.format,
      round_number: data.roundNumber ?? null,
      round_name: data.roundName ?? null,
      match_number: data.matchNumber ?? null,
      scheduled_at: data.scheduledAt ?? null,
    })
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function updateMatch(
  db: Kysely<Database>,
  id: string,
  data: Partial<{
    status: 'scheduled' | 'live' | 'completed' | 'cancelled';
    scoreBlue: number;
    scoreRed: number;
    completedAt: Date;
  }>,
) {
  const set: Record<string, unknown> = { updated_at: new Date() };
  if (data.status !== undefined) set.status = data.status;
  if (data.scoreBlue !== undefined) set.score_blue = data.scoreBlue;
  if (data.scoreRed !== undefined) set.score_red = data.scoreRed;
  if (data.completedAt !== undefined) set.completed_at = data.completedAt;

  return db
    .updateTable('matches')
    .set(set)
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirst();
}

export async function recordGameResult(
  db: Kysely<Database>,
  data: {
    matchId: string;
    gameNumber: number;
    winnerId: string;
    draftSessionId?: string;
    duration?: number;
  },
) {
  return db
    .insertInto('match_games')
    .values({
      match_id: data.matchId,
      game_number: data.gameNumber,
      winner_id: data.winnerId,
      draft_session_id: data.draftSessionId ?? null,
      duration: data.duration ?? null,
      completed_at: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function getMatch(db: Kysely<Database>, id: string) {
  const match = await db
    .selectFrom('matches')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst();

  if (!match) return undefined;

  const [blueTeam, redTeam, games] = await Promise.all([
    match.blue_team_id
      ? db.selectFrom('teams').selectAll().where('id', '=', match.blue_team_id).executeTakeFirst()
      : null,
    match.red_team_id
      ? db.selectFrom('teams').selectAll().where('id', '=', match.red_team_id).executeTakeFirst()
      : null,
    db.selectFrom('match_games').selectAll().where('match_id', '=', id).execute(),
  ]);

  return { ...match, blueTeam: blueTeam ?? null, redTeam: redTeam ?? null, games };
}
