import { v4 as uuidv4 } from "uuid";
import type { GameSession, Champion, GameConfig, WSMessage, GameState, PlayerRole } from "@lib/types";
import { getChampionById, getChampions } from "@lib/champions";

import {
  getGameSession as getGameSessionFromDB,
  saveGameSession,
  getAllGameSessions,
  getUsedChampionsInSeries,
  addUsedChampion,
  recordGameResult
} from "@lib/database";

import type { Team } from "@lib/types";

// Pick and ban phase configuration - 22 turns total
const PICK_BAN_ORDER = [
  // Ban phase 1 (6 bans)
  { phase: "ban1", team: "blue", type: "ban" },
  { phase: "ban1", team: "red", type: "ban" },
  { phase: "ban1", team: "blue", type: "ban" },
  { phase: "ban1", team: "red", type: "ban" },
  { phase: "ban1", team: "blue", type: "ban" },
  { phase: "ban1", team: "red", type: "ban" },

  // Pick phase 1 (6 picks)
  { phase: "pick1", team: "blue", type: "pick" },
  { phase: "pick1", team: "red", type: "pick" },
  { phase: "pick1", team: "red", type: "pick" },
  { phase: "pick1", team: "blue", type: "pick" },
  { phase: "pick1", team: "blue", type: "pick" },
  { phase: "pick1", team: "red", type: "pick" },

  // Ban phase 2 (4 bans)
  { phase: "ban2", team: "red", type: "ban" },
  { phase: "ban2", team: "blue", type: "ban" },
  { phase: "ban2", team: "red", type: "ban" },
  { phase: "ban2", team: "blue", type: "ban" },

  // Pick phase 2 (6 picks)
  { phase: "pick2", team: "red", type: "pick" },
  { phase: "pick2", team: "blue", type: "pick" },
  { phase: "pick2", team: "blue", type: "pick" },
  { phase: "pick2", team: "red", type: "pick" },
  { phase: "pick2", team: "red", type: "pick" },
  { phase: "pick2", team: "blue", type: "pick" }
];

// Timer management
const TIMER_DURATIONS = {
  ban: 27000, // 27 seconds for bans
  pick: 27000, // 27 seconds for picks
  finalization: 59000, // 59 seconds for finalization
  lobby: 0
};

const timers = new Map<string, NodeJS.Timeout>();

export async function createGameSession(config?: Partial<GameConfig>): Promise<GameSession> {
  const sessionId = uuidv4();

  const currentPatch = config?.patchName || "14.24";

  const defaultConfig: GameConfig = {
    seriesType: "BO1",
    currentGame: 1,
    totalGames: 1,
    isFearlessDraft: false,
    patchName: currentPatch,
    ...config
  };

  if (defaultConfig.seriesType === "BO3") {
    defaultConfig.totalGames = 3;
  } else if (defaultConfig.seriesType === "BO5") {
    defaultConfig.totalGames = 5;
  }

  // Generate a random 6-character password
  const generatePassword = (): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const session: GameSession = {
    id: sessionId,
    type: "web",
    teams: {
      blue: {
        id: uuidv4(),
        name: defaultConfig.blueTeamName || "Blue Team",
        side: "blue",
        bans: [],
        picks: [],
        isReady: false,
        coach: defaultConfig.blueCoach,
        usedChampions: [],
        logo: defaultConfig.blueTeamId as string
      },
      red: {
        id: uuidv4(),
        name: defaultConfig.redTeamName || "Red Team",
        side: "red",
        bans: [],
        picks: [],
        isReady: false,
        coach: defaultConfig.redCoach,
        usedChampions: [],
        logo: defaultConfig.redTeamId as string
      }
    },
    phase: "config",
    currentTeam: "blue",
    turnNumber: 0,
    createdAt: new Date(),
    lastActivity: new Date(),
    timer: {
      remaining: 0,
      totalTime: 0,
      isActive: false
    },
    bothTeamsReady: false,
    config: defaultConfig,
    seriesScore: { blue: 0, red: 0 },
    gameHistory: [],
    // Real-time pick/ban fields
    password: generatePassword(),
    teamReadiness: {
      blue: false,
      red: false
    },
    sessionState: "waiting",
    connectedTeams: {
      blue: false,
      red: false
    }
  };

  const savedSession = await saveGameSession(session);
  return savedSession;
}

export async function getGameSession(sessionId: string): Promise<GameSession | null> {
  const session = await getGameSessionFromDB(sessionId);

  // If session exists but doesn't have a password, generate one
  if (session && !session.password && session.type === "web") {
    const generatePassword = (): string => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let result = "";
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    const password = generatePassword();
    const updatedSession = await updateGameSession(sessionId, { password });
    return updatedSession;
  }

  return session;
}

export async function updateGameSession(sessionId: string, updates: Partial<GameSession>): Promise<GameSession | null> {
  const session = await getGameSession(sessionId);
  if (!session) return null;

  const updatedSession = { ...session, ...updates };
  updatedSession.lastActivity = new Date();

  return await saveGameSession(updatedSession);
}

export async function updateGameConfig(sessionId: string, config: Partial<GameConfig>): Promise<GameSession | null> {
  const session = await getGameSession(sessionId);
  if (!session) return null;

  session.config = { ...session.config, ...config };

  if (config.blueTeamName) {
    session.teams.blue.name = config.blueTeamName;
  }
  if (config.redTeamName) {
    session.teams.red.name = config.redTeamName;
  }

  if (config.blueTeamId !== undefined) {
    session.teams.blue.logo = config.blueTeamId;
  }
  if (config.redTeamId !== undefined) {
    session.teams.red.logo = config.redTeamId;
  }

  if (config.blueCoach) {
    session.teams.blue.coach = config.blueCoach;
  }
  if (config.redCoach) {
    session.teams.red.coach = config.redCoach;
  }

  if (config.seriesType === "BO1") {
    session.config.totalGames = 1;
  } else if (config.seriesType === "BO3") {
    session.config.totalGames = 3;
  } else if (config.seriesType === "BO5") {
    session.config.totalGames = 5;
  }

  session.lastActivity = new Date();
  return await saveGameSession(session);
}

export function getCurrentTurn(
  session: GameSession
): { team: "blue" | "red"; type: "pick" | "ban"; phase: string } | null {
  if (session.turnNumber >= PICK_BAN_ORDER.length) {
    return null;
  }

  return PICK_BAN_ORDER[session.turnNumber] as {
    team: "blue" | "red";
    type: "pick" | "ban";
    phase: string;
  };
}

export async function isChampionAvailable(session: GameSession, championId: number): Promise<boolean> {
  const allBans = [...session.teams.blue.bans, ...session.teams.red.bans];
  const allPicks = [...session.teams.blue.picks, ...session.teams.red.picks];

  const unavailableInCurrentGame =
    allBans.some((c) => c.id === championId) || allPicks.some((c) => c.id === championId);

  if (unavailableInCurrentGame) {
    return false;
  }

  if (session.config.isFearlessDraft) {
    const usedChampions = await getUsedChampionsInSeries(session.id);
    const isUsedInSeries = usedChampions.some((c) => c.id === championId);
    return !isUsedInSeries;
  }

  return true;
}

export function canTeamAct(session: GameSession, teamSide: "blue" | "red"): boolean {
  const currentTurn = getCurrentTurn(session);
  return currentTurn?.team === teamSide;
}

export async function setTeamReady(
  session: GameSession,
  teamSide: "blue" | "red",
  ready: boolean
): Promise<GameSession> {
  session.teams[teamSide].isReady = ready;
  session.bothTeamsReady = session.teams.blue.isReady && session.teams.red.isReady;

  if (session.bothTeamsReady && session.phase === "lobby") {
    await startGame(session);
  }

  session.lastActivity = new Date();
  return await saveGameSession(session);
}

export async function startGame(session: GameSession): Promise<void> {
  session.phase = "ban1";
  session.currentTeam = "blue";
  session.turnNumber = 0;
  await saveGameSession(session);
  startTimer(session);
}

export function startTimer(session: GameSession): void {
  const existingTimer = timers.get(session.id);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  const currentTurn = getCurrentTurn(session);
  if (!currentTurn) return;

  let duration: number;
  if (session.phase === "finalization") {
    duration = TIMER_DURATIONS.finalization;
  } else {
    duration = TIMER_DURATIONS[currentTurn.type] || TIMER_DURATIONS.ban;
  }

  session.timer = {
    remaining: duration,
    totalTime: duration,
    isActive: true,
    startedAt: new Date()
  };

  const timer = setInterval(async () => {
    if (session.timer.remaining <= 0) {
      clearInterval(timer);
      timers.delete(session.id);
      await handleTimerExpired(session);
    } else {
      session.timer.remaining -= 1000;
      session.lastActivity = new Date();
      await saveGameSession(session);
    }
  }, 1000);

  timers.set(session.id, timer);
}

export function stopTimer(session: GameSession): void {
  const timer = timers.get(session.id);
  if (timer) {
    clearTimeout(timer);
    timers.delete(session.id);
  }

  session.timer.isActive = false;
}

export async function handleTimerExpired(session: GameSession): Promise<void> {
  const currentTurn = getCurrentTurn(session);
  if (!currentTurn) return;

  session.timer.remaining = 0;
  session.timer.totalTime += 10000; // Add 10 seconds to total time
  session.timer.isActive = true;
  session.lastActivity = new Date();

  await saveGameSession(session);

  // Continue with extended time
  const timer = setInterval(async () => {
    if (session.timer.remaining <= -10000) {
      // Allow 10 seconds of negative time
      clearInterval(timer);
      timers.delete(session.id);
      // Still don't auto-advance, just stop the timer
      session.timer.isActive = false;
      await saveGameSession(session);
    } else {
      session.timer.remaining -= 1000;
      session.lastActivity = new Date();
      await saveGameSession(session);
    }
  }, 1000);

  timers.set(session.id, timer);
}

export async function banChampion(
  session: GameSession,
  championId: number,
  teamSide: "blue" | "red"
): Promise<boolean> {
  const currentTurn = getCurrentTurn(session);

  if (!currentTurn || currentTurn.team !== teamSide || currentTurn.type !== "ban") {
    return false;
  }

  if (!(await isChampionAvailable(session, championId))) {
    return false;
  }

  const champion = getChampionById(championId);

  if (!champion) {
    return false;
  }

  session.teams[teamSide].bans.push(champion);
  session.turnNumber++;
  session.lastActivity = new Date();

  stopTimer(session);

  updateGamePhase(session);

  await saveGameSession(session);

  if (session.phase !== "completed") {
    startTimer(session);
  }

  return true;
}

export async function pickChampion(
  session: GameSession,
  championId: number,
  teamSide: "blue" | "red"
): Promise<boolean> {
  const currentTurn = getCurrentTurn(session);

  if (!currentTurn || currentTurn.team !== teamSide || currentTurn.type !== "pick") {
    return false;
  }

  if (!(await isChampionAvailable(session, championId))) {
    return false;
  }

  const champion = getChampionById(championId);

  if (!champion) {
    return false;
  }

  session.teams[teamSide].picks.push(champion);
  session.turnNumber++;
  session.lastActivity = new Date();

  if (session.config.isFearlessDraft) {
    await addUsedChampion(session.id, teamSide, champion);
  }

  stopTimer(session);
  updateGamePhase(session);
  await saveGameSession(session);

  if (session.phase !== "completed") {
    startTimer(session);
  }

  return true;
}

function updateGamePhase(session: GameSession): void {
  const currentTurn = getCurrentTurn(session);

  if (!currentTurn) {
    // Check if all picks and bans are complete (22 turns)
    if (session.turnNumber >= PICK_BAN_ORDER.length) {
      session.phase = "finalization";
      return;
    }
    session.phase = "completed";
    return;
  }

  session.phase = currentTurn.phase as GameSession["phase"];
  session.currentTeam = currentTurn.team;
}

export function getGameState(session: GameSession): GameState {
  const currentTurn = getCurrentTurn(session);

  return {
    sessionId: session.id,
    teams: {
      blue: {
        ...session.teams.blue,
        prefix: session.config.blueTeamPrefix
      },
      red: {
        ...session.teams.red,
        prefix: session.config.redTeamPrefix
      }
    },
    phase: session.phase,
    currentTurn,
    turnNumber: session.turnNumber,
    totalTurns: PICK_BAN_ORDER.length,
    timer: session.timer,
    bothTeamsReady: session.bothTeamsReady,
    config: session.config,
    seriesScore: session.seriesScore,
    hoverState: session.hoverState
  };
}

export async function getAllSessions(): Promise<GameSession[]> {
  return await getAllGameSessions();
}

export function getPickBanOrder(): Array<{
  team: "blue" | "red";
  action: "ban" | "pick";
}> {
  return PICK_BAN_ORDER.map((turn) => ({
    team: turn.team as "blue" | "red",
    action: turn.type as "ban" | "pick"
  }));
}

export async function completeGame(
  sessionId: string,
  winner: "blue" | "red",
  tournamentId?: string,
  gameDuration?: number
): Promise<boolean> {
  try {
    const session = await getGameSession(sessionId);
    if (!session || session.phase !== "completed") {
      return false;
    }

    // Validate that both teams have 5 picks
    if (session.teams.blue.picks.length !== 5 || session.teams.red.picks.length !== 5) {
      return false;
    }

    // Create game result for champion statistics
    const gameResult = {
      sessionId,
      tournamentId,
      gameNumber: session.config.currentGame,
      gameDuration,
      patch: session.config.patchName,
      completedAt: new Date(),
      blueTeam: {
        teamId: session.teams.blue.id,
        teamName: session.teams.blue.name,
        won: winner === "blue",
        picks: session.teams.blue.picks.map((champion, index) => ({
          championId: champion.id,
          role: ["TOP", "JUNGLE", "MID", "BOTTOM", "SUPPORT"][index] as PlayerRole,
          player: undefined
        })),
        bans: session.teams.blue.bans.map((champion) => champion.id)
      },
      redTeam: {
        teamId: session.teams.red.id,
        teamName: session.teams.red.name,
        won: winner === "red",
        picks: session.teams.red.picks.map((champion, index) => ({
          championId: champion.id,
          role: ["TOP", "JUNGLE", "MID", "BOTTOM", "SUPPORT"][index] as PlayerRole,
          player: undefined
        })),
        bans: session.teams.red.bans.map((champion) => champion.id)
      }
    };

    // Record the game result for statistics
    await recordGameResult(gameResult);

    if (session.config.seriesType !== "BO1") {
      if (!session.seriesScore) {
        session.seriesScore = { blue: 0, red: 0 };
      }
      session.seriesScore[winner] += 1;

      // Check if series is complete
      const requiredWins = Math.ceil(session.config.totalGames / 2);
      if (session.seriesScore[winner] >= requiredWins) {
        session.phase = "completed";
      } else {
        // Start next game in series
        session.config.currentGame += 1;
        // Reset for next game but keep series state
        resetSessionForNextGame(session);
      }
    }

    await saveGameSession(session);
    return true;
  } catch (error) {
    console.error("Error completing game:", error);
    return false;
  }
}

/**
 * Reset session state for next game in a series
 */
function resetSessionForNextGame(session: GameSession): void {
  // Clear picks and bans for new game
  session.teams.blue.bans = [];
  session.teams.blue.picks = [];
  session.teams.red.bans = [];
  session.teams.red.picks = [];

  // Reset game state
  session.phase = "config";
  session.currentTeam = "blue";
  session.turnNumber = 0;
  session.bothTeamsReady = false;
  session.timer = {
    remaining: 0,
    totalTime: 0,
    isActive: false
  };

  // Update last activity
  session.lastActivity = new Date();
}

export async function getAvailableChampions(session: GameSession): Promise<Champion[]> {
  const allChampions = await getChampions();

  if (!session.config.isFearlessDraft) {
    return allChampions;
  }

  const usedChampions = await getUsedChampionsInSeries(session.id);
  return allChampions.filter((champion: Champion) => !usedChampions.some((used: Champion) => used.id === champion.id));
}

export function generateTeamUrl(sessionId: string, teamSide: "blue" | "red", baseUrl: string): string {
  return `${baseUrl}/game/${sessionId}?team=${teamSide}`;
}

export function createWSMessage(
  type: WSMessage["type"],
  payload: WSMessage["payload"],
  sessionId?: string,
  teamSide?: "blue" | "red"
): WSMessage {
  return {
    type,
    payload,
    sessionId,
    teamSide
  };
}

// Function to create game session from tournament teams
export async function createGameSessionFromTeams(
  blueTeam: Team,
  redTeam: Team,
  config?: Partial<GameConfig>
): Promise<GameSession> {
  const session = await createGameSession({
    ...config,
    blueTeamName: blueTeam.name,
    redTeamName: redTeam.name,
    blueTeamPrefix: blueTeam.tag,
    redTeamPrefix: redTeam.tag,
    blueTeamId: blueTeam.id,
    redTeamId: redTeam.id
  });

  return session;
}
