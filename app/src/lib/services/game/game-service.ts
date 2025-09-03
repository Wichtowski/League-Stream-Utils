import { LiveGameData, LivePlayer, GameStatus } from "@libLeagueClient/types";

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

  const allPlayers: LivePlayer[] = (riot.allPlayers || []).map(
    (p): LivePlayer => ({
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
      gold: 0, // Will be updated below for active player
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
    })
  );

  const activeName = riot.activePlayer?.summonerName;
  const active = allPlayers.find((x) => x.summonerName === activeName);
  if (active && riot.activePlayer?.championStats) {
    active.health = riot.activePlayer.championStats.currentHealth ?? 0;
    active.maxHealth = riot.activePlayer.championStats.maxHealth ?? 0;
    // Set gold for active player
    active.gold = riot.activePlayer.currentGold ?? 0;
  }

  // Estimate gold for other players based on items and level
  allPlayers.forEach(player => {
    if (player.gold === 0 && player.summonerName !== activeName) {
      // Simple estimation: base gold + level bonus + item value estimation
      const baseGold = 500; // Starting gold
      const levelGold = player.level * 100; // Rough gold per level
      const itemGold = player.items.reduce((sum, item) => {
        // Rough item value estimation based on common item prices
        if (item.itemID === 0) return sum; // No item
        if (item.itemID < 2000) return sum + 300; // Basic items
        if (item.itemID < 3000) return sum + 800; // Intermediate items
        if (item.itemID < 4000) return sum + 1500; // Advanced items
        return sum + 2500; // Legendary items
      }, 0);
      
      player.gold = baseGold + levelGold + itemGold;
    }
  });

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
