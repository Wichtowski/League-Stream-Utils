// Connection
export { connectToDatabase, isConnectionEstablished } from "./connection";

export { createUser, getUserByUsername, getUserByEmail, updateUserSessionCount, canUserCreateSession } from "./user";

export {
  createGameSession,
  saveGameSession,
  getGameSession,
  updateGameSession,
  deleteGameSession,
  getAllGameSessions,
  cleanupOldSessions,
  getUsedChampionsInSeries,
  addUsedChampion
} from "@libPickban/database";

export { GameSessionModel, UserModel } from "./models";
export { GameSessionSchema, UserSchema } from "./schemas";

export {
  recordGameResult,
  getTournamentChampionStats,
  updateChampionStats,
  getChampionStatsForOBS
} from "./champion-stats";
