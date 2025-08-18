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

      const liveData: LiveGameData = await response.json();
      
      return {
        success: true,
        data: liveData
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
