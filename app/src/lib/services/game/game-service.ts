export interface LiveGameData {
  gameData: {
    gameMode: string;
    mapName: string;
    gameTime: number;
    gameLength: number;
    gameStartTime: number;
  };
  allPlayers: LivePlayer[];
  events: GameEvent[];
}

export interface SummonerSpell {
  displayName: string;
  rawDescription: string;
}

export interface LivePlayer {
  summonerName: string;
  championName: string;
  team: "ORDER" | "CHAOS";
  position: string;
  scores: {
    kills: number;
    deaths: number;
    assists: number;
    creepScore: number;
    visionScore: number;
  };
  items: LiveItem[];
  level: number;
  gold: number;
  health?: number;
  maxHealth?: number;
  summonerSpells: {
    summonerSpellOne: SummonerSpell;
    summonerSpellTwo: SummonerSpell;
  };
  runes: {
    keystone: string;
    primaryRuneTree: string;
    secondaryRuneTree: string;
  };
}

export interface LiveItem {
  itemID: number;
  name: string;
  count: number;
  price: number;
}

export interface GameEvent {
  EventName: string;
  EventTime: number;
  KillerName?: string;
  KillerTeam?: "ORDER" | "CHAOS";
  VictimName?: string;
  VictimTeam?: "ORDER" | "CHAOS";
  Position?: {
    x: number;
    y: number;
  };
}

export interface GameStatus {
  isInGame: boolean;
  gamePhase: string;
  gameTime: number;
  mapName: string;
}

export interface LCURequestResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export class GameService {
  private isConnected = false;

  async connect(): Promise<boolean> {
    try {
      // For browser environment, we'll just check if we can reach the proxy API
      const response = await fetch("/api/game");
      this.isConnected = response.ok;
      return this.isConnected;
    } catch (error) {
      console.error("GameService: Failed to connect:", error);
      this.isConnected = false;
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
  }

  isConnectedToLCU(): boolean {
    return this.isConnected;
  }

  async getGameStatus(): Promise<LCURequestResult<GameStatus>> {
    try {
      // Get game status via proxy API
      const response = await fetch("/api/game");
      
      if (!response.ok) {
        return { success: false, error: `Proxy API error: ${response.status} ${response.statusText}` };
      }

      const liveData = await response.json();
      
      // Determine if in game based on whether we have live data
      const isInGame = liveData && liveData.gameData && liveData.allPlayers;
      const gamePhase = isInGame ? "InProgress" : "WaitingForGame";
      const gameTime = liveData?.gameData?.gameTime || 0;
      const mapName = liveData?.gameData?.mapName || "Unknown";

      return {
        success: true,
        data: {
          isInGame,
          gamePhase,
          gameTime,
          mapName
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  async getLiveGameData(): Promise<LCURequestResult<LiveGameData>> {
    try {
      // Use our proxy API endpoint to avoid SSL certificate issues
      const response = await fetch("/api/game");
      
      if (!response.ok) {
        return { 
          success: false, 
          error: `Proxy API error: ${response.status} ${response.statusText}` 
        };
      }

      const riotData: import("@lib/types/live-client").RiotLiveClientData = await response.json();

      const transformed: LiveGameData = transformRiotToLiveGameData(riotData);

      return {
        success: true,
        data: transformed
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  async getChampionSelectSession(): Promise<LCURequestResult> {
    try {
      // For browser environment, we'll return a placeholder
      return { success: true, data: null };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  async getCurrentSummoner(): Promise<LCURequestResult> {
    try {
      // For browser environment, we'll return a placeholder
      return { success: true, data: null };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  async getGameflowSession(): Promise<LCURequestResult> {
    try {
      // For browser environment, we'll return a placeholder
      return { success: true, data: null };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
}

// Export singleton instance
export const gameService = new GameService();

function transformRiotToLiveGameData(riot: import("@lib/types/live-client").RiotLiveClientData): LiveGameData {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const gameTime = riot.gameData?.gameTime ?? 0;

  const allPlayers: LivePlayer[] = (riot.allPlayers || []).map((p): LivePlayer => ({
    summonerName: p.summonerName,
    championName: p.championName,
    team: p.team,
    position: p.position,
    scores: {
      kills: p.scores?.kills ?? 0,
      deaths: p.scores?.deaths ?? 0,
      assists: p.scores?.assists ?? 0,
      creepScore: p.scores?.creepScore ?? 0,
      visionScore: p.scores?.wardScore ?? 0
    },
    items: (p.items || []).map((it) => ({
      itemID: it.itemID ?? 0,
      name: it.name ?? "",
      count: it.count ?? 0,
      price: 0
    })),
    level: p.level ?? 1,
    gold: 0,
    health: 0,
    maxHealth: 1,
    summonerSpells: {
      summonerSpellOne: {
        displayName: p.summonerSpells?.summonerSpellOne?.displayName ?? "",
        rawDescription: p.summonerSpells?.summonerSpellOne?.rawDescription ?? ""
      },
      summonerSpellTwo: {
        displayName: p.summonerSpells?.summonerSpellTwo?.displayName ?? "",
        rawDescription: p.summonerSpells?.summonerSpellTwo?.rawDescription ?? ""
      }
    },
    runes: {
      keystone: p.runes?.keystone?.displayName ?? "",
      primaryRuneTree: p.runes?.primaryRuneTree?.displayName ?? "",
      secondaryRuneTree: p.runes?.secondaryRuneTree?.displayName ?? ""
    }
  }));

  const activeName = riot.activePlayer?.summonerName;
  const active = allPlayers.find((x) => x.summonerName === activeName);
  if (active && riot.activePlayer?.championStats) {
    active.health = riot.activePlayer.championStats.currentHealth ?? 0;
    active.maxHealth = riot.activePlayer.championStats.maxHealth ?? 0;
  }

  return {
    gameData: {
      gameMode: riot.gameData?.gameMode ?? "",
      mapName: riot.gameData?.mapName ?? "",
      gameTime,
      gameLength: gameTime,
      gameStartTime: nowSeconds - Math.floor(gameTime)
    },
    allPlayers,
    events: (riot.events?.Events || []).map((e) => ({
      EventName: e.EventName,
      EventTime: e.EventTime
    }))
  };
}
