"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from "react";
import { useAuthenticatedFetch } from "@lib/hooks/useAuthenticatedFetch";
import { useAuth } from "../../lib/contexts/AuthContext";
import { useElectron } from "../../libElectron/contexts/ElectronContext";
import { storage } from "@lib/services/common/UniversalStorage";
import type { Tournament, CreateTournamentRequest } from "@lib/types";

interface TournamentDataContextType {
  // Data
  tournaments: Tournament[];
  myTournaments: Tournament[];
  registeredTournaments: Tournament[];
  loading: boolean;
  error: string | null;

  // Actions
  refreshTournaments: () => Promise<void>;
  createTournament: (
    tournamentData: CreateTournamentRequest
  ) => Promise<{ success: boolean; tournament?: Tournament; error?: string }>;
  updateTournament: (
    tournamentId: string,
    updates: Partial<Tournament>
  ) => Promise<{ success: boolean; tournament?: Tournament; error?: string }>;
  deleteTournament: (tournamentId: string) => Promise<{ success: boolean; error?: string }>;

  // Registration
  registerTeam: (tournamentId: string, teamId: string) => Promise<{ success: boolean; error?: string }>;
  unregisterTeam: (tournamentId: string, teamId: string) => Promise<{ success: boolean; error?: string }>;

  // Tournament management
  startTournament: (tournamentId: string) => Promise<{ success: boolean; error?: string }>;
  finalizeTournament: (tournamentId: string) => Promise<{ success: boolean; error?: string }>;

  // Cache management
  clearCache: () => Promise<void>;
  getLastSync: () => Promise<Date | null>;
}

const TournamentDataContext = createContext<TournamentDataContextType | undefined>(undefined);

const CACHE_KEY = "tournaments-data";
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes for tournaments (shorter due to frequent updates)
const SYNC_CHECK_INTERVAL = 20000; // 20 seconds (tournaments change more frequently)

// Simple electron storage helper to avoid blocking localStorage operations
const electronStorage = {
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
};

// Utility to strip base64 logo data from tournaments before caching
function stripLogos<T extends { logo?: { type?: string; data?: string; url?: string } }>(tournaments: T[]): T[] {
  return tournaments.map((t) => {
    if (t.logo && t.logo.type === "upload") {
      return { ...t, logo: { ...t.logo, data: undefined } };
    }
    return t;
  });
}

export function TournamentDataProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const { isElectron, useLocalData } = useElectron();
  const { authenticatedFetch } = useAuthenticatedFetch();

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if we're in local data mode
  const isLocalDataMode = isElectron && useLocalData;

  // Computed data
  const myTournaments = useMemo(() => tournaments.filter((t) => t.userId === user?.id), [tournaments, user?.id]);

  const registeredTournaments = useMemo(
    () => tournaments.filter((t) => t.registeredTeams?.includes(user?.id || "")),
    [tournaments, user?.id]
  );

  const areTournamentsEqual = useCallback((tournaments1: Tournament[], tournaments2: Tournament[]): boolean => {
    if (tournaments1.length !== tournaments2.length) return false;

    return tournaments1.every((tournament, index) => {
      const otherTournament = tournaments2[index];
      return (
        tournament.id === otherTournament.id &&
        tournament.name === otherTournament.name &&
        tournament.status === otherTournament.status &&
        tournament.registeredTeams?.length === otherTournament.registeredTeams?.length
      );
    });
  }, []);

  const fetchTournamentsFromAPI = useCallback(
    async (showLoading = true): Promise<Tournament[]> => {
      // Skip API calls in local data mode
      if (isLocalDataMode) {
        if (showLoading) setLoading(false);
        return tournaments;
      }

      // Don't fetch if user is not authenticated
      if (!user) {
        if (showLoading) setLoading(false);
        return [];
      }

      if (showLoading) setLoading(true);
      setError(null);

      try {
        const response = await authenticatedFetch("/api/v1/tournaments");

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const fetchedTournaments = data.tournaments || [];

        // Check if data has changed
        const dataChanged = !areTournamentsEqual(tournaments, fetchedTournaments);

        if (dataChanged || tournaments.length === 0) {
          setTournaments(fetchedTournaments);
          await storage.set(CACHE_KEY, stripLogos(fetchedTournaments), {
            enableChecksum: true
          });
        }

        return fetchedTournaments;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch tournaments";
        setError(errorMessage);
        console.error("Tournaments fetch error:", err);
        return [];
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [user, authenticatedFetch, tournaments, areTournamentsEqual, isLocalDataMode]
  );

  const checkDataSync = useCallback(async (): Promise<void> => {
    // Skip sync checks in local data mode
    if (isLocalDataMode) return;

    // Don't sync if user is not authenticated
    if (!user) return;

    try {
      const response = await authenticatedFetch("/api/v1/tournaments", {
        method: "HEAD"
      });
      const lastModified = response.headers.get("Last-Modified");

      if (lastModified) {
        const cachedTimestamp = await storage.getTimestamp(CACHE_KEY);
        const serverTimestamp = new Date(lastModified).getTime();

        if (!cachedTimestamp || serverTimestamp > cachedTimestamp) {
          console.log("Tournaments data outdated, refreshing...");
          await fetchTournamentsFromAPI(false);
        }
      }
    } catch (err) {
      console.debug("Background tournament sync check failed:", err);
    }
  }, [user, authenticatedFetch, fetchTournamentsFromAPI, isLocalDataMode]);

  const loadCachedData = useCallback(async (): Promise<void> => {
    // Don't fetch data if user is not authenticated
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      if (isLocalDataMode) {
        // Use electron storage directly for local mode - non-blocking
        const cachedTournaments = await electronStorage.get<Tournament[]>(CACHE_KEY);
        if (cachedTournaments && Array.isArray(cachedTournaments)) {
          setTournaments(cachedTournaments);
        } else {
          setTournaments([]);
        }
        setLoading(false);
      } else {
        // Use universal storage for online mode
        const cachedTournaments = await storage.get<Tournament[]>(CACHE_KEY, {
          ttl: CACHE_TTL,
          enableChecksum: true
        });
        const timestamp = await storage.getTimestamp(CACHE_KEY);
        const now = Date.now();
        const isExpired = !timestamp || now - timestamp > CACHE_TTL;
        if (cachedTournaments) {
          setTournaments(cachedTournaments);
          setLoading(false);
          // Only fetch fresh data in background if cache is expired
          if (isExpired) {
            fetchTournamentsFromAPI(false);
          }
        } else {
          // No cache, fetch fresh data
          await fetchTournamentsFromAPI(true);
        }
      }
    } catch (err) {
      console.error("Failed to load cached tournaments:", err);
      if (!isLocalDataMode) {
        await fetchTournamentsFromAPI(true);
      } else {
        setLoading(false);
      }
    }
  }, [user, fetchTournamentsFromAPI, isLocalDataMode]);

  useEffect(() => {
    if (!authLoading) {
      // Use requestIdleCallback for better performance if available
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        (window as unknown as Window).requestIdleCallback(
          () => {
            loadCachedData();
          },
          { timeout: 1000 }
        );
      } else {
        // Fallback to setTimeout for immediate execution
        setTimeout(() => {
          loadCachedData();
        }, 0);
      }
    }
  }, [user, authLoading, loadCachedData]);

  useEffect(() => {
    // Skip sync checks in local data mode
    if (!user || authLoading || isLocalDataMode) return;

    // Check if we're on a tournament-related page
    const isTournamentPage =
      window.location.pathname.includes("/modules/tournaments") ||
      window.location.pathname.includes("/modules/pickban");

    if (!isTournamentPage) return;

    const interval = setInterval(() => {
      checkDataSync();
    }, SYNC_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [user, authLoading, checkDataSync, isLocalDataMode]);

  const refreshTournaments = useCallback(async (): Promise<void> => {
    if (isLocalDataMode) {
      // In local mode, just reload from electron storage
      await loadCachedData();
    } else {
      await fetchTournamentsFromAPI(true);
    }
  }, [fetchTournamentsFromAPI, loadCachedData, isLocalDataMode]);

  const createTournament = useCallback(
    async (
      tournamentData: CreateTournamentRequest
    ): Promise<{
      success: boolean;
      tournament?: Tournament;
      error?: string;
    }> => {
      try {
        if (isLocalDataMode) {
          // Create tournament locally
          const newTournament: Tournament = {
            id: `local-${Date.now()}`,
            name: tournamentData.name,
            abbreviation: tournamentData.abbreviation,
            startDate: new Date(tournamentData.startDate),
            endDate: new Date(tournamentData.endDate),
            requireRegistrationDeadline: tournamentData.requireRegistrationDeadline,
            registrationDeadline: tournamentData.registrationDeadline
              ? new Date(tournamentData.registrationDeadline)
              : undefined,
            matchFormat: tournamentData.matchFormat,
            tournamentFormat: tournamentData.tournamentFormat,
            phaseMatchFormats: tournamentData.phaseMatchFormats,
            maxTeams: tournamentData.maxTeams,
            registrationOpen: true,
            prizePool: tournamentData.prizePool,
            fearlessDraft: tournamentData.fearlessDraft,
            logo: tournamentData.logo,
            registeredTeams: [],
            selectedTeams: tournamentData.selectedTeams,
            status: "draft",
            allowSubstitutes: true,
            maxSubstitutes: 2,
            timezone: tournamentData.timezone,
            matchDays: tournamentData.matchDays,
            defaultMatchTime: tournamentData.defaultMatchTime,
            streamUrl: tournamentData.streamUrl,
            broadcastLanguage: tournamentData.broadcastLanguage,
            gameVersion: tournamentData.gameVersion,
            userId: user?.id || "electron-admin",
            createdAt: new Date(),
            updatedAt: new Date()
          };

          const updatedTournaments = [newTournament, ...tournaments];
          setTournaments(updatedTournaments);
          await electronStorage.set(CACHE_KEY, stripLogos(updatedTournaments));
          return { success: true, tournament: newTournament };
        }

        // Online mode - use API
        const response = await authenticatedFetch("/api/v1/tournaments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tournamentData)
        });

        if (response.ok) {
          const data = await response.json();
          const newTournament = data.tournament;

          // Update local state
          const updatedTournaments = [newTournament, ...tournaments];
          setTournaments(updatedTournaments);
          await storage.set(CACHE_KEY, stripLogos(updatedTournaments), {
            enableChecksum: true
          });

          return { success: true, tournament: newTournament };
        } else {
          const errorData = await response.json();
          return {
            success: false,
            error: errorData.error || "Failed to create tournament"
          };
        }
      } catch (err) {
        const error = err instanceof Error ? err.message : "Failed to create tournament";
        return { success: false, error };
      }
    },
    [authenticatedFetch, isLocalDataMode, tournaments, user?.id]
  );

  const updateTournament = useCallback(
    async (
      tournamentId: string,
      updates: Partial<Tournament>
    ): Promise<{
      success: boolean;
      tournament?: Tournament;
      error?: string;
    }> => {
      try {
        if (isLocalDataMode) {
          // Update tournament locally
          const updatedTournaments = tournaments.map((t) =>
            t.id === tournamentId ? { ...t, ...updates, updatedAt: new Date() } : t
          );
          setTournaments(updatedTournaments);
          await electronStorage.set(CACHE_KEY, stripLogos(updatedTournaments));

          const updatedTournament = updatedTournaments.find((t) => t.id === tournamentId);
          return { success: true, tournament: updatedTournament };
        }

        // Online mode - use API
        const response = await authenticatedFetch(`/api/v1/tournaments/${tournamentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates)
        });

        if (response.ok) {
          const data = await response.json();
          const updatedTournament = data.tournament;

          // Update local state
          const updatedTournaments = tournaments.map((t) => (t.id === tournamentId ? updatedTournament : t));
          setTournaments(updatedTournaments);
          await storage.set(CACHE_KEY, stripLogos(updatedTournaments), {
            enableChecksum: true
          });

          return { success: true, tournament: updatedTournament };
        } else {
          const errorData = await response.json();
          return {
            success: false,
            error: errorData.error || "Failed to update tournament"
          };
        }
      } catch (err) {
        const error = err instanceof Error ? err.message : "Failed to update tournament";
        return { success: false, error };
      }
    },
    [authenticatedFetch, isLocalDataMode, tournaments]
  );

  const deleteTournament = useCallback(
    async (tournamentId: string): Promise<{ success: boolean; error?: string }> => {
      try {
        if (isLocalDataMode) {
          // Delete tournament locally
          const updatedTournaments = tournaments.filter((t) => t.id !== tournamentId);
          setTournaments(updatedTournaments);
          await electronStorage.set(CACHE_KEY, stripLogos(updatedTournaments));
          return { success: true };
        }

        // Online mode - use API
        const response = await authenticatedFetch(`/api/v1/tournaments/${tournamentId}`, {
          method: "DELETE"
        });

        if (response.ok) {
          // Update local state
          const updatedTournaments = tournaments.filter((t) => t.id !== tournamentId);
          setTournaments(updatedTournaments);
          await storage.set(CACHE_KEY, stripLogos(updatedTournaments), {
            enableChecksum: true
          });

          return { success: true };
        } else {
          const errorData = await response.json();
          return {
            success: false,
            error: errorData.error || "Failed to delete tournament"
          };
        }
      } catch (err) {
        const error = err instanceof Error ? err.message : "Failed to delete tournament";
        return { success: false, error };
      }
    },
    [authenticatedFetch, isLocalDataMode, tournaments]
  );

  const registerTeam = useCallback(
    async (tournamentId: string, teamId: string): Promise<{ success: boolean; error?: string }> => {
      try {
        if (isLocalDataMode) {
          // Register team locally
          const updatedTournaments = tournaments.map((t) => {
            if (t.id === tournamentId) {
              const registeredTeams = t.registeredTeams || [];
              if (!registeredTeams.includes(teamId)) {
                return { ...t, registeredTeams: [...registeredTeams, teamId] };
              }
            }
            return t;
          });
          setTournaments(updatedTournaments);
          await electronStorage.set(CACHE_KEY, stripLogos(updatedTournaments));
          return { success: true };
        }

        // Online mode - use API
        const response = await authenticatedFetch(`/api/v1/tournaments/${tournamentId}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamId })
        });

        if (response.ok) {
          // Refresh tournaments to get updated data
          await fetchTournamentsFromAPI(false);
          return { success: true };
        } else {
          const errorData = await response.json();
          return {
            success: false,
            error: errorData.error || "Failed to register team"
          };
        }
      } catch (err) {
        const error = err instanceof Error ? err.message : "Failed to register team";
        return { success: false, error };
      }
    },
    [authenticatedFetch, isLocalDataMode, tournaments, fetchTournamentsFromAPI]
  );

  const unregisterTeam = useCallback(
    async (tournamentId: string, teamId: string): Promise<{ success: boolean; error?: string }> => {
      try {
        if (isLocalDataMode) {
          // Unregister team locally
          const updatedTournaments = tournaments.map((t) => {
            if (t.id === tournamentId) {
              const registeredTeams = t.registeredTeams || [];
              return {
                ...t,
                registeredTeams: registeredTeams.filter((id) => id !== teamId)
              };
            }
            return t;
          });
          setTournaments(updatedTournaments);
          await electronStorage.set(CACHE_KEY, stripLogos(updatedTournaments));
          return { success: true };
        }

        // Online mode - use API
        const response = await authenticatedFetch(`/api/v1/tournaments/${tournamentId}/register`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamId })
        });

        if (response.ok) {
          // Refresh tournaments to get updated data
          await fetchTournamentsFromAPI(false);
          return { success: true };
        } else {
          const errorData = await response.json();
          return {
            success: false,
            error: errorData.error || "Failed to unregister team"
          };
        }
      } catch (err) {
        const error = err instanceof Error ? err.message : "Failed to unregister team";
        return { success: false, error };
      }
    },
    [authenticatedFetch, isLocalDataMode, tournaments, fetchTournamentsFromAPI]
  );

  const startTournament = useCallback(
    async (tournamentId: string): Promise<{ success: boolean; error?: string }> => {
      return updateTournament(tournamentId, { status: "ongoing" });
    },
    [updateTournament]
  );

  const finalizeTournament = useCallback(
    async (tournamentId: string): Promise<{ success: boolean; error?: string }> => {
      return updateTournament(tournamentId, { status: "completed" });
    },
    [updateTournament]
  );

  const clearCache = useCallback(async (): Promise<void> => {
    if (isLocalDataMode) {
      await electronStorage.remove(CACHE_KEY);
    } else {
      await storage.remove(CACHE_KEY);
    }
    setTournaments([]);
  }, [isLocalDataMode]);

  const getLastSync = useCallback(async (): Promise<Date | null> => {
    if (isLocalDataMode) {
      return null; // Electron storage doesn't track timestamps
    }
    const timestamp = await storage.getTimestamp(CACHE_KEY);
    return timestamp ? new Date(timestamp) : null;
  }, [isLocalDataMode]);

  const value: TournamentDataContextType = useMemo(
    () => ({
      tournaments,
      myTournaments,
      registeredTournaments,
      loading,
      error,
      refreshTournaments,
      createTournament,
      updateTournament,
      deleteTournament,
      registerTeam,
      unregisterTeam,
      startTournament,
      finalizeTournament,
      clearCache,
      getLastSync
    }),
    [
      tournaments,
      myTournaments,
      registeredTournaments,
      loading,
      error,
      refreshTournaments,
      createTournament,
      updateTournament,
      deleteTournament,
      registerTeam,
      unregisterTeam,
      startTournament,
      finalizeTournament,
      clearCache,
      getLastSync
    ]
  );

  return <TournamentDataContext.Provider value={value}>{children}</TournamentDataContext.Provider>;
}

export function useTournamentData(): TournamentDataContextType {
  const context = useContext(TournamentDataContext);
  if (context === undefined) {
    throw new Error("useTournamentData must be used within a TournamentDataProvider");
  }
  return context;
}
