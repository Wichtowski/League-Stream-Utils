'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { useAuthenticatedFetch } from '@lib/hooks/useAuthenticatedFetch';
import { useAuth } from './AuthContext';
import { useElectron } from './ElectronContext';
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
  updateTeam: (teamId: string, updates: Partial<CreateTeamRequest>) => Promise<{ success: boolean; team?: Team; error?: string }>;
  deleteTeam: (teamId: string) => Promise<{ success: boolean; error?: string }>;
  verifyTeam: (teamId: string) => Promise<{ success: boolean; error?: string }>;
  verifyPlayer: (teamId: string, playerId: string, gameName: string, tagLine: string) => Promise<{ success: boolean; error?: string }>;
  verifyAllPlayers: (teamId: string) => Promise<{ success: boolean; error?: string }>;
  
  // Cache management
  clearCache: () => Promise<void>;
  getLastSync: () => Promise<Date | null>;
}

const TeamsContext = createContext<TeamsContextType | undefined>(undefined);

const CACHE_KEY = 'teams-data';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const SYNC_CHECK_INTERVAL = 30000; // 30 seconds

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

export function TeamsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { isElectron, useLocalData } = useElectron();
  const { authenticatedFetch } = useAuthenticatedFetch();
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  // Check if we're in local data mode
  const isLocalDataMode = isElectron && useLocalData;

  const areTeamsEqual = useCallback((teams1: Team[], teams2: Team[]): boolean => {
    if (teams1.length !== teams2.length) return false;
    
    return teams1.every((team, index) => {
      const otherTeam = teams2[index];
      if (!team || !otherTeam) return false;
      return team.id === otherTeam.id && 
             team.name === otherTeam.name &&
             team.verified === otherTeam.verified &&
             team.players && otherTeam.players &&
             team.players.main && otherTeam.players.main &&
             team.players.main.length === otherTeam.players.main.length &&
             team.players.substitutes && otherTeam.players.substitutes &&
             team.players.substitutes.length === otherTeam.players.substitutes.length;
    });
  }, []);

  const fetchTeamsFromAPI = useCallback(async (showLoading = true): Promise<Team[]> => {
    // Skip API calls in local data mode
    if (isLocalDataMode) {
      if (showLoading) setLoading(false);
      return teams;
    }

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
  }, [user, isLocalDataMode, teams, authenticatedFetch, areTeamsEqual]);

  const loadCachedData = useCallback(async (): Promise<void> => {
    // Don't fetch data if user is not authenticated
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      if (isLocalDataMode) {
        // Use electron storage directly for local mode - non-blocking
        const cachedTeams = await electronStorage.get<Team[]>(CACHE_KEY);
        if (cachedTeams && Array.isArray(cachedTeams)) {
          setTeams(cachedTeams);
        } else {
          setTeams([]);
        }
        setLoading(false);
      } else {
        // Use universal storage for online mode
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
      }
    } catch (err) {
      console.error('Failed to load cached teams:', err);
      if (!isLocalDataMode) {
        await fetchTeamsFromAPI(true);
      } else {
        setLoading(false);
      }
    }
  }, [user, isLocalDataMode, fetchTeamsFromAPI]);

  const checkDataSync = useCallback(async (): Promise<void> => {
    // Skip sync checks in local data mode
    if (isLocalDataMode) return;

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
      console.debug('Background sync check failed:', err);
    }
  }, [isLocalDataMode, fetchTeamsFromAPI, authenticatedFetch]);

  useEffect(() => {
    setTimeout(() => {
      loadCachedData();
    }, 0);
  }, [user, loadCachedData]);

  useEffect(() => {
    if (!user || isLocalDataMode) return;

    const interval = setInterval(() => {
      checkDataSync();
    }, SYNC_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [user, lastFetch, isLocalDataMode, checkDataSync, authenticatedFetch, fetchTeamsFromAPI]);

  const refreshTeams = useCallback(async (): Promise<void> => {
    if (isLocalDataMode) {
      // In local mode, just reload from electron storage
      await loadCachedData();
    } else {
      await fetchTeamsFromAPI(true);
    }
  }, [isLocalDataMode, loadCachedData, fetchTeamsFromAPI]);

  const createTeam = useCallback(async (teamData: CreateTeamRequest): Promise<{ success: boolean; team?: Team; error?: string }> => {
    try {
      if (isLocalDataMode) {
        // Create team locally
        const mainPlayers: Team['players']['main'] = teamData.players.main.map(player => ({
          ...player,
          id: `local-${Date.now()}-${Math.random()}`,
          verified: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }));

        const substitutePlayers: Team['players']['substitutes'] = teamData.players.substitutes.map(player => ({
          ...player,
          id: `local-${Date.now()}-${Math.random()}`,
          verified: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }));

        const staff: Team['staff'] = {};
        if (teamData.staff?.coach) {
          staff.coach = { ...teamData.staff.coach, id: `local-${Date.now()}-coach` };
        }
        if (teamData.staff?.analyst) {
          staff.analyst = { ...teamData.staff.analyst, id: `local-${Date.now()}-analyst` };
        }
        if (teamData.staff?.manager) {
          staff.manager = { ...teamData.staff.manager, id: `local-${Date.now()}-manager` };
        }

        const newTeam: Team = {
          id: `local-${Date.now()}`,
          name: teamData.name,
          tag: teamData.tag,
          logo: teamData.logo,
          colors: teamData.colors,
          players: {
            main: mainPlayers,
            substitutes: substitutePlayers
          },
          staff,
          region: teamData.region,
          tier: teamData.tier,
          founded: new Date(),
          verified: false,
          socialMedia: teamData.socialMedia,
          userId: user?.id || 'electron-admin',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const updatedTeams = [newTeam, ...teams];
        setTeams(updatedTeams);
        await electronStorage.set(CACHE_KEY, updatedTeams);
        return { success: true, team: newTeam };
      }

      // Online mode - use API
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
  }, [teams, authenticatedFetch, isLocalDataMode, user]);

  const updateTeam = useCallback(async (teamId: string, updates: Partial<CreateTeamRequest>): Promise<{ success: boolean; team?: Team; error?: string }> => {
    try {
      if (isLocalDataMode) {
        // Update team locally
        const updatedTeams = teams.map(team => {
          if (team.id === teamId) {
            let updated: Team;
            if (updates.players) {
              updated = {
                ...team,
                // do not spread updates.staff
                ...updates,
                staff: team.staff,
                players: {
                  main: updates.players.main.map((p, i) => ({
                    ...p,
                    id: team.players.main[i]?.id || `local-${Date.now()}-${Math.random()}`,
                    verified: false,
                    createdAt: new Date(),
                    updatedAt: new Date()
                  })),
                  substitutes: updates.players.substitutes.map((p, i) => ({
                    ...p,
                    id: team.players.substitutes[i]?.id || `local-${Date.now()}-${Math.random()}`,
                    verified: false,
                    createdAt: new Date(),
                    updatedAt: new Date()
                  }))
                },
                updatedAt: new Date()
              };
            } else {
              const { players: _players, staff: _staff, ...restUpdates } = updates;
              updated = { ...team, ...restUpdates, updatedAt: new Date() };
            }
            return updated;
          }
          return team;
        });
        setTeams(updatedTeams);
        await electronStorage.set(CACHE_KEY, updatedTeams);
        const updatedTeam = updatedTeams.find(t => t.id === teamId);
        return { success: true, team: updatedTeam };
      }

      // Online mode - use API
      const response = await authenticatedFetch(`/api/v1/teams/${teamId}`, {
        method: 'PUT',
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
  }, [teams, authenticatedFetch, isLocalDataMode]);

  const deleteTeam = useCallback(async (teamId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (isLocalDataMode) {
        // Delete team locally
        const updatedTeams = teams.filter(team => team.id !== teamId);
        setTeams(updatedTeams);
        await electronStorage.set(CACHE_KEY, updatedTeams);
        return { success: true };
      }

      // Online mode - use API
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
  }, [teams, authenticatedFetch, isLocalDataMode]);

  const verifyTeam = useCallback(async (teamId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (isLocalDataMode) {
        // Verify team locally
        const updatedTeams = teams.map(team => 
          team.id === teamId ? { ...team, verified: true, updatedAt: new Date() } : team
        );
        setTeams(updatedTeams);
        await electronStorage.set(CACHE_KEY, updatedTeams);
        return { success: true };
      }

      // Online mode - use API
      const response = await authenticatedFetch(`/api/v1/teams/${teamId}/verify`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        const updatedTeams = teams.map(team => 
          team.id === teamId ? data.team : team
        );
        setTeams(updatedTeams);
        await storage.set(CACHE_KEY, updatedTeams, { enableChecksum: true });
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.error || 'Failed to verify team' };
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to verify team';
      return { success: false, error };
    }
  }, [teams, authenticatedFetch, isLocalDataMode]);

  const verifyPlayer = useCallback(async (teamId: string, playerId: string, gameName: string, tagLine: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (isLocalDataMode) {
        // Verify player locally
        const updatedTeams = teams.map(team => {
          if (team.id === teamId) {
            const updatedMainPlayers = team.players.main.map(player => 
              player.id === playerId ? { ...player, verified: true, verifiedAt: new Date(), updatedAt: new Date() } : player
            );
            const updatedSubPlayers = team.players.substitutes.map(player => 
              player.id === playerId ? { ...player, verified: true, verifiedAt: new Date(), updatedAt: new Date() } : player
            );
            return {
              ...team,
              players: {
                main: updatedMainPlayers,
                substitutes: updatedSubPlayers
              },
              updatedAt: new Date()
            };
          }
          return team;
        });
        setTeams(updatedTeams);
        await electronStorage.set(CACHE_KEY, updatedTeams);
        return { success: true };
      }

      // Online mode - use API
      const response = await authenticatedFetch(`/api/v1/teams/${teamId}/players/${playerId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameName, tagLine })
      });

      if (response.ok) {
        const data = await response.json();
        const updatedTeams = teams.map(team => 
          team.id === teamId ? data.team : team
        );
        setTeams(updatedTeams);
        await storage.set(CACHE_KEY, updatedTeams, { enableChecksum: true });
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.error || 'Failed to verify player' };
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to verify player';
      return { success: false, error };
    }
  }, [teams, authenticatedFetch, isLocalDataMode]);

  const verifyAllPlayers = useCallback(async (teamId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (isLocalDataMode) {
        // Verify all players locally
        const updatedTeams = teams.map(team => {
          if (team.id === teamId) {
            const now = new Date();
            const updatedMainPlayers = team.players.main.map(player => ({ 
              ...player, 
              verified: true, 
              verifiedAt: now, 
              updatedAt: now 
            }));
            const updatedSubPlayers = team.players.substitutes.map(player => ({ 
              ...player, 
              verified: true, 
              verifiedAt: now, 
              updatedAt: now 
            }));
            return {
              ...team,
              players: {
                main: updatedMainPlayers,
                substitutes: updatedSubPlayers
              },
              updatedAt: now
            };
          }
          return team;
        });
        setTeams(updatedTeams);
        await electronStorage.set(CACHE_KEY, updatedTeams);
        return { success: true };
      }

      // Online mode - use API
      const response = await authenticatedFetch(`/api/v1/teams/${teamId}/verify-all`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        const updatedTeams = teams.map(team => 
          team.id === teamId ? data.team : team
        );
        setTeams(updatedTeams);
        await storage.set(CACHE_KEY, updatedTeams, { enableChecksum: true });
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.error || 'Failed to verify all players' };
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to verify all players';
      return { success: false, error };
    }
  }, [teams, authenticatedFetch, isLocalDataMode]);

  const clearCache = useCallback(async (): Promise<void> => {
    if (isLocalDataMode) {
      await electronStorage.remove(CACHE_KEY);
    } else {
      await storage.remove(CACHE_KEY);
    }
    setTeams([]);
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

  const value: TeamsContextType = useMemo(() => ({
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
  }), [
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
  ]);

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