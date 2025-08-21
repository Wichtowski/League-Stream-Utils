import { useState, useEffect, useCallback, useRef } from "react";
import { gameService } from "@lib/services/game/game-service";
import type { LiveGameData, GameStatus } from "@libLeagueClient/types";

export interface UseGameDataReturn {
  gameData: LiveGameData | null;
  gameStatus: GameStatus | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export const useGameData = (pollingInterval = 1000): UseGameDataReturn => {
  const [gameData, setGameData] = useState<LiveGameData | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  const stopPolling = useCallback((): void => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    isPollingRef.current = false;
  }, []);

  const disconnect = useCallback(async (): Promise<void> => {
    try {
      stopPolling();
      await gameService.disconnect();
      setIsConnected(false);
      setGameData(null);
      setGameStatus(null);
      setError(null);
    } catch (err) {
      console.error("Error disconnecting:", err);
    }
  }, [stopPolling]);

  const refreshData = useCallback(async (): Promise<void> => {
    if (!gameService.isConnectedToLCU()) {
      return;
    }

    try {
      setError(null);

      // Get game status
      const statusResult = await gameService.getGameStatus();
      if (statusResult.success && statusResult.data) {
        setGameStatus(statusResult.data);

        // If in game, get live game data
        if (statusResult.data.isInGame) {
          const gameDataResult = await gameService.getLiveGameData();
          if (gameDataResult.success && gameDataResult.data) {
            setGameData(gameDataResult.data);
          } else if (gameDataResult.error) {
            setError(`Game data error: ${gameDataResult.error}`);
          }
        } else {
          setGameData(null);
        }
      } else if (statusResult.error) {
        setError(`Status error: ${statusResult.error}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
    }
  }, []);

  const startPolling = useCallback((): void => {
    if (isPollingRef.current) {
      return;
    }

    isPollingRef.current = true;
    pollingRef.current = setInterval(async () => {
      if (gameService.isConnectedToLCU()) {
        await refreshData();
      } else {
        stopPolling();
        setIsConnected(false);
      }
    }, pollingInterval);
  }, [pollingInterval, refreshData, stopPolling]);

  const connect = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const success = await gameService.connect();
      setIsConnected(success);

      if (success) {
        await refreshData();
        startPolling();
      } else {
        setError("Failed to connect to League Client");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown connection error";
      setError(errorMessage);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [refreshData, startPolling]);

  // Auto-connect on mount
  useEffect(() => {
    connect();

    return () => {
      stopPolling();
    };
  }, [connect, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    gameData,
    gameStatus,
    isConnected,
    isLoading,
    error,
    refreshData,
    connect,
    disconnect
  };
};
