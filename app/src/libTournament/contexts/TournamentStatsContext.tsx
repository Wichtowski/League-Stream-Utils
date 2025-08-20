"use client";

import { createContext, useContext, useCallback, ReactNode, useMemo } from "react";
import { useAuthenticatedFetch } from "@lib/hooks/useAuthenticatedFetch";
import { useElectron } from "../../libElectron/contexts/ElectronContext";
import type { TournamentStats } from "@lib/types";

interface TournamentStatsContextType {
  // Stats actions
  getTournamentStats: (tournamentId: string) => Promise<{ success: boolean; stats?: TournamentStats; error?: string }>;
}

const TournamentStatsContext = createContext<TournamentStatsContextType | undefined>(undefined);

export function TournamentStatsProvider({ children }: { children: ReactNode }) {
  const { isElectron, useLocalData } = useElectron();
  const { authenticatedFetch } = useAuthenticatedFetch();

  // Check if we're in local data mode
  const isLocalDataMode = isElectron && useLocalData;

  const getTournamentStats = useCallback(
    async (
      tournamentId: string
    ): Promise<{
      success: boolean;
      stats?: TournamentStats;
      error?: string;
    }> => {
      try {
        if (isLocalDataMode) {
          // In local mode, return empty stats for now
          // This could be enhanced to calculate stats locally
          return { success: true, stats: undefined };
        }

        // Online mode - use API
        const response = await authenticatedFetch(`/api/v1/tournaments/${tournamentId}/stats`);

        if (response.ok) {
          const data = await response.json();
          return { success: true, stats: data.stats };
        } else {
          const errorData = await response.json();
          return {
            success: false,
            error: errorData.error || "Failed to get tournament stats"
          };
        }
      } catch (err) {
        const error = err instanceof Error ? err.message : "Failed to get tournament stats";
        return { success: false, error };
      }
    },
    [authenticatedFetch, isLocalDataMode]
  );

  const value: TournamentStatsContextType = useMemo(
    () => ({
      getTournamentStats
    }),
    [getTournamentStats]
  );

  return <TournamentStatsContext.Provider value={value}>{children}</TournamentStatsContext.Provider>;
}

export function useTournamentStats(): TournamentStatsContextType {
  const context = useContext(TournamentStatsContext);
  if (context === undefined) {
    throw new Error("useTournamentStats must be used within a TournamentStatsProvider");
  }
  return context;
}
