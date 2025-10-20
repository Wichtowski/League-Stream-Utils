import { LiveGameData, LivePlayer, GameStatus } from "@libLeagueClient/types";
import { getItemById } from "@lib/items";
import { RiotLiveClientData } from "@lib/types/live-client";

const normalizeSummonerSpellName = (spellName: string): string => {
  if (spellName === "unleashed_teleport_new") {
    return "Teleport Unleashed";
  }
  return spellName;
};

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

  async getLiveGameData(matchId?: string): Promise<LCURequestResult<LiveGameData>> {
    try {
      // Use our proxy API endpoint to avoid SSL certificate issues
      const headers: HeadersInit = {};
      if (matchId) {
        headers["x-match-id"] = matchId;
      }
      
      const response = await fetch("/api/game", { headers });

      if (!response.ok) {
        return {
          success: false,
          error: `Proxy API error: ${response.status} ${response.statusText}`
        };
      }

      const riotData: RiotLiveClientData = await response.json();

      const transformed: LiveGameData = transformRiotToLiveGameData(riotData);

      // Refine creepScore values using playerscores (best-effort, async fanout)
      // try {
      //   const updates = await Promise.all(
      //     transformed.allPlayers.map(async (p) => {
      //       try {
      //         const res = await fetch(`/api/game/playerscores?riotId=${encodeURIComponent(p.summonerName)}`);
      //         if (!res.ok) return null;
      //         const scores: { creepScore?: number } = await res.json();
      //         const cs = typeof scores.creepScore === "number" ? scores.creepScore : null;
      //         return cs != null ? { name: p.summonerName, cs } : null;
      //       } catch (_e) {
      //         return null;
      //       }
      //     })
      //   );
      //   updates.forEach((u) => {
      //     if (!u) return;
      //     const target = transformed.allPlayers.find((x) => x.summonerName === u.name);
      //     if (target) target.scores.creepScore = u.cs;
      //   });
      // } catch (_err) {
      //   // ignore, best-effort refinement only
      // }

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

// Cache for item costs to avoid repeated API calls
const itemCostCache = new Map<number, number>();

function getItemCost(itemId: number): number {
  if (itemId === 0) return 0; // No item
  
  // Check cache first
  if (itemCostCache.has(itemId)) {
    return itemCostCache.get(itemId)!;
  }
  
  try {
    // Get item data from browser localStorage cache
    const itemData = getItemById(itemId.toString());
    const cost = itemData?.cost || 0;
    
    // Cache the result
    itemCostCache.set(itemId, cost);
    return cost;
  } catch (error) {
    console.warn(`Failed to get cost for item ${itemId}:`, error);
    return 0;
  }
}

function calculateSimulatedGold(
  player: LivePlayer, 
  gameTime: number
): number {
  // Calculate current gold (what player has in pocket)
  let currentGold = 500; // Starting gold
  
  // Add passive gold generation: 20.4 gold per 10 seconds, starts at 1:50
  if (gameTime > 110) { // 1:50 in seconds
    const passiveGoldTime = gameTime - 110;
    const passiveGoldPeriods = Math.floor(passiveGoldTime / 10);
    currentGold += passiveGoldPeriods * 20.4;
  }
  
  // Add minion gold (scaled for realistic farming)
  if (gameTime > 90) { // Minions spawn at 1:30
    const minionTime = gameTime - 90;
    const waveInterval = 30; // New wave every 30 seconds
    const waves = Math.floor(minionTime / waveInterval);
    
    if (waves > 0) {
      const timeInMinutes = gameTime / 60;
      const goldPerWave = 125 + ((195 - 125) * Math.min(timeInMinutes, 25) / 25);
      const farmEfficiency = 0.6; // Assume 60% of minions are farmed
      currentGold += waves * goldPerWave * farmEfficiency;
    }
  }
  
  // Calculate total item value (what player has spent)
  let totalItemValue = 0;
  for (const item of player.items) {
    if (item.itemID !== 0) {
      const itemCost = getItemCost(item.itemID);
      totalItemValue += itemCost * item.count;
    }
  }
  
  const totalGold = currentGold + totalItemValue;
  
  
  return totalGold;
}

function transformRiotToLiveGameData(riot: RiotLiveClientData): LiveGameData {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const gameTime = riot.gameData?.gameTime ?? 0;

  const allPlayers: LivePlayer[] = (riot.allPlayers || []).map(
    (p): LivePlayer => ({
      summonerName: p.summonerName,
      championName: p.championName,
      team: p.team,
      riotIdTag: p.summonerName.split('#')[1],
      riotIdGameName: p.summonerName.split('#')[0], // Extract game name without Riot tag
      position: p.position,
      scores: {
        kills: p.scores?.kills ?? 0,
        deaths: p.scores?.deaths ?? 0,
        assists: p.scores?.assists ?? 0,
        creepScore: p.scores?.creepScore ?? 0,
        wardScore: p.scores?.wardScore ?? 0,
      },
      items: (p.items || []).map((it, index) => ({
        itemID: it.itemID ?? 0,
        name: it.name ?? "",
        count: it.count ?? 0,
        price: (it as { price?: number }).price ?? 0, // Use the price from allgamedata as fallback
        slot: index
      })),
      level: p.level ?? 1,
      gold: 0, // Will be updated below for active player
      currentHealth: 0,
      respawnTimer: p.respawnTimer ?? 0, // Use actual respawn timer from riot data
      isDead: p.isDead ?? false, // Use actual isDead from riot data
      maxHealth: 1,
      summonerSpells: {
        summonerSpellOne: {
          displayName: normalizeSummonerSpellName(p.summonerSpells?.summonerSpellOne?.displayName ?? ""),
          rawDescription: p.summonerSpells?.summonerSpellOne?.rawDescription ?? ""
        },
        summonerSpellTwo: {
          displayName: normalizeSummonerSpellName(p.summonerSpells?.summonerSpellTwo?.displayName ?? ""),
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
    active.currentHealth = riot.activePlayer.championStats.currentHealth ?? 0;
    active.maxHealth = riot.activePlayer.championStats.maxHealth ?? 0;
    // Don't set gold here - we'll set it properly in the loop below
  }

  // Use live player data for gold calculation when available
  allPlayers.forEach((player) => {
    // Calculate item value for all players
    let totalItemValue = 0;
    for (const item of player.items) {
      if (item.itemID !== 0) {
        const itemCost = getItemCost(item.itemID);
        totalItemValue += itemCost * item.count;
      }
    }
    
    // Check if we have live data for this player
    if (player.liveInfo?.currentGold !== undefined) {
      // Live data: current gold + item value
      player.gold = player.liveInfo.currentGold + totalItemValue;
    } else if (player.summonerName === activeName) {
      // Active player: use currentGold from League client + item value
      // Reset gold first to avoid double counting
      const currentGold = riot.activePlayer?.currentGold || 0;
      player.gold = currentGold + totalItemValue;
    } else {
      // For non-active players without live data, use simulation
      player.gold = calculateSimulatedGold(player, gameTime);
    }
  });

  // Debug: Log gold values for debugging
  console.log("🔍 Gold Calculation Debug:", {
    gameTime,
    activeName,
    totalPlayers: allPlayers.length
  });
  
  const blueTeam = allPlayers.filter(p => p.team === "ORDER");
  const redTeam = allPlayers.filter(p => p.team === "CHAOS");
  const blueGold = blueTeam.reduce((sum, p) => sum + (p.gold || 0), 0);
  const redGold = redTeam.reduce((sum, p) => sum + (p.gold || 0), 0);
  
  console.log("💰 Team Gold Totals:", {
    blueTeamGold: blueGold,
    redTeamGold: redGold,
    blueTeamCount: blueTeam.length,
    redTeamCount: redTeam.length
  });
  
  console.log("👥 Player Details:", allPlayers.map(p => ({
    name: p.summonerName,
    team: p.team,
    gold: p.gold,
    hasLiveInfo: !!p.liveInfo?.currentGold,
    liveGold: p.liveInfo?.currentGold,
    isActive: p.summonerName === activeName
  })));


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
