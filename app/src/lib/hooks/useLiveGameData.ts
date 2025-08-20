import { useState, useEffect, useCallback } from "react";
import { useElectron } from "@/libElectron/contexts/ElectronContext";
import { GameEvent, LiveItem, LivePlayer } from "@libLeagueClient/types";

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
    try {
      console.log("useLiveGameData: Checking game status via proxy API...");
      
      // Use our proxy API endpoint to avoid CORS/CSP issues
      const response = await fetch("/api/game", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      console.log("useLiveGameData: Proxy API response:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (response.ok) {
        console.log("useLiveGameData: Game is running, connection successful");
        return true;
      }
      
      console.log("useLiveGameData: Game status check failed with status:", response.status);
      return false;
    } catch (err) {
      console.error("useLiveGameData: Error checking game status:", err);
      
      if (err instanceof Error) {
        console.error("useLiveGameData: Error details:", {
          name: err.name,
          message: err.message,
          stack: err.stack
        });
      }
      return false;
    }
  }, []);

  const fetchGameData = useCallback(async (): Promise<void> => {
    try {
      console.log("useLiveGameData: Fetching game data via proxy API...");
      
      // Use our proxy API endpoint to avoid CORS/CSP issues
      const response = await fetch("/api/game", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("useLiveGameData: Proxy API response:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        throw new Error(`Proxy API error! status: ${response.status}`);
      }

      const rawData = await response.json();
      console.log("useLiveGameData: Raw game data received:", rawData);
      
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

      console.log("useLiveGameData: Transformed game data:", transformedData);

      // Process players
      if (rawData.allPlayers) {
        console.log("useLiveGameData: Processing players:", rawData.allPlayers);
        rawData.allPlayers.forEach((player: LivePlayer) => {
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
            items: (player.items || []).map((item: LiveItem) => ({
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
        console.log("useLiveGameData: Processing events:", rawData.events);
        rawData.events.forEach((event: GameEvent) => {
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

      console.log("useLiveGameData: Final transformed data:", transformedData);
      setGameData(transformedData);
      setError(null);
    } catch (err) {
      console.error("useLiveGameData: Error fetching game data:", err);
      
      if (err instanceof Error) {
        console.error("useLiveGameData: Error details:", {
          name: err.name,
          message: err.message,
          stack: err.stack
        });
      }
      setError(err instanceof Error ? err.message : "Failed to fetch game data");
      setGameData(null);
    }
  }, []);

  const startPolling = useCallback(async (): Promise<(() => void) | void> => {
    if (isPolling) {
      console.log("useLiveGameData: Polling already in progress, skipping");
      return;
    }

    console.log("useLiveGameData: Starting polling process...");
    setIsPolling(true);
    
    // Check if game is running
    console.log("useLiveGameData: Checking if game is running...");
    const gameRunning = await checkGameStatus();
    
    if (gameRunning) {
      console.log("useLiveGameData: Game is running, starting data polling...");
      setIsConnected(true);
      setError(null);
      
      // Initial fetch
      console.log("useLiveGameData: Performing initial data fetch...");
      await fetchGameData();
      
      // Start polling every 2 seconds
      console.log("useLiveGameData: Setting up polling interval (2 seconds)...");
      const interval = setInterval(async () => {
        console.log("useLiveGameData: Polling interval triggered, checking game status...");
        const stillRunning = await checkGameStatus();
        
        if (!stillRunning) {
          console.log("useLiveGameData: Game no longer running, stopping polling...");
          setIsConnected(false);
          setGameData(null);
          clearInterval(interval);
          setIsPolling(false);
          return;
        }
        
        console.log("useLiveGameData: Game still running, fetching updated data...");
        await fetchGameData();
      }, 2000);
      
      // Cleanup function
      return () => {
        console.log("useLiveGameData: Cleaning up polling interval...");
        clearInterval(interval);
        setIsPolling(false);
      };
    } else {
      console.log("useLiveGameData: Game is not running, not starting polling");
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
      const result = await startPolling();
      if (typeof result === 'function') {
        cleanup = result;
      }
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
