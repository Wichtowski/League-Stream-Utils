"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from "react";
import { useAuthenticatedFetch } from "@lib/hooks/useAuthenticatedFetch";
import { useElectron } from "./ElectronContext";
import { storage } from "@lib/services/common/UniversalStorage";
import type { Match } from "@lib/types/match";

interface CurrentMatchContextType {
  // Current match data
  currentMatch: Match | null;
  currentTournamentId: string | null;
  loading: boolean;
  error: string | null;

  // Actions
  setCurrentMatch: (match: Match | null) => Promise<void>;
  clearCurrentMatch: () => Promise<void>;
  getCurrentMatch: () => Promise<Match | null>;
  refreshCurrentMatch: () => Promise<void>;
}

const CurrentMatchContext = createContext<CurrentMatchContextType | undefined>(undefined);

const CURRENT_MATCH_KEY = "current-match";
const CURRENT_TOURNAMENT_KEY = "current-tournament";

export function CurrentMatchProvider({ children }: { children: ReactNode }) {
  const { isElectron, useLocalData } = useElectron();
  const { authenticatedFetch } = useAuthenticatedFetch();

  const [currentMatch, setCurrentMatchState] = useState<Match | null>(null);
  const [currentTournamentId, setCurrentTournamentIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if we're in local data mode
  const isLocalDataMode = isElectron && useLocalData;

  // Simple electron storage helper
  const electronStorage = useMemo(() => ({
    async get<T>(key: string): Promise<T | null> {
      if (typeof window !== "undefined" && window.electronAPI?.storage?.get) {
        try {
          const data = await window.electronAPI.storage.get(key);
          return data as T;
        } catch (err) {
          console.debug("Electron storage get failed:", err);
          return null;
        }
      }
      return null;
    },

    async set<T>(key: string, data: T): Promise<void> {
      if (typeof window !== "undefined" && window.electronAPI?.storage?.set) {
        try {
          await window.electronAPI.storage.set(key, data);
        } catch (err) {
          console.debug("Electron storage set failed:", err);
        }
      }
    },

    async remove(key: string): Promise<void> {
      if (typeof window !== "undefined" && window.electronAPI?.storage?.remove) {
        try {
          await window.electronAPI.storage.remove(key);
        } catch (err) {
          console.debug("Electron storage remove failed:", err);
        }
      }
    }
  }), []);

  const setCurrentMatch = useCallback(
    async (match: Match | null): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        if (match) {
          setCurrentMatchState(match);
          setCurrentTournamentIdState(match.tournamentId || null);

          // Store in storage
          if (isLocalDataMode) {
            await electronStorage.set(CURRENT_MATCH_KEY, match);
            if (match.tournamentId) {
              await electronStorage.set(CURRENT_TOURNAMENT_KEY, match.tournamentId);
            }
          } else {
            await storage.set(CURRENT_MATCH_KEY, match);
            if (match.tournamentId) {
              await storage.set(CURRENT_TOURNAMENT_KEY, match.tournamentId);
            }
          }
        } else {
          setCurrentMatchState(null);
          setCurrentTournamentIdState(null);

          // Clear from storage
          if (isLocalDataMode) {
            await electronStorage.remove(CURRENT_MATCH_KEY);
            await electronStorage.remove(CURRENT_TOURNAMENT_KEY);
          } else {
            await storage.remove(CURRENT_MATCH_KEY);
            await storage.remove(CURRENT_TOURNAMENT_KEY);
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to set current match";
        setError(errorMessage);
        console.error("Error setting current match:", err);
      } finally {
        setLoading(false);
      }
    },
    [isLocalDataMode, electronStorage]
  );

  const clearCurrentMatch = useCallback(async (): Promise<void> => {
    await setCurrentMatch(null);
  }, [setCurrentMatch]);

  const getCurrentMatch = useCallback(async (): Promise<Match | null> => {
    try {
      if (isLocalDataMode) {
        const match = await electronStorage.get<Match>(CURRENT_MATCH_KEY);
        const tournamentId = await electronStorage.get<string>(CURRENT_TOURNAMENT_KEY);
        
        if (match) {
          setCurrentMatchState(match);
          setCurrentTournamentIdState(tournamentId);
        }
        
        return match;
      } else {
        const match = await storage.get<Match>(CURRENT_MATCH_KEY);
        const tournamentId = await storage.get<string>(CURRENT_TOURNAMENT_KEY);
        
        if (match) {
          setCurrentMatchState(match);
          setCurrentTournamentIdState(tournamentId);
        }
        
        return match;
      }
    } catch (err) {
      console.error("Error getting current match:", err);
      return null;
    }
  }, [isLocalDataMode, electronStorage]);

  const refreshCurrentMatch = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      if (currentMatch?.id) {
        // Fetch fresh match data from API
        const response = await authenticatedFetch(`/api/v1/matches/${currentMatch.id}`);
        
        if (response.ok) {
          const data = await response.json();
          const freshMatch = data.match;
          
          if (freshMatch) {
            setCurrentMatchState(freshMatch);
            // Update storage with fresh data
            if (isLocalDataMode) {
              await electronStorage.set(CURRENT_MATCH_KEY, freshMatch);
            } else {
              await storage.set(CURRENT_MATCH_KEY, freshMatch);
            }
          }
        } else {
          throw new Error("Failed to fetch current match");
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to refresh current match";
      setError(errorMessage);
      console.error("Error refreshing current match:", err);
    } finally {
      setLoading(false);
    }
  }, [currentMatch?.id, authenticatedFetch, isLocalDataMode, electronStorage]);

  const value: CurrentMatchContextType = useMemo(
    () => ({
      currentMatch,
      currentTournamentId,
      loading,
      error,
      setCurrentMatch,
      clearCurrentMatch,
      getCurrentMatch,
      refreshCurrentMatch
    }),
    [
      currentMatch,
      currentTournamentId,
      loading,
      error,
      setCurrentMatch,
      clearCurrentMatch,
      getCurrentMatch,
      refreshCurrentMatch
    ]
  );

  return <CurrentMatchContext.Provider value={value}>{children}</CurrentMatchContext.Provider>;
}

export function useCurrentMatch(): CurrentMatchContextType {
  const context = useContext(CurrentMatchContext);
  if (context === undefined) {
    throw new Error("useCurrentMatch must be used within a CurrentMatchProvider");
  }
  return context;
}

