export type DragonType = "chemtech" | "cloud" | "hextech" | "infernal" | "mountain" | "ocean" | "elder";

export type ObjectiveType = "dragon" | "elder" | "voidgrubs" | "herald" | "atakhan" | "baron";

export interface ObjectiveState {
  id: string;
  name: string;
  icon: string;
  spawnTime: number;
  respawnTime: number;
  isActive: boolean;
  isSpawned: boolean;
  timeRemaining: number;
  dragonType?: DragonType;
  objectiveType: ObjectiveType;
}

export interface ObjectiveTimersProps {
  gameData: import("@libLeagueClient/types").LiveGameData;
  gameVersion: string;
}

export interface ObjectiveTimerConfig {
  spawnTime: number;
  respawnTime: number;
  timerStartOffset: number;
  activeThreshold: number; // seconds before spawn to show as active
}

export const OBJECTIVE_CONFIGS: Record<ObjectiveType, ObjectiveTimerConfig> = {
  dragon: {
    spawnTime: 300, // 5:00
    respawnTime: 300, // 5:00
    timerStartOffset: 300, // 5 minutes before
    activeThreshold: 60 // 1 minute before spawn
  },
  elder: {
    spawnTime: 360, // 6:00
    respawnTime: 360, // 6:00
    timerStartOffset: 300, // 5 minutes before
    activeThreshold: 60
  },
  voidgrubs: {
    spawnTime: 480, // 8:00
    respawnTime: 0, // No respawn
    timerStartOffset: 300, // 5 minutes before
    activeThreshold: 60
  },
  herald: {
    spawnTime: 900, // 15:00
    respawnTime: 0, // No respawn
    timerStartOffset: 300, // 5 minutes before
    activeThreshold: 60
  },
  atakhan: {
    spawnTime: 1200, // 20:00
    respawnTime: 0, // No respawn
    timerStartOffset: 300, // 5 minutes before
    activeThreshold: 60
  },
  baron: {
    spawnTime: 1500, // 25:00
    respawnTime: 360, // 6:00
    timerStartOffset: 300, // 5 minutes before
    activeThreshold: 60
  }
};
