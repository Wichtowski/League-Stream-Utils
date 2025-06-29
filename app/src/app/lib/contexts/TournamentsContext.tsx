'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuthenticatedFetch } from '@lib/hooks/useAuthenticatedFetch';
import { useAuth } from './AuthContext';
import { useElectron } from './ElectronContext';
import { storage } from '@lib/utils/storage';
import type { Tournament, CreateTournamentRequest, TournamentStats, Bracket } from '@lib/types';

interface TournamentsContextType {
  // Data
  tournaments: Tournament[];
  myTournaments: Tournament[];
  registeredTournaments: Tournament[];
  loading: boolean;
  error: string | null;
  
  // Actions
  refreshTournaments: () => Promise<void>;
  createTournament: (tournamentData: CreateTournamentRequest) => Promise<{ success: boolean; tournament?: Tournament; error?: string }>;
  updateTournament: (tournamentId: string, updates: Partial<Tournament>) => Promise<{ success: boolean; tournament?: Tournament; error?: string }>;
  deleteTournament: (tournamentId: string) => Promise<{ success: boolean; error?: string }>;
  
  // Registration
  registerTeam: (tournamentId: string, teamId: string) => Promise<{ success: boolean; error?: string }>;
  unregisterTeam: (tournamentId: string, teamId: string) => Promise<{ success: boolean; error?: string }>;
  
  // Tournament management
  startTournament: (tournamentId: string) => Promise<{ success: boolean; error?: string }>;
  finalizeTournament: (tournamentId: string) => Promise<{ success: boolean; error?: string }>;
  
  // Brackets and games
  getBracket: (tournamentId: string) => Promise<{ success: boolean; bracket?: Bracket; error?: string }>;
  updateBracket: (tournamentId: string, bracket: Bracket) => Promise<{ success: boolean; error?: string }>;
  recordGameResult: (tournamentId: string, gameId: string, result: unknown) => Promise<{ success: boolean; error?: string }>;
  
  // Stats
  getTournamentStats: (tournamentId: string) => Promise<{ success: boolean; stats?: TournamentStats; error?: string }>;
  
  // Cache management
  clearCache: () => Promise<void>;
  getLastSync: () => Promise<Date | null>;
}

const TournamentsContext = createContext<TournamentsContextType | undefined>(undefined);

const CACHE_KEY = 'tournaments-data';
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes for tournaments (shorter due to frequent updates)
const SYNC_CHECK_INTERVAL = 20000; // 20 seconds (tournaments change more frequently)

// Simple electron storage helper to avoid blocking localStorage operations
const electronStorage = {
  async get<T>(key: string): Promise<T | null> {
    if (typeof window !== 'undefined' && window.electronAPI?.storage?.get) {
      try {
        const data = await window.electronAPI.storage.get(key);
        return data as T;
      } catch (err) {
        console.debug('Electron storage get failed:', err);
        return null;
      }
    }
    return null;
  },

  async set<T>(key: string, data: T): Promise<void> {
    if (typeof window !== 'undefined' && window.electronAPI?.storage?.set) {
      try {
        await window.electronAPI.storage.set(key, data);
      } catch (err) {
        console.debug('Electron storage set failed:', err);
      }
    }
  },

  async remove(key: string): Promise<void> {
    if (typeof window !== 'undefined' && window.electronAPI?.storage?.remove) {
      try {
        await window.electronAPI.storage.remove(key);
      } catch (err) {
        console.debug('Electron storage remove failed:', err);
      }
    }
  }
};

export function TournamentsProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const { isElectron, useLocalData } = useElectron();
  const { authenticatedFetch } = useAuthenticatedFetch();
  
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if we're in local data mode
  const isLocalDataMode = isElectron && useLocalData;

  // Computed data
  const myTournaments = tournaments.filter(t => t.userId === user?.id);
  const registeredTournaments = tournaments.filter(t => 
    t.registeredTeams?.includes(user?.id || '')
  );

  const areTournamentsEqual = useCallback((tournaments1: Tournament[], tournaments2: Tournament[]): boolean => {
    if (tournaments1.length !== tournaments2.length) return false;
    
    return tournaments1.every((tournament, index) => {
      const otherTournament = tournaments2[index];
      return tournament.id === otherTournament.id && 
             tournament.name === otherTournament.name &&
             tournament.status === otherTournament.status &&
             tournament.registeredTeams?.length === otherTournament.registeredTeams?.length;
    });
  }, []);

  const fetchTournamentsFromAPI = useCallback(async (showLoading = true): Promise<Tournament[]> => {
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
      const response = await authenticatedFetch('/api/v1/tournaments');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const fetchedTournaments = data.tournaments || [];
      
      // Check if data has changed
      const dataChanged = !areTournamentsEqual(tournaments, fetchedTournaments);
      
      if (dataChanged || tournaments.length === 0) {
        setTournaments(fetchedTournaments);
        await storage.set(CACHE_KEY, fetchedTournaments, { enableChecksum: true });
      }
      
      return fetchedTournaments;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tournaments';
      setError(errorMessage);
      console.error('Tournaments fetch error:', err);
      return [];
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [user, authenticatedFetch, tournaments, areTournamentsEqual, isLocalDataMode]);

  const checkDataSync = useCallback(async (): Promise<void> => {
    // Skip sync checks in local data mode
    if (isLocalDataMode) return;
    
    // Don't sync if user is not authenticated
    if (!user) return;

    try {
      const response = await authenticatedFetch('/api/v1/tournaments', { method: 'HEAD' });
      const lastModified = response.headers.get('Last-Modified');
      
      if (lastModified) {
        const cachedTimestamp = await storage.getTimestamp(CACHE_KEY);
        const serverTimestamp = new Date(lastModified).getTime();
        
        if (!cachedTimestamp || serverTimestamp > cachedTimestamp) {
          console.log('Tournaments data outdated, refreshing...');
          await fetchTournamentsFromAPI(false);
        }
      }
    } catch (err) {
      console.debug('Background tournament sync check failed:', err);
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
        
        if (cachedTournaments) {
          setTournaments(cachedTournaments);
          // Fetch fresh data in background
          fetchTournamentsFromAPI(false);
        } else {
          // No cache, fetch fresh data
          await fetchTournamentsFromAPI(true);
        }
      }
    } catch (err) {
      console.error('Failed to load cached tournaments:', err);
      if (!isLocalDataMode) {
        await fetchTournamentsFromAPI(true);
      } else {
        setLoading(false);
      }
    }
  }, [user, fetchTournamentsFromAPI, isLocalDataMode]);

  useEffect(() => {
    if (!authLoading) {
      // Use setTimeout to avoid blocking the UI thread
      setTimeout(() => {
        loadCachedData();
      }, 0);
    }
  }, [user, authLoading, loadCachedData]);

  useEffect(() => {
    // Skip sync checks in local data mode
    if (!user || authLoading || isLocalDataMode) return;

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

  const createTournament = useCallback(async (tournamentData: CreateTournamentRequest): Promise<{ success: boolean; tournament?: Tournament; error?: string }> => {
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
          registrationDeadline: tournamentData.registrationDeadline ? new Date(tournamentData.registrationDeadline) : undefined,
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
          status: 'draft',
          allowSubstitutes: true,
          maxSubstitutes: 2,
          timezone: tournamentData.timezone,
          matchDays: tournamentData.matchDays,
          defaultMatchTime: tournamentData.defaultMatchTime,
          streamUrl: tournamentData.streamUrl,
          broadcastLanguage: tournamentData.broadcastLanguage,
          userId: user?.id || 'electron-admin',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const updatedTournaments = [newTournament, ...tournaments];
        setTournaments(updatedTournaments);
        await electronStorage.set(CACHE_KEY, updatedTournaments);
        return { success: true, tournament: newTournament };
      }

      // Online mode - use API
      const response = await authenticatedFetch('/api/v1/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tournamentData)
      });

      const data = await response.json();

      if (response.ok) {
        const newTournament = data.tournament;
        const updatedTournaments = [newTournament, ...tournaments];
        setTournaments(updatedTournaments);
        await storage.set(CACHE_KEY, updatedTournaments, { enableChecksum: true });
        return { success: true, tournament: newTournament };
      } else {
        return { success: false, error: data.error || 'Failed to create tournament' };
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to create tournament';
      return { success: false, error };
    }
  }, [tournaments, authenticatedFetch, isLocalDataMode, user]);

  const updateTournament = useCallback(async (tournamentId: string, updates: Partial<Tournament>): Promise<{ success: boolean; tournament?: Tournament; error?: string }> => {
    try {
      if (isLocalDataMode) {
        // Update tournament locally
        const updatedTournaments = tournaments.map(tournament => 
          tournament.id === tournamentId ? { ...tournament, ...updates, updatedAt: new Date() } : tournament
        );
        setTournaments(updatedTournaments);
        await electronStorage.set(CACHE_KEY, updatedTournaments);
        const updatedTournament = updatedTournaments.find(t => t.id === tournamentId);
        return { success: true, tournament: updatedTournament };
      }

      // Online mode - use API
      const response = await authenticatedFetch(`/api/v1/tournaments/${tournamentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      const data = await response.json();

      if (response.ok) {
        const updatedTournament = data.tournament;
        const updatedTournaments = tournaments.map(tournament => 
          tournament.id === tournamentId ? updatedTournament : tournament
        );
        setTournaments(updatedTournaments);
        await storage.set(CACHE_KEY, updatedTournaments, { enableChecksum: true });
        return { success: true, tournament: updatedTournament };
      } else {
        return { success: false, error: data.error || 'Failed to update tournament' };
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update tournament';
      return { success: false, error };
    }
  }, [tournaments, authenticatedFetch, isLocalDataMode]);

  const deleteTournament = useCallback(async (tournamentId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (isLocalDataMode) {
        // Delete tournament locally
        const updatedTournaments = tournaments.filter(tournament => tournament.id !== tournamentId);
        setTournaments(updatedTournaments);
        await electronStorage.set(CACHE_KEY, updatedTournaments);
        return { success: true };
      }

      // Online mode - use API
      const response = await authenticatedFetch(`/api/v1/tournaments/${tournamentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const updatedTournaments = tournaments.filter(tournament => tournament.id !== tournamentId);
        setTournaments(updatedTournaments);
        await storage.set(CACHE_KEY, updatedTournaments, { enableChecksum: true });
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.error || 'Failed to delete tournament' };
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to delete tournament';
      return { success: false, error };
    }
  }, [tournaments, authenticatedFetch, isLocalDataMode]);

  const registerTeam = useCallback(async (tournamentId: string, teamId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (isLocalDataMode) {
        // Register team locally
        const updatedTournaments = tournaments.map(tournament => 
          tournament.id === tournamentId 
            ? { ...tournament, registeredTeams: [...tournament.registeredTeams, teamId], updatedAt: new Date() }
            : tournament
        );
        setTournaments(updatedTournaments);
        await electronStorage.set(CACHE_KEY, updatedTournaments);
        return { success: true };
      }

      // Online mode - use API
      const response = await authenticatedFetch(`/api/v1/tournaments/${tournamentId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId })
      });

      if (response.ok) {
        const data = await response.json();
        const updatedTournaments = tournaments.map(tournament => 
          tournament.id === tournamentId ? data.tournament : tournament
        );
        setTournaments(updatedTournaments);
        await storage.set(CACHE_KEY, updatedTournaments, { enableChecksum: true });
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.error || 'Failed to register team' };
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to register team';
      return { success: false, error };
    }
  }, [tournaments, authenticatedFetch, isLocalDataMode]);

  const unregisterTeam = useCallback(async (tournamentId: string, teamId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (isLocalDataMode) {
        // Unregister team locally
        const updatedTournaments = tournaments.map(tournament => 
          tournament.id === tournamentId 
            ? { ...tournament, registeredTeams: tournament.registeredTeams.filter(id => id !== teamId), updatedAt: new Date() }
            : tournament
        );
        setTournaments(updatedTournaments);
        await electronStorage.set(CACHE_KEY, updatedTournaments);
        return { success: true };
      }

      // Online mode - use API
      const response = await authenticatedFetch(`/api/v1/tournaments/${tournamentId}/unregister`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId })
      });

      if (response.ok) {
        const data = await response.json();
        const updatedTournaments = tournaments.map(tournament => 
          tournament.id === tournamentId ? data.tournament : tournament
        );
        setTournaments(updatedTournaments);
        await storage.set(CACHE_KEY, updatedTournaments, { enableChecksum: true });
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.error || 'Failed to unregister team' };
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to unregister team';
      return { success: false, error };
    }
  }, [tournaments, authenticatedFetch, isLocalDataMode]);

  const startTournament = useCallback(async (tournamentId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (isLocalDataMode) {
        // Start tournament locally
        const updatedTournaments = tournaments.map(tournament => 
          tournament.id === tournamentId 
            ? { ...tournament, status: 'ongoing' as const, updatedAt: new Date() }
            : tournament
        );
        setTournaments(updatedTournaments);
        await electronStorage.set(CACHE_KEY, updatedTournaments);
        return { success: true };
      }

      // Online mode - use API
      const response = await authenticatedFetch(`/api/v1/tournaments/${tournamentId}/start`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        const updatedTournaments = tournaments.map(tournament => 
          tournament.id === tournamentId ? data.tournament : tournament
        );
        setTournaments(updatedTournaments);
        await storage.set(CACHE_KEY, updatedTournaments, { enableChecksum: true });
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.error || 'Failed to start tournament' };
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to start tournament';
      return { success: false, error };
    }
  }, [tournaments, authenticatedFetch, isLocalDataMode]);

  const finalizeTournament = useCallback(async (tournamentId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (isLocalDataMode) {
        // Finalize tournament locally
        const updatedTournaments = tournaments.map(tournament => 
          tournament.id === tournamentId 
            ? { ...tournament, status: 'completed' as const, updatedAt: new Date() }
            : tournament
        );
        setTournaments(updatedTournaments);
        await electronStorage.set(CACHE_KEY, updatedTournaments);
        return { success: true };
      }

      // Online mode - use API
      const response = await authenticatedFetch(`/api/v1/tournaments/${tournamentId}/finalize`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        const updatedTournaments = tournaments.map(tournament => 
          tournament.id === tournamentId ? data.tournament : tournament
        );
        setTournaments(updatedTournaments);
        await storage.set(CACHE_KEY, updatedTournaments, { enableChecksum: true });
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.error || 'Failed to finalize tournament' };
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to finalize tournament';
      return { success: false, error };
    }
  }, [tournaments, authenticatedFetch, isLocalDataMode]);

  const getBracket = useCallback(async (tournamentId: string): Promise<{ success: boolean; bracket?: Bracket; error?: string }> => {
    try {
      if (isLocalDataMode) {
        // Return empty bracket for local mode
        return { success: true, bracket: undefined };
      }

      // Online mode - use API
      const response = await authenticatedFetch(`/api/v1/tournaments/${tournamentId}/bracket`);

      if (response.ok) {
        const data = await response.json();
        return { success: true, bracket: data.bracket };
      } else {
        const data = await response.json();
        return { success: false, error: data.error || 'Failed to get bracket' };
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to get bracket';
      return { success: false, error };
    }
  }, [authenticatedFetch, isLocalDataMode]);

  const updateBracket = useCallback(async (tournamentId: string, bracket: Bracket): Promise<{ success: boolean; error?: string }> => {
    try {
      if (isLocalDataMode) {
        // Store bracket locally (could be enhanced with local storage)
        return { success: true };
      }

      // Online mode - use API
      const response = await authenticatedFetch(`/api/v1/tournaments/${tournamentId}/bracket`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bracket })
      });

      if (response.ok) {
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.error || 'Failed to update bracket' };
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update bracket';
      return { success: false, error };
    }
  }, [authenticatedFetch, isLocalDataMode]);

  const recordGameResult = useCallback(async (tournamentId: string, gameId: string, result: unknown): Promise<{ success: boolean; error?: string }> => {
    try {
      if (isLocalDataMode) {
        // Store game result locally (could be enhanced with local storage)
        return { success: true };
      }

      // Online mode - use API
      const response = await authenticatedFetch(`/api/v1/tournaments/${tournamentId}/games/${gameId}/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
      });

      if (response.ok) {
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.error || 'Failed to record game result' };
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to record game result';
      return { success: false, error };
    }
  }, [authenticatedFetch, isLocalDataMode]);

  const getTournamentStats = useCallback(async (tournamentId: string): Promise<{ success: boolean; stats?: TournamentStats; error?: string }> => {
    try {
      if (isLocalDataMode) {
        // Return empty stats for local mode
        return { success: true, stats: undefined };
      }

      // Online mode - use API
      const response = await authenticatedFetch(`/api/v1/tournaments/${tournamentId}/stats`);

      if (response.ok) {
        const data = await response.json();
        return { success: true, stats: data.stats };
      } else {
        const data = await response.json();
        return { success: false, error: data.error || 'Failed to get tournament stats' };
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to get tournament stats';
      return { success: false, error };
    }
  }, [authenticatedFetch, isLocalDataMode]);

  const clearCache = useCallback(async (): Promise<void> => {
    if (isLocalDataMode) {
      await electronStorage.remove(CACHE_KEY);
    } else {
      await storage.remove(CACHE_KEY);
    }
    setTournaments([]);
  }, [isLocalDataMode]);

  const getLastSync = useCallback(async (): Promise<Date | null> => {
    try {
      if (isLocalDataMode) {
        return null; // No sync in local mode
      } else {
        const timestamp = await storage.getTimestamp(CACHE_KEY);
        return timestamp ? new Date(timestamp) : null;
      }
    } catch {
      return null;
    }
  }, [isLocalDataMode]);

  const value: TournamentsContextType = {
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
    getBracket,
    updateBracket,
    recordGameResult,
    getTournamentStats,
    clearCache,
    getLastSync
  };

  return (
    <TournamentsContext.Provider value={value}>
      {children}
    </TournamentsContext.Provider>
  );
}

export function useTournaments() {
  const context = useContext(TournamentsContext);
  if (context === undefined) {
    throw new Error('useTournaments must be used within a TournamentsProvider');
  }
  return context;
} 