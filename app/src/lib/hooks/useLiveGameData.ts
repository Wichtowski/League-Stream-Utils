import { useState, useEffect, useCallback } from "react";
import { useElectron } from "@lib/contexts/ElectronContext";

interface PlayerScores {
  kills: number;
  deaths: number;
  assists: number;
  creepScore: number;
  visionScore: number;
}

interface PlayerItems {
  itemID: number;
  name: string;
  count: number;
}

interface Player {
  summonerName: string;
  championName: string;
  team: "ORDER" | "CHAOS";
  position: string;
  scores: PlayerScores;
  items: PlayerItems[];
  level: number;
  gold: number;
}

interface TeamObjectives {
  dragon: number;
  baron: number;
  tower: number;
  inhibitor: number;
  herald: number;
}

interface Team {
  players: Player[];
  objectives: TeamObjectives;
}

interface GameData {
  gameMode: string;
  mapName: string;
  gameTime: number;
  blueTeam: Team;
  redTeam: Team;
}

export const useLiveGameData = () => {
  const { isElectron } = useElectron();
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const checkGameStatus = useCallback(async (): Promise<boolean> => {
    if (!isElectron) {
      return false;
    }

    try {
      // Connect directly to the Live Client Data API (only works in Electron)
      const response = await fetch("https://127.0.0.1:2999/liveclientdata/allgamedata", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (response.ok) {
        return true;
      }
      return false;
    } catch (_err) {
      return false;
    }
  }, [isElectron]);

  const fetchGameData = useCallback(async (): Promise<void> => {
    if (!isElectron) {
      return;
    }

    try {
      // Connect directly to the Live Client Data API (only works in Electron)
      const response = await fetch("https://127.0.0.1:2999/liveclientdata/allgamedata", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const rawData = await response.json();
      
      // Transform the raw data into our structured format
      const transformedData: GameData = {
        gameMode: rawData.gameData?.gameMode || "Unknown",
        mapName: rawData.gameData?.mapName || "Unknown",
        gameTime: rawData.gameData?.gameTime || 0,
        blueTeam: {
          players: [],
          objectives: {
            dragon: 0,
            baron: 0,
            tower: 0,
            inhibitor: 0,
            herald: 0,
          },
        },
        redTeam: {
          players: [],
          objectives: {
            dragon: 0,
            baron: 0,
            tower: 0,
            inhibitor: 0,
            herald: 0,
          },
        },
      };

      // Process players
      if (rawData.allPlayers) {
        rawData.allPlayers.forEach((player: any) => {
          const playerData: Player = {
            summonerName: player.summonerName || "Unknown",
            championName: player.championName || "Unknown",
            team: player.team || "ORDER",
            position: player.position || "Unknown",
            scores: {
              kills: player.scores?.kills || 0,
              deaths: player.scores?.deaths || 0,
              assists: player.scores?.assists || 0,
              creepScore: player.scores?.creepScore || 0,
              visionScore: player.scores?.visionScore || 0,
            },
            items: (player.items || []).map((item: any) => ({
              itemID: item.itemID || 0,
              name: item.name || "Unknown",
              count: item.count || 1,
            })),
            level: player.level || 1,
            gold: player.gold || 0,
          };

          if (player.team === "ORDER") {
            transformedData.blueTeam.players.push(playerData);
          } else {
            transformedData.redTeam.players.push(playerData);
          }
        });
      }

      // Process objectives from events
      if (rawData.events) {
        rawData.events.forEach((event: any) => {
          if (event.EventName === "DragonKill") {
            if (event.KillerTeam === "ORDER") {
              transformedData.blueTeam.objectives.dragon++;
            } else {
              transformedData.redTeam.objectives.dragon++;
            }
          } else if (event.EventName === "BaronKill") {
            if (event.KillerTeam === "ORDER") {
              transformedData.blueTeam.objectives.baron++;
            } else {
              transformedData.redTeam.objectives.baron++;
            }
          } else if (event.EventName === "TurretKilled") {
            if (event.KillerTeam === "ORDER") {
              transformedData.blueTeam.objectives.tower++;
            } else {
              transformedData.redTeam.objectives.tower++;
            }
          }
        });
      }

      setGameData(transformedData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch game data");
      setGameData(null);
    }
  }, [isElectron]);

  const startPolling = useCallback(async (): Promise<void> => {
    if (isPolling) return;

    setIsPolling(true);
    
    // Check if game is running
    const gameRunning = await checkGameStatus();
    
    if (gameRunning) {
      setIsConnected(true);
      setError(null);
      
      // Initial fetch
      await fetchGameData();
      
      // Start polling every 2 seconds
      const interval = setInterval(async () => {
        const stillRunning = await checkGameStatus();
        
        if (!stillRunning) {
          setIsConnected(false);
          setGameData(null);
          clearInterval(interval);
          setIsPolling(false);
          return;
        }
        
        await fetchGameData();
      }, 2000);
      
      // Cleanup function
      return () => {
        clearInterval(interval);
        setIsPolling(false);
      };
    } else {
      setIsConnected(false);
      setGameData(null);
      setIsPolling(false);
    }
  }, [checkGameStatus, fetchGameData, isPolling]);

  useEffect(() => {
    if (!isElectron) {
      return;
    }

    let cleanup: (() => void) | undefined;
    
    const initPolling = async () => {
      cleanup = await startPolling();
    };
    
    initPolling();
    
    return () => {
      if (cleanup) cleanup();
    };
  }, [startPolling, isElectron]);

  // Manual refresh function
  const refreshData = useCallback(async (): Promise<void> => {
    if (isConnected) {
      await fetchGameData();
    }
  }, [isConnected, fetchGameData]);

  return {
    gameData,
    isConnected,
    error,
    refreshData,
  };
};
