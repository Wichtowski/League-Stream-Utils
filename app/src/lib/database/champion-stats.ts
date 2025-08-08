import { Schema, models, model } from "mongoose";
import { connectToDatabase } from "./connection";
import type { GameResult, TournamentChampionStats, PlayerRole, ChampionStats } from "@lib/types";
import { getChampionById } from "@lib/champions";

const ChampionStatsSchema = new Schema({
  championId: { type: Number, required: true },
  championName: { type: String, required: true },
  championKey: { type: String, required: true },
  image: { type: String, required: true },

  totalPicks: { type: Number, default: 0 },
  totalBans: { type: Number, default: 0 },
  blueSidePicks: { type: Number, default: 0 },
  blueSideBans: { type: Number, default: 0 },
  redSidePicks: { type: Number, default: 0 },
  redSideBans: { type: Number, default: 0 },

  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },

  pickRate: { type: Number, default: 0 },
  banRate: { type: Number, default: 0 },
  presenceRate: { type: Number, default: 0 },

  roleDistribution: {
    TOP: { type: Number, default: 0 },
    JUNGLE: { type: Number, default: 0 },
    MID: { type: Number, default: 0 },
    ADC: { type: Number, default: 0 },
    SUPPORT: { type: Number, default: 0 }
  },

  lastUpdated: { type: Date, default: Date.now }
});

const TournamentChampionStatsSchema = new Schema({
  tournamentId: { type: String, required: true, unique: true },
  totalGames: { type: Number, default: 0 },
  totalMatches: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
  championStats: [ChampionStatsSchema]
});

const GameResultSchema = new Schema({
  sessionId: { type: String, required: true, unique: true },
  tournamentId: { type: String },
  gameNumber: { type: Number, required: true },
  gameDuration: { type: Number },
  patch: { type: String, required: true },
  completedAt: { type: Date, default: Date.now },

  blueTeam: {
    teamId: { type: String },
    teamName: { type: String, required: true },
    won: { type: Boolean, required: true },
    picks: [
      {
        championId: { type: Number, required: true },
        role: {
          type: String,
          enum: ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"]
        },
        player: { type: String }
      }
    ],
    bans: [{ type: Number }]
  },

  redTeam: {
    teamId: { type: String },
    teamName: { type: String, required: true },
    won: { type: Boolean, required: true },
    picks: [
      {
        championId: { type: Number, required: true },
        role: {
          type: String,
          enum: ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"]
        },
        player: { type: String }
      }
    ],
    bans: [{ type: Number }]
  }
});

const TournamentChampionStatsModel =
  models.TournamentChampionStats || model("TournamentChampionStats", TournamentChampionStatsSchema);

const GameResultModel = models.GameResult || model("GameResult", GameResultSchema);

export async function recordGameResult(gameResult: GameResult): Promise<void> {
  await connectToDatabase();

  try {
    await GameResultModel.findOneAndUpdate({ sessionId: gameResult.sessionId }, gameResult, {
      upsert: true,
      new: true
    });

    if (gameResult.tournamentId) {
      await updateChampionStats(gameResult.tournamentId, gameResult);
    }
  } catch (error) {
    console.error("Error recording game result:", error);
    throw error;
  }
}

export async function updateChampionStats(tournamentId: string, gameResult: GameResult): Promise<void> {
  await connectToDatabase();

  try {
    let tournamentStats = await TournamentChampionStatsModel.findOne({
      tournamentId
    });

    if (!tournamentStats) {
      tournamentStats = new TournamentChampionStatsModel({
        tournamentId,
        totalGames: 0,
        totalMatches: 0,
        championStats: []
      });
    }

    tournamentStats.totalGames += 1;
    tournamentStats.lastUpdated = new Date();

    const allPicks = [...gameResult.blueTeam.picks, ...gameResult.redTeam.picks];
    const allBans = [...gameResult.blueTeam.bans, ...gameResult.redTeam.bans];

    for (const pick of allPicks) {
      await updateChampionStat(tournamentStats, pick.championId, "pick", {
        side: allPicks.indexOf(pick) < 5 ? "blue" : "red",
        won: allPicks.indexOf(pick) < 5 ? gameResult.blueTeam.won : gameResult.redTeam.won,
        role: pick.role
      });
    }

    for (let i = 0; i < allBans.length; i++) {
      const championId = allBans[i];
      const side = i < gameResult.blueTeam.bans.length ? "blue" : "red";
      await updateChampionStat(tournamentStats, championId, "ban", { side });
    }

    for (const champStat of tournamentStats.championStats) {
      champStat.pickRate = (champStat.totalPicks / tournamentStats.totalGames) * 100;
      champStat.banRate = (champStat.totalBans / tournamentStats.totalGames) * 100;
      champStat.presenceRate = ((champStat.totalPicks + champStat.totalBans) / tournamentStats.totalGames) * 100;
      champStat.lastUpdated = new Date();
    }

    await tournamentStats.save();
  } catch (error) {
    console.error("Error updating champion stats:", error);
    throw error;
  }
}

async function updateChampionStat(
  tournamentStats: TournamentChampionStats,
  championId: number,
  action: "pick" | "ban",
  metadata: { side: "blue" | "red"; won?: boolean; role?: PlayerRole }
): Promise<void> {
  let champStat = tournamentStats.championStats.find((stat: ChampionStats) => stat.championId === championId);

  if (!champStat) {
    const champion = getChampionById(championId);
    if (!champion) return;

    champStat = {
      championId,
      championName: champion.name,
      championKey: champion.key,
      image: champion.image,
      totalPicks: 0,
      totalBans: 0,
      blueSidePicks: 0,
      blueSideBans: 0,
      redSidePicks: 0,
      redSideBans: 0,
      wins: 0,
      losses: 0,
      pickRate: 0,
      banRate: 0,
      presenceRate: 0,
      roleDistribution: {
        TOP: 0,
        JUNGLE: 0,
        MID: 0,
        ADC: 0,
        SUPPORT: 0
      },
      lastUpdated: new Date()
    };

    tournamentStats.championStats.push(champStat);
  }

  if (action === "pick") {
    champStat.totalPicks += 1;
    if (metadata.side === "blue") champStat.blueSidePicks += 1;
    else champStat.redSidePicks += 1;

    if (metadata.won !== undefined) {
      if (metadata.won) champStat.wins += 1;
      else champStat.losses += 1;
    }

    if (metadata.role) {
      champStat.roleDistribution[metadata.role] += 1;
    }
  } else if (action === "ban") {
    champStat.totalBans += 1;
    if (metadata.side === "blue") champStat.blueSideBans += 1;
    else champStat.redSideBans += 1;
  }
}

export async function getTournamentChampionStats(tournamentId: string): Promise<TournamentChampionStats | null> {
  await connectToDatabase();

  try {
    const statsDoc = await TournamentChampionStatsModel.findOne({
      tournamentId
    });
    if (!statsDoc) return null;

    const stats = statsDoc.toObject();

    // Generate meta insights
    const championStats = stats.championStats || [];

    const topPicks = [...championStats].sort((a, b) => b.totalPicks - a.totalPicks).slice(0, 10);

    const topBans = [...championStats].sort((a, b) => b.totalBans - a.totalBans).slice(0, 10);

    const topPresence = [...championStats].sort((a, b) => b.presenceRate - a.presenceRate).slice(0, 10);

    const blueSidePriority = [...championStats]
      .filter((stat) => stat.totalPicks > 0)
      .sort((a, b) => b.blueSidePicks / Math.max(b.totalPicks, 1) - a.blueSidePicks / Math.max(a.totalPicks, 1))
      .slice(0, 10);

    const redSidePriority = [...championStats]
      .filter((stat) => stat.totalPicks > 0)
      .sort((a, b) => b.redSidePicks / Math.max(b.totalPicks, 1) - a.redSidePicks / Math.max(a.totalPicks, 1))
      .slice(0, 10);

    return {
      tournamentId: stats.tournamentId,
      totalGames: stats.totalGames,
      totalMatches: stats.totalMatches,
      lastUpdated: stats.lastUpdated,
      championStats,
      topPicks,
      topBans,
      topPresence,
      blueSidePriority,
      redSidePriority
    };
  } catch (error) {
    console.error("Error getting tournament champion stats:", error);
    return null;
  }
}

/**
 * Get champion statistics formatted for OBS consumption
 */
export async function getChampionStatsForOBS(tournamentId: string): Promise<{
  tournament: { id: string; totalGames: number; lastUpdated: Date };
  topPicks: Array<{
    champion: { id: number; name: string; image: string };
    picks: number;
    pickRate: number;
    winRate: number;
  }>;
  topBans: Array<{
    champion: { id: number; name: string; image: string };
    bans: number;
    banRate: number;
  }>;
  topPresence: Array<{
    champion: { id: number; name: string; image: string };
    presence: number;
    picks: number;
    bans: number;
  }>;
} | null> {
  const stats = await getTournamentChampionStats(tournamentId);
  if (!stats) return null;

  return {
    tournament: {
      id: tournamentId,
      totalGames: stats.totalGames,
      lastUpdated: stats.lastUpdated
    },
    topPicks: stats.topPicks.slice(0, 5).map((stat) => ({
      champion: {
        id: stat.championId,
        name: stat.championName,
        image: stat.image
      },
      picks: stat.totalPicks,
      pickRate: Math.round(stat.pickRate * 10) / 10,
      winRate: stat.totalPicks > 0 ? Math.round((stat.wins / (stat.wins + stat.losses)) * 1000) / 10 : 0
    })),
    topBans: stats.topBans.slice(0, 5).map((stat) => ({
      champion: {
        id: stat.championId,
        name: stat.championName,
        image: stat.image
      },
      bans: stat.totalBans,
      banRate: Math.round(stat.banRate * 10) / 10
    })),
    topPresence: stats.topPresence.slice(0, 5).map((stat) => ({
      champion: {
        id: stat.championId,
        name: stat.championName,
        image: stat.image
      },
      presence: Math.round(stat.presenceRate * 10) / 10,
      picks: stat.totalPicks,
      bans: stat.totalBans
    }))
  };
}
