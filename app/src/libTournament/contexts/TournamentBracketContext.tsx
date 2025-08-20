"use client";

import { createContext, useContext, useCallback, ReactNode, useMemo } from "react";
import { useAuthenticatedFetch } from "@lib/hooks/useAuthenticatedFetch";
import { useElectron } from "../../libElectron/contexts/ElectronContext";
import type { Bracket } from "@lib/types";

interface TournamentBracketContextType {
  // Bracket actions
  getBracket: (tournamentId: string) => Promise<{ success: boolean; bracket?: Bracket; error?: string }>;
  updateBracket: (tournamentId: string, bracket: Bracket) => Promise<{ success: boolean; error?: string }>;
  recordGameResult: (
    tournamentId: string,
    gameId: string,
    result: unknown
  ) => Promise<{ success: boolean; error?: string }>;
}

const TournamentBracketContext = createContext<TournamentBracketContextType | undefined>(undefined);

export function TournamentBracketProvider({ children }: { children: ReactNode }) {
  const { isElectron, useLocalData } = useElectron();
  const { authenticatedFetch } = useAuthenticatedFetch();

  // Check if we're in local data mode
  const isLocalDataMode = isElectron && useLocalData;

  const getBracket = useCallback(
    async (tournamentId: string): Promise<{ success: boolean; bracket?: Bracket; error?: string }> => {
      try {
        if (isLocalDataMode) {
          // In local mode, return empty bracket for now
          // This could be enhanced to store brackets locally
          return { success: true, bracket: undefined };
        }

        // Online mode - use API
        const response = await authenticatedFetch(`/api/v1/tournaments/${tournamentId}/bracket`);

        if (response.ok) {
          const data = await response.json();
          return { success: true, bracket: data.bracket };
        } else {
          const errorData = await response.json();
          return {
            success: false,
            error: errorData.error || "Failed to get bracket"
          };
        }
      } catch (err) {
        const error = err instanceof Error ? err.message : "Failed to get bracket";
        return { success: false, error };
      }
    },
    [authenticatedFetch, isLocalDataMode]
  );

  const updateBracket = useCallback(
    async (tournamentId: string, bracket: Bracket): Promise<{ success: boolean; error?: string }> => {
      try {
        if (isLocalDataMode) {
          // In local mode, just return success for now
          // This could be enhanced to store brackets locally
          return { success: true };
        }

        // Online mode - use API
        const response = await authenticatedFetch(`/api/v1/tournaments/${tournamentId}/bracket`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bracket)
        });

        if (response.ok) {
          return { success: true };
        } else {
          const errorData = await response.json();
          return {
            success: false,
            error: errorData.error || "Failed to update bracket"
          };
        }
      } catch (err) {
        const error = err instanceof Error ? err.message : "Failed to update bracket";
        return { success: false, error };
      }
    },
    [authenticatedFetch, isLocalDataMode]
  );

  const recordGameResult = useCallback(
    async (tournamentId: string, gameId: string, result: unknown): Promise<{ success: boolean; error?: string }> => {
      try {
        if (isLocalDataMode) {
          // In local mode, just return success for now
          // This could be enhanced to store game results locally
          return { success: true };
        }

        // Online mode - use API
        const response = await authenticatedFetch(`/api/v1/tournaments/${tournamentId}/games`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameId, result })
        });

        if (response.ok) {
          return { success: true };
        } else {
          const errorData = await response.json();
          return {
            success: false,
            error: errorData.error || "Failed to record game result"
          };
        }
      } catch (err) {
        const error = err instanceof Error ? err.message : "Failed to record game result";
        return { success: false, error };
      }
    },
    [authenticatedFetch, isLocalDataMode]
  );

  const value: TournamentBracketContextType = useMemo(
    () => ({
      getBracket,
      updateBracket,
      recordGameResult
    }),
    [getBracket, updateBracket, recordGameResult]
  );

  return <TournamentBracketContext.Provider value={value}>{children}</TournamentBracketContext.Provider>;
}

export function useTournamentBracket(): TournamentBracketContextType {
  const context = useContext(TournamentBracketContext);
  if (context === undefined) {
    throw new Error("useTournamentBracket must be used within a TournamentBracketProvider");
  }
  return context;
}
