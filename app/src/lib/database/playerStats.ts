import { connectToDatabase } from "./connection";
import { PlayerStatsModel } from "./models";

export interface CreatePlayerStatsRequest {
  playerId: string;
  teamId: string;
  gameId: string;
  tournamentId?: string;
  matchId?: string;
  championId: number;
  championName: string;
  championRole: "TOP" | "JUNGLE" | "MID" | "BOTTOM" | "SUPPORT";
  championLane: string;
  championLevel: number;
  championMastery?: number;
  championPoints?: number;
  side: "blue" | "red";
  gameMode: string;
  queueType: string;
  patch: string;
  duration: number;
  result: "win" | "loss";
  surrender?: boolean;
  remake?: boolean;
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
  tournament?: {
    round: string;
    matchNumber: number;
    seriesId?: string;
  };
  playedAt: Date;
}

export interface UpdatePlayerStatsRequest extends Partial<CreatePlayerStatsRequest> {
  id: string;
}

export interface PlayerStatsQuery {
  playerId?: string;
  teamId?: string;
  tournamentId?: string;
  matchId?: string;
  championId?: number;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

const convertMongoDoc = (doc: any): any => {
  const obj = doc.toObject();
  return {
    ...obj,
    _id: obj._id.toString(),
    playedAt: new Date(obj.playedAt),
    recordedAt: new Date(obj.recordedAt),
    createdAt: new Date(obj.createdAt),
    updatedAt: new Date(obj.updatedAt)
  };
};

export const createPlayerStats = async (statsData: CreatePlayerStatsRequest): Promise<any> => {
  await connectToDatabase();

  const newStats = new PlayerStatsModel({
    ...statsData,
    recordedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  });

  await newStats.save();
  return convertMongoDoc(newStats);
};

export const updatePlayerStats = async (
  id: string,
  updates: Partial<CreatePlayerStatsRequest>
): Promise<any | null> => {
  await connectToDatabase();

  const updatedStats = await PlayerStatsModel.findByIdAndUpdate(
    id,
    {
      ...updates,
      updatedAt: new Date()
    },
    { new: true }
  );

  if (!updatedStats) return null;
  return convertMongoDoc(updatedStats);
};

export const deletePlayerStats = async (id: string): Promise<boolean> => {
  await connectToDatabase();

  const result = await PlayerStatsModel.findByIdAndDelete(id);
  return !!result;
};

export const getPlayerStatsById = async (id: string): Promise<any | null> => {
  await connectToDatabase();

  const stats = await PlayerStatsModel.findById(id);
  if (!stats) return null;
  return convertMongoDoc(stats);
};

export const getPlayerStats = async (query: PlayerStatsQuery): Promise<any[]> => {
  await connectToDatabase();

  const filter: any = {};

  if (query.playerId) filter.playerId = query.playerId;
  if (query.teamId) filter.teamId = query.teamId;
  if (query.tournamentId) filter.tournamentId = query.tournamentId;
  if (query.matchId) filter.matchId = query.matchId;
  if (query.championId) filter.championId = query.championId;

  if (query.startDate || query.endDate) {
    filter.playedAt = {};
    if (query.startDate) filter.playedAt.$gte = query.startDate;
    if (query.endDate) filter.playedAt.$lte = query.endDate;
  }

  const queryBuilder = PlayerStatsModel.find(filter).sort({ playedAt: -1 });

  if (query.offset) queryBuilder.skip(query.offset);
  if (query.limit) queryBuilder.limit(query.limit);

  const stats = await queryBuilder.exec();
  return stats.map(convertMongoDoc);
};

export const getPlayerStatsByPlayer = async (playerId: string, limit: number = 50): Promise<any[]> => {
  return getPlayerStats({ playerId, limit });
};

export const getPlayerStatsByTeam = async (teamId: string, limit: number = 50): Promise<any[]> => {
  return getPlayerStats({ teamId, limit });
};

export const getPlayerStatsByTournament = async (tournamentId: string, limit: number = 100): Promise<any[]> => {
  return getPlayerStats({ tournamentId, limit });
};

export const getPlayerStatsByMatch = async (matchId: string): Promise<any[]> => {
  return getPlayerStats({ matchId });
};

export const getPlayerChampionStats = async (
  playerId: string,
  championId: number,
  limit: number = 20
): Promise<any[]> => {
  return getPlayerStats({ playerId, championId, limit });
};

export const getPlayerCareerStats = async (playerId: string): Promise<any> => {
  await connectToDatabase();

  const pipeline = [
    { $match: { playerId } },
    {
      $group: {
        _id: null,
        totalGames: { $sum: 1 },
        totalWins: { $sum: { $cond: [{ $eq: ["$result", "win"] }, 1, 0] } },
        totalLosses: { $sum: { $cond: [{ $eq: ["$result", "loss"] }, 1, 0] } },
        totalKills: { $sum: "$stats.kda.kills" },
        totalDeaths: { $sum: "$stats.kda.deaths" },
        totalAssists: { $sum: "$stats.kda.assists" },
        totalCS: { $sum: "$stats.cs" },
        totalGold: { $sum: "$stats.gold" },
        totalDamageDealt: { $sum: "$stats.damageDealt" },
        totalDamageTaken: { $sum: "$stats.damageTaken" },
        totalVisionScore: { $sum: "$stats.visionScore" },
        totalWardsPlaced: { $sum: "$stats.wardsPlaced" },
        totalWardsDestroyed: { $sum: "$stats.wardsDestroyed" },
        totalDuration: { $sum: "$duration" },
        avgCS: { $avg: "$stats.csPerMinute" },
        avgGold: { $avg: "$stats.goldPerMinute" },
        avgDamageDealt: { $avg: "$stats.damageDealt" },
        avgDamageTaken: { $avg: "$stats.damageTaken" },
        avgVisionScore: { $avg: "$stats.visionScore" }
      }
    },
    {
      $project: {
        _id: 0,
        totalGames: 1,
        totalWins: 1,
        totalLosses: 1,
        winRate: { $multiply: [{ $divide: ["$totalWins", "$totalGames"] }, 100] },
        totalKills: 1,
        totalDeaths: 1,
        totalAssists: 1,
        avgKDA: { $divide: [{ $add: ["$totalKills", "$totalAssists"] }, { $max: ["$totalDeaths", 1] }] },
        totalCS: 1,
        totalGold: 1,
        totalDamageDealt: 1,
        totalDamageTaken: 1,
        totalVisionScore: 1,
        totalWardsPlaced: 1,
        totalWardsDestroyed: 1,
        totalDuration: 1,
        avgCS: { $round: ["$avgCS", 2] },
        avgGold: { $round: ["$avgGold", 2] },
        avgDamageDealt: { $round: ["$avgDamageDealt", 2] },
        avgDamageTaken: { $round: ["$avgDamageTaken", 2] },
        avgVisionScore: { $round: ["$avgVisionScore", 2] }
      }
    }
  ];

  const result = await PlayerStatsModel.aggregate(pipeline);
  return result[0] || null;
};

export const getPlayerChampionMastery = async (playerId: string): Promise<any[]> => {
  await connectToDatabase();

  const pipeline = [
    { $match: { playerId } },
    {
      $group: {
        _id: {
          championId: "$championId",
          championName: "$championName"
        },
        gamesPlayed: { $sum: 1 },
        wins: { $sum: { $cond: [{ $eq: ["$result", "win"] }, 1, 0] } },
        totalKills: { $sum: "$stats.kda.kills" },
        totalDeaths: { $sum: "$stats.kda.deaths" },
        totalAssists: { $sum: "$stats.kda.assists" },
        totalCS: { $sum: "$stats.cs" },
        totalGold: { $sum: "$stats.gold" },
        totalDamageDealt: { $sum: "$stats.damageDealt" },
        avgCS: { $avg: "$stats.csPerMinute" },
        avgGold: { $avg: "$stats.goldPerMinute" },
        avgDamageDealt: { $avg: "$stats.damageDealt" },
        lastPlayed: { $max: "$playedAt" }
      }
    },
    {
      $project: {
        _id: 0,
        championId: "$_id.championId",
        championName: "$_id.championName",
        gamesPlayed: 1,
        wins: 1,
        winRate: { $multiply: [{ $divide: ["$wins", "$gamesPlayed"] }, 100] },
        totalKills: 1,
        totalDeaths: 1,
        totalAssists: 1,
        avgKDA: { $divide: [{ $add: ["$totalKills", "$totalAssists"] }, { $max: ["$totalDeaths", 1] }] },
        totalCS: 1,
        totalGold: 1,
        totalDamageDealt: 1,
        avgCS: { $round: ["$avgCS", 2] },
        avgGold: { $round: ["$avgGold", 2] },
        avgDamageDealt: { $round: ["$avgDamageDealt", 2] },
        lastPlayed: 1
      }
    },
    { $sort: { gamesPlayed: -1, winRate: -1 } }
  ];

  const result = await PlayerStatsModel.aggregate(pipeline);
  return result;
};

export const bulkCreatePlayerStats = async (statsArray: CreatePlayerStatsRequest[]): Promise<any[]> => {
  await connectToDatabase();

  const statsWithTimestamps = statsArray.map((stats) => ({
    ...stats,
    recordedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  const createdStats = await PlayerStatsModel.insertMany(statsWithTimestamps);
  return createdStats.map(convertMongoDoc);
};

export const deletePlayerStatsByGame = async (gameId: string): Promise<boolean> => {
  await connectToDatabase();

  const result = await PlayerStatsModel.deleteMany({ gameId });
  return result.deletedCount > 0;
};

export const deletePlayerStatsByMatch = async (matchId: string): Promise<boolean> => {
  await connectToDatabase();

  const result = await PlayerStatsModel.deleteMany({ matchId });
  return result.deletedCount > 0;
};
