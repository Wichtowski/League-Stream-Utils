"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from "react";
import { useAuthenticatedFetch } from "@lib/hooks/useAuthenticatedFetch";
import { useElectron } from "@libElectron/contexts/ElectronContext";
import { storage } from "@lib/services/common/UniversalStorage";
import { Tournament } from "@libTournament/types";

interface CurrentTournamentContextType {
  currentTournament: Tournament | null;
  currentTournamentId: string | null;
  loading: boolean;
  error: string | null;

  setCurrentTournament: (tournament: Tournament | null) => Promise<void>;
  clearCurrentTournament: () => Promise<void>;
  getCurrentTournament: () => Promise<Tournament | null>;
  refreshCurrentTournament: () => Promise<void>;
}

const CurrentTournamentContext = createContext<CurrentTournamentContextType | undefined>(undefined);

const CURRENT_TOURNAMENT_KEY = "current-tournament";

export function CurrentTournamentProvider({ children }: { children: ReactNode }): React.ReactElement {
  const { isElectron, useLocalData } = useElectron();
  const { authenticatedFetch } = useAuthenticatedFetch();

  const [currentTournament, setCurrentTournamentState] = useState<Tournament | null>(null);
  const [currentTournamentId, setCurrentTournamentIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLocalDataMode = isElectron && useLocalData;

  const electronStorage = useMemo(
    () => ({
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
    }),
    []
  );

  const setCurrentTournament = useCallback(
    async (tournament: Tournament | null): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        if (tournament) {
          setCurrentTournamentState(tournament);
          setCurrentTournamentIdState(tournament._id ?? null);

          if (isLocalDataMode) {
            await electronStorage.set(CURRENT_TOURNAMENT_KEY, tournament);
          } else {
            await storage.set(CURRENT_TOURNAMENT_KEY, tournament);
          }

          try {
            await authenticatedFetch("/api/v1/settings/app", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                settings: {
                  lastSelectedTournamentId: tournament._id ?? null
                }
              })
            });
          } catch (_e) {}
        } else {
          setCurrentTournamentState(null);
          setCurrentTournamentIdState(null);

          if (isLocalDataMode) {
            await electronStorage.remove(CURRENT_TOURNAMENT_KEY);
          } else {
            await storage.remove(CURRENT_TOURNAMENT_KEY);
          }

          try {
            await authenticatedFetch("/api/v1/settings/app", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                settings: {
                  lastSelectedTournamentId: null
                }
              })
            });
          } catch (_e) {}
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to set current tournament";
        setError(errorMessage);
        console.error("Error setting current tournament:", err);
      } finally {
        setLoading(false);
      }
    },
    [isLocalDataMode, electronStorage, authenticatedFetch]
  );

  const clearCurrentTournament = useCallback(async (): Promise<void> => {
    await setCurrentTournament(null);
  }, [setCurrentTournament]);

  const getCurrentTournament = useCallback(async (): Promise<Tournament | null> => {
    try {
      if (isLocalDataMode) {
        const tournament = await electronStorage.get<Tournament>(CURRENT_TOURNAMENT_KEY);
        if (tournament) {
          setCurrentTournamentState(tournament);
          setCurrentTournamentIdState(tournament._id ?? null);
        }
        return tournament;
      } else {
        const tournament = await storage.get<Tournament>(CURRENT_TOURNAMENT_KEY);
        if (tournament) {
          setCurrentTournamentState(tournament);
          setCurrentTournamentIdState(tournament._id ?? null);
        }
        return tournament;
      }
    } catch (err) {
      console.error("Error getting current tournament:", err);
      return null;
    }
  }, [isLocalDataMode, electronStorage]);

  const refreshCurrentTournament = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      if (currentTournament?._id) {
        const response = await authenticatedFetch(`/api/v1/tournaments/${currentTournament._id}`);

        if (response.ok) {
          const data = await response.json();
          const freshTournament = data.tournament as Tournament | undefined;

          if (freshTournament) {
            setCurrentTournamentState(freshTournament);
            setCurrentTournamentIdState(freshTournament._id ?? null);
            if (isLocalDataMode) {
              await electronStorage.set(CURRENT_TOURNAMENT_KEY, freshTournament);
            } else {
              await storage.set(CURRENT_TOURNAMENT_KEY, freshTournament);
            }
          }
        } else {
          throw new Error("Failed to fetch current tournament");
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to refresh current tournament";
      setError(errorMessage);
      console.error("Error refreshing current tournament:", err);
    } finally {
      setLoading(false);
    }
  }, [currentTournament?._id, authenticatedFetch, isLocalDataMode, electronStorage]);

  const value: CurrentTournamentContextType = useMemo(
    () => ({
      currentTournament,
      currentTournamentId,
      loading,
      error,
      setCurrentTournament,
      clearCurrentTournament,
      getCurrentTournament,
      refreshCurrentTournament
    }),
    [
      currentTournament,
      currentTournamentId,
      loading,
      error,
      setCurrentTournament,
      clearCurrentTournament,
      getCurrentTournament,
      refreshCurrentTournament
    ]
  );

  return <CurrentTournamentContext.Provider value={value}>{children}</CurrentTournamentContext.Provider>;
}

export function useCurrentTournament(): CurrentTournamentContextType {
  const context = useContext(CurrentTournamentContext);
  if (context === undefined) {
    throw new Error("useCurrentTournament must be used within a CurrentTournamentProvider");
  }
  return context;
}


