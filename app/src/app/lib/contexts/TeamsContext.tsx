'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuthenticatedFetch } from '@lib/hooks/useAuthenticatedFetch';
import { useAuth } from './AuthContext';
import { storage } from '@lib/utils/storage';
import type { Team, CreateTeamRequest } from '@lib/types';

interface TeamsContextType {
  // Data
  teams: Team[];
  loading: boolean;
  error: string | null;
  
  // Actions
  refreshTeams: () => Promise<void>;
  createTeam: (teamData: CreateTeamRequest) => Promise<{ success: boolean; team?: Team; error?: string }>;
  updateTeam: (teamId: string, updates: Partial<Team>) => Promise<{ success: boolean; team?: Team; error?: string }>;
  deleteTeam: (teamId: string) => Promise<{ success: boolean; error?: string }>;
  verifyTeam: (teamId: string) => Promise<{ success: boolean; error?: string }>;
  verifyPlayer: (teamId: string, playerId: string) => Promise<{ success: boolean; error?: string }>;
  verifyAllPlayers: (teamId: string) => Promise<{ success: boolean; error?: string }>;
  
  // Cache management
  clearCache: () => Promise<void>;
  getLastSync: () => Promise<Date | null>;
}

const TeamsContext = createContext<TeamsContextType | undefined>(undefined);

const CACHE_KEY = 'teams-data';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const SYNC_CHECK_INTERVAL = 30000; // 30 seconds

export function TeamsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { authenticatedFetch } = useAuthenticatedFetch();
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  // Load cached data on mount
  useEffect(() => {
    loadCachedData();
  }, [user]);

  // Periodic sync check
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      checkDataSync();
    }, SYNC_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [user, lastFetch]);

  const loadCachedData = async (): Promise<void> => {
    // Don't fetch data if user is not authenticated
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const cachedTeams = await storage.get<Team[]>(CACHE_KEY, { 
        ttl: CACHE_TTL,
        enableChecksum: true 
      });
      
      if (cachedTeams) {
        setTeams(cachedTeams);
        setLoading(false);
        const timestamp = await storage.getTimestamp(CACHE_KEY);
        if (timestamp) {
          setLastFetch(timestamp);
        }
        
        // Still fetch fresh data in background for potential updates
        fetchTeamsFromAPI(false);
      } else {
        // No cache, fetch fresh data
        await fetchTeamsFromAPI(true);
      }
    } catch (err) {
      console.error('Failed to load cached teams:', err);
      await fetchTeamsFromAPI(true);
    }
  };

  const fetchTeamsFromAPI = async (showLoading = true): Promise<Team[]> => {
    // Don't fetch if user is not authenticated
    if (!user) {
      if (showLoading) setLoading(false);
      return [];
    }

    if (showLoading) setLoading(true);
    setError(null);

    try {
      const response = await authenticatedFetch('/api/v1/teams');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const fetchedTeams = data.teams || [];
      
      // Check if data has changed
      const dataChanged = !areTeamsEqual(teams, fetchedTeams);
      
      if (dataChanged || teams.length === 0) {
        setTeams(fetchedTeams);
        await storage.set(CACHE_KEY, fetchedTeams, { enableChecksum: true });
      }
      
      setLastFetch(Date.now());
      return fetchedTeams;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch teams';
      setError(errorMessage);
      console.error('Teams fetch error:', err);
      return [];
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const checkDataSync = async (): Promise<void> => {
    // Don't sync if user is not authenticated
    if (!user) return;

    try {
      // Quick HEAD request to check if data has changed
      const response = await authenticatedFetch('/api/v1/teams', { method: 'HEAD' });
      const lastModified = response.headers.get('Last-Modified');
      const etag = response.headers.get('ETag');
      
      if (lastModified || etag) {
        const cachedTimestamp = await storage.getTimestamp(CACHE_KEY);
        const serverTimestamp = lastModified ? new Date(lastModified).getTime() : 0;
        
        if (!cachedTimestamp || serverTimestamp > cachedTimestamp) {
          console.log('Teams data outdated, refreshing...');
          await fetchTeamsFromAPI(false);
        }
      }
    } catch (err) {
      // Silent fail for background sync checks
      console.debug('Background sync check failed:', err);
    }
  };

  const areTeamsEqual = (teams1: Team[], teams2: Team[]): boolean => {
    if (teams1.length !== teams2.length) return false;
    
    return teams1.every((team, index) => {
      const otherTeam = teams2[index];
      return team.id === otherTeam.id && 
             team.name === otherTeam.name &&
             team.verified === otherTeam.verified &&
             JSON.stringify(team.players) === JSON.stringify(otherTeam.players);
    });
  };

  const refreshTeams = useCallback(async (): Promise<void> => {
    await fetchTeamsFromAPI(true);
  }, []);

  const createTeam = useCallback(async (teamData: CreateTeamRequest): Promise<{ success: boolean; team?: Team; error?: string }> => {
    try {
      const response = await authenticatedFetch('/api/v1/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamData)
      });

      const data = await response.json();

      if (response.ok) {
        const newTeam = data.team;
        const updatedTeams = [newTeam, ...teams];
        setTeams(updatedTeams);
        await storage.set(CACHE_KEY, updatedTeams, { enableChecksum: true });
        return { success: true, team: newTeam };
      } else {
        return { success: false, error: data.error || 'Failed to create team' };
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to create team';
      return { success: false, error };
    }
  }, [teams, authenticatedFetch]);

  const updateTeam = useCallback(async (teamId: string, updates: Partial<Team>): Promise<{ success: boolean; team?: Team; error?: string }> => {
    try {
      const response = await authenticatedFetch(`/api/v1/teams/${teamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      const data = await response.json();

      if (response.ok) {
        const updatedTeam = data.team;
        const updatedTeams = teams.map(team => 
          team.id === teamId ? updatedTeam : team
        );
        setTeams(updatedTeams);
        await storage.set(CACHE_KEY, updatedTeams, { enableChecksum: true });
        return { success: true, team: updatedTeam };
      } else {
        return { success: false, error: data.error || 'Failed to update team' };
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update team';
      return { success: false, error };
    }
  }, [teams, authenticatedFetch]);

  const deleteTeam = useCallback(async (teamId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authenticatedFetch(`/api/v1/teams/${teamId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const updatedTeams = teams.filter(team => team.id !== teamId);
        setTeams(updatedTeams);
        await storage.set(CACHE_KEY, updatedTeams, { enableChecksum: true });
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.error || 'Failed to delete team' };
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to delete team';
      return { success: false, error };
    }
  }, [teams, authenticatedFetch]);

  const verifyTeam = useCallback(async (teamId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authenticatedFetch(`/api/v1/teams/${teamId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: true, verifyPlayers: true })
      });

      if (response.ok) {
        // Refresh teams to get updated verification status
        await fetchTeamsFromAPI(false);
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.error || 'Failed to verify team' };
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to verify team';
      return { success: false, error };
    }
  }, [authenticatedFetch]);

  const verifyPlayer = useCallback(async (teamId: string, playerId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authenticatedFetch(`/api/v1/teams/${teamId}/players/${playerId}/verify`, {
        method: 'POST'
      });

      if (response.ok) {
        // Refresh teams to get updated verification status
        await fetchTeamsFromAPI(false);
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.error || 'Failed to verify player' };
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to verify player';
      return { success: false, error };
    }
  }, [authenticatedFetch]);

  const verifyAllPlayers = useCallback(async (teamId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const team = teams.find(t => t.id === teamId);
      if (!team) {
        return { success: false, error: 'Team not found' };
      }

      // Verify all main players
      const allPlayers = [...team.players.main, ...team.players.substitutes];
      const verificationPromises = allPlayers.map(player => 
        verifyPlayer(teamId, player.id)
      );

      const results = await Promise.all(verificationPromises);
      const failed = results.filter(r => !r.success);

      if (failed.length === 0) {
        return { success: true };
      } else {
        return { 
          success: false, 
          error: `Failed to verify ${failed.length} player(s)` 
        };
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to verify players';
      return { success: false, error };
    }
  }, [teams, verifyPlayer]);

  const clearCache = useCallback(async (): Promise<void> => {
    await storage.remove(CACHE_KEY);
    setTeams([]);
    setLastFetch(0);
  }, []);

  const getLastSync = useCallback(async (): Promise<Date | null> => {
    const timestamp = await storage.getTimestamp(CACHE_KEY);
    return timestamp ? new Date(timestamp) : null;
  }, []);

  const value: TeamsContextType = {
    teams,
    loading,
    error,
    refreshTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    verifyTeam,
    verifyPlayer,
    verifyAllPlayers,
    clearCache,
    getLastSync
  };

  return (
    <TeamsContext.Provider value={value}>
      {children}
    </TeamsContext.Provider>
  );
}

export function useTeams() {
  const context = useContext(TeamsContext);
  if (context === undefined) {
    throw new Error('useTeams must be used within a TeamsProvider');
  }
  return context;
} 