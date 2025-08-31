import { bulkCreatePlayerStats, deletePlayerStatsByMatch } from "@lib/database/playerStats";
import type { CreatePlayerStatsRequest } from "@lib/database/playerStats";

export interface MatchPlayerData {
  playerId: string;
  teamId: string;
  championId: number;
  championName: string;
  championRole: "TOP" | "JUNGLE" | "MID" | "BOTTOM" | "SUPPORT";
  championLane: string;
  championLevel: number;
  championMastery?: number;
  championPoints?: number;
  side: "blue" | "red";
  result: "win" | "loss";
  stats: {
    kda: { kills: number; deaths: number; assists: number };
    cs: number;
    csPerMinute: number;
    gold: number;
    goldPerMinute: number;
    damageDealt: number;
    damageTaken: number;
    visionScore: number;
    wardsPlaced: number;
    wardsDestroyed: number;
    objectiveParticipation: {
      baron: boolean;
      dragon: boolean;
      herald: boolean;
      towers: number;
    };
    firstBlood: boolean;
    firstTower: boolean;
  };
}

export interface MatchData {
  gameId: string;
  tournamentId?: string;
  matchId?: string;
  gameMode: string;
  queueType: string;
  patch: string;
  duration: number;
  surrender: boolean;
  remake: boolean;
  tournament?: {
    round: string;
    matchNumber: number;
    seriesId?: string;
  };
  playedAt: Date;
  blueTeam: MatchPlayerData[];
  redTeam: MatchPlayerData[];
}

export const createPlayerStatsFromMatch = async (matchData: MatchData): Promise<boolean> => {
  try {
    const playerStats: CreatePlayerStatsRequest[] = [];

    // Process blue team players
    matchData.blueTeam.forEach((player) => {
      playerStats.push({
        playerId: player.playerId,
        teamId: player.teamId,
        gameId: matchData.gameId,
        tournamentId: matchData.tournamentId,
        matchId: matchData.matchId,
        championId: player.championId,
        championName: player.championName,
        championRole: player.championRole,
        championLane: player.championLane,
        championLevel: player.championLevel,
        championMastery: player.championMastery,
        championPoints: player.championPoints,
        side: player.side,
        gameMode: matchData.gameMode,
        queueType: matchData.queueType,
        patch: matchData.patch,
        duration: matchData.duration,
        result: player.result,
        surrender: matchData.surrender,
        remake: matchData.remake,
        stats: player.stats,
        tournament: matchData.tournament,
        playedAt: matchData.playedAt
      });
    });

    // Process red team players
    matchData.redTeam.forEach((player) => {
      playerStats.push({
        playerId: player.playerId,
        teamId: player.teamId,
        gameId: matchData.gameId,
        tournamentId: matchData.tournamentId,
        matchId: matchData.matchId,
        championId: player.championId,
        championName: player.championName,
        championRole: player.championRole,
        championLane: player.championLane,
        championLevel: player.championLevel,
        championMastery: player.championMastery,
        championPoints: player.championPoints,
        side: player.side,
        gameMode: matchData.gameMode,
        queueType: matchData.queueType,
        patch: matchData.patch,
        duration: matchData.duration,
        result: player.result,
        surrender: matchData.surrender,
        remake: matchData.remake,
        stats: player.stats,
        tournament: matchData.tournament,
        playedAt: matchData.playedAt
      });
    });

    // Bulk create all player stats
    await bulkCreatePlayerStats(playerStats);
    return true;
  } catch (error) {
    console.error("Error creating player stats from match:", error);
    return false;
  }
};

export const updatePlayerStatsFromMatch = async (matchData: MatchData): Promise<boolean> => {
  try {
    // First delete existing stats for this match
    if (matchData.matchId) {
      await deletePlayerStatsByMatch(matchData.matchId);
    }

    // Then create new stats
    return await createPlayerStatsFromMatch(matchData);
  } catch (error) {
    console.error("Error updating player stats from match:", error);
    return false;
  }
};

export const deletePlayerStatsForMatch = async (matchId: string): Promise<boolean> => {
  try {
    return await deletePlayerStatsByMatch(matchId);
  } catch (error) {
    console.error("Error deleting player stats for match:", error);
    return false;
  }
};

// Helper function to calculate CS per minute
export const calculateCSperMinute = (cs: number, duration: number): number => {
  const minutes = duration / 60;
  return minutes > 0 ? cs / minutes : 0;
};

// Helper function to calculate gold per minute
export const calculateGoldPerMinute = (gold: number, duration: number): number => {
  const minutes = duration / 60;
  return minutes > 0 ? gold / minutes : 0;
};

// Helper function to validate player stats
export const validatePlayerStats = (stats: any): boolean => {
  if (!stats || typeof stats !== "object") return false;

  const requiredFields = ["kda", "cs", "gold", "damageDealt", "damageTaken", "visionScore"];
  return requiredFields.every((field) => stats[field] !== undefined);
};

// Helper function to create default player stats
export const createDefaultPlayerStats = (): MatchPlayerData["stats"] => ({
  kda: { kills: 0, deaths: 0, assists: 0 },
  cs: 0,
  csPerMinute: 0,
  gold: 0,
  goldPerMinute: 0,
  damageDealt: 0,
  damageTaken: 0,
  visionScore: 0,
  wardsPlaced: 0,
  wardsDestroyed: 0,
  objectiveParticipation: {
    baron: false,
    dragon: false,
    herald: false,
    towers: 0
  },
  firstBlood: false,
  firstTower: false
});
