'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { useAuthenticatedFetch } from '@lib/hooks/useAuthenticatedFetch';
import { useAuth } from './AuthContext';
import { useElectron } from './ElectronContext';
import { storage } from '@lib/utils/storage/storage';
import type { Team, CameraPlayer } from '@lib/types';

interface CamerasContextType {
  // Data
  teams: Team[];
  allPlayers: CameraPlayer[];
  loading: boolean;
  error: string | null;
  
  // Actions
  refreshCameras: () => Promise<void>;
  updateCameraSettings: (settings: { teams: Team[] }) => Promise<{ success: boolean; error?: string }>;
  
  // Cache management
  clearCache: () => Promise<void>;
}

const CamerasContext = createContext<CamerasContextType | undefined>(undefined);

const CACHE_KEY = 'cameras-settings';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const SYNC_CHECK_INTERVAL = 30 * 1000; // 30 seconds

// Simple electron storage helper
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

export function CamerasProvider({ children }: { children: ReactNode }) {
  const { user, authLoading } = useAuth();
  const { isElectron, useLocalData } = useElectron();
  const { authenticatedFetch } = useAuthenticatedFetch();
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [allPlayers, setAllPlayers] = useState<CameraPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if we're in local data mode
  const isLocalDataMode = isElectron && useLocalData;

  const processPlayers = useCallback((teamsData: Team[]): void => {
    // Flatten all players with team info
    const players: CameraPlayer[] = teamsData.flatMap(team => {
      const teamPlayers = team.players || [];
      if (Array.isArray(teamPlayers)) {
        // If players is directly an array
        return teamPlayers.map(player => ({
          ...player,
          teamName: team.name,
          teamLogo: team.logo?.data
        }));
      } else if (teamPlayers.main && Array.isArray(teamPlayers.main)) {
        // If players has main array structure
        return teamPlayers.main.map(player => ({
          ...player,
          teamName: team.name,
          teamLogo: team.logo?.data
        }));
      }
      return [];
    });
    setAllPlayers(players);
  }, []);

  const fetchCamerasFromAPI = useCallback(async (showLoading = true): Promise<Team[]> => {
    // Skip API calls in local data mode
    if (isLocalDataMode) {
      if (showLoading) setLoading(false);
      return teams;
    }

    if (!user) {
      if (showLoading) setLoading(false);
      return [];
    }

    if (showLoading) setLoading(true);
    setError(null);

    try {
      const response = await authenticatedFetch('/api/v1/cameras/settings');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const fetchedTeams = data.teams || [];
      
      setTeams(fetchedTeams);
      processPlayers(fetchedTeams);
      
      await storage.set(CACHE_KEY, { teams: fetchedTeams }, { enableChecksum: true });
      return fetchedTeams;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch camera settings';
      setError(errorMessage);
      console.error('Camera settings fetch error:', err);
      return [];
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [isLocalDataMode, user, teams, setTeams, authenticatedFetch, processPlayers]);

  const loadCachedData = useCallback(async (): Promise<void> => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      if (isLocalDataMode) {
        // Use electron storage for local mode
        const cachedSettings = await electronStorage.get<{ teams: Team[] }>(CACHE_KEY);
        if (cachedSettings?.teams && Array.isArray(cachedSettings.teams)) {
          setTeams(cachedSettings.teams);
          processPlayers(cachedSettings.teams);
        } else {
          setTeams([]);
          setAllPlayers([]);
        }
        setLoading(false);
      } else {
        // Use universal storage for online mode
        const cachedSettings = await storage.get<{ teams: Team[] }>(CACHE_KEY, { 
          ttl: CACHE_TTL,
          enableChecksum: true 
        });
        
        if (cachedSettings?.teams) {
          setTeams(cachedSettings.teams);
          processPlayers(cachedSettings.teams);
          setLoading(false);
          
          // Don't fetch fresh data in background to avoid infinite loops
          // Data will be refreshed on next user interaction or manual refresh
        } else {
          // No cache, fetch fresh data
          await fetchCamerasFromAPI(true);
        }
      }
    } catch (err) {
      console.error('Failed to load cached camera settings:', err);
      if (!isLocalDataMode) {
        await fetchCamerasFromAPI(true);
      } else {
        setLoading(false);
      }
    }
  }, [user, isLocalDataMode, fetchCamerasFromAPI, setTeams, processPlayers, setAllPlayers, setLoading]);

  const checkDataSync = useCallback(async (): Promise<void> => {
    // Skip sync checks in local data mode
    if (isLocalDataMode) return;
    // Do not sync if teams is empty
    if (!teams || teams.length === 0) return;

    try {
      // Quick HEAD request to check if data has changed
      const response = await authenticatedFetch('/api/v1/cameras/settings', { method: 'HEAD' });
      const lastModified = response.headers.get('Last-Modified');
      const etag = response.headers.get('ETag');

      if (lastModified || etag) {
        const cachedTimestamp = await storage.getTimestamp(CACHE_KEY);
        const serverTimestamp = lastModified ? new Date(lastModified).getTime() : 0;

        if (!cachedTimestamp || serverTimestamp > cachedTimestamp) {
          console.log('Camera settings outdated, refreshing...');
          await fetchCamerasFromAPI(false);
        }
      }
    } catch (err) {
      console.debug('Background sync check failed:', err);
    }
  }, [isLocalDataMode, teams, fetchCamerasFromAPI, authenticatedFetch]);

  // Load cached data on mount
  useEffect(() => {
    if (user) {
      // Use requestIdleCallback for better performance if available
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as unknown as Window).requestIdleCallback(() => {
          loadCachedData();
        }, { timeout: 1000 });
      } else {
        // Fallback to setTimeout for immediate execution
        setTimeout(() => {
          loadCachedData();
        }, 0);
      }
    } else {
      setLoading(false);
    }
  }, [user, loadCachedData]);

  // Background sync interval - only when actively using cameras
  useEffect(() => {
    if (!user || authLoading || isLocalDataMode) return;

    // Check if we're on a camera-related page
    const isCameraPage = window.location.pathname.includes('/modules/cameras');
    
    if (!isCameraPage) return;

    const interval = setInterval(() => {
      checkDataSync();
    }, SYNC_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [user, authLoading, checkDataSync, isLocalDataMode]);

  const updateCameraSettings = useCallback(async (settings: { teams: Team[] }): Promise<{ success: boolean; error?: string }> => {
    try {
      if (isLocalDataMode) {
        // Update settings locally
        const updatedTeams = settings.teams || [];
        setTeams(updatedTeams);
        processPlayers(updatedTeams);
        await electronStorage.set(CACHE_KEY, { teams: updatedTeams });
        return { success: true };
      }

      // nline moe - use API
      const response = await authenticatedFetch('/api/v1/cameras/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        const data = await response.json();
        const updatedTeams = data.teams || [];
        setTeams(updatedTeams);
        processPlayers(updatedTeams);
        await storage.set(CACHE_KEY, { teams: updatedTeams }, { enableChecksum: true });
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Failed to update camera settings' };
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update camera settings';
      return { success: false, error };
    }
  }, [authenticatedFetch, isLocalDataMode, processPlayers]);

  const refreshCameras = useCallback(async (): Promise<void> => {
    if (isLocalDataMode) {
      // In local mode, just reload from electron storage
      await loadCachedData();
    } else {
      await fetchCamerasFromAPI(true);
    }
  }, [isLocalDataMode, loadCachedData, fetchCamerasFromAPI]);

  const clearCache = useCallback(async (): Promise<void> => {
    if (isLocalDataMode) {
      await electronStorage.remove(CACHE_KEY);
    } else {
      await storage.remove(CACHE_KEY);
    }
    setTeams([]);
    setAllPlayers([]);
  }, [isLocalDataMode]);

  const value: CamerasContextType = useMemo(() => ({
    teams,
    allPlayers,
    loading,
    error,
    refreshCameras,
    updateCameraSettings,
    clearCache
  }), [
    teams,
    allPlayers,
    loading,
    error,
    refreshCameras,
    updateCameraSettings,
    clearCache
  ]);

  return (
    <CamerasContext.Provider value={value}>
      {children}
    </CamerasContext.Provider>
  );
}

export function useCameras(): CamerasContextType {
  const context = useContext(CamerasContext);
  if (context === undefined) {
    throw new Error('useCameras must be used within a CamerasProvider');
  }
  return context;
} 