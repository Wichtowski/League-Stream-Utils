"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuthenticatedFetch } from "@lib/hooks/useAuthenticatedFetch";
import { useAuth } from "./AuthContext";
import { storage } from "@lib/services/common/UniversalStorage";

interface AppSettings {
  theme: "light" | "dark" | "auto";
  defaultTimeouts: {
    pickPhase: number;
    banPhase: number;
  };
  notifications: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
  };
  streaming: {
    obsIntegration: boolean;
    autoRefresh: boolean;
    refreshInterval: number;
  };
  cameras: {
    defaultResolution: string;
    fps: number;
    autoStart: boolean;
  };
  lcu: {
    autoConnect: boolean;
    syncFrequency: number;
    enableChampSelectSync: boolean;
  };
}

interface UserPreferences {
  favoriteChampions: string[];
  defaultRole: string;
  teamDisplayMode: "list" | "grid" | "cards";
  sessionSortBy: "date" | "name" | "status";
  showTutorials: boolean;
  compactMode: boolean;
}

interface SystemInfo {
  version: string;
  buildNumber: string;
  electron: boolean;
  platform: string;
  nodeVersion?: string;
  electronVersion?: string;
}

interface SettingsContextType {
  // Settings data
  appSettings: AppSettings;
  userPreferences: UserPreferences;
  systemInfo: SystemInfo | null;
  loading: boolean;
  error: string | null;

  // Settings management
  updateAppSettings: (settings: Partial<AppSettings>) => Promise<{ success: boolean; error?: string }>;
  updateUserPreferences: (preferences: Partial<UserPreferences>) => Promise<{ success: boolean; error?: string }>;
  resetToDefaults: () => Promise<{ success: boolean; error?: string }>;

  // Specific setting helpers
  toggleTheme: () => Promise<void>;
  addFavoriteChampion: (championId: string) => Promise<void>;
  removeFavoriteChampion: (championId: string) => Promise<void>;
  updateNotificationSettings: (notifications: Partial<AppSettings["notifications"]>) => Promise<void>;

  // System management
  getSystemInfo: () => Promise<void>;
  exportSettings: () => Promise<{
    success: boolean;
    data?: string;
    error?: string;
  }>;
  importSettings: (settingsJson: string) => Promise<{ success: boolean; error?: string }>;

  // Cache management
  refreshSettings: () => Promise<void>;
  clearCache: () => Promise<void>;
  getLastSync: () => Promise<Date | null>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const APP_SETTINGS_CACHE_KEY = "app-settings";
const USER_PREFERENCES_CACHE_KEY = "user-preferences";
const SYSTEM_INFO_CACHE_KEY = "system-info";
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes (settings don't change frequently)

const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: "auto",
  defaultTimeouts: {
    pickPhase: 30,
    banPhase: 20
  },
  notifications: {
    enabled: true,
    sound: true,
    desktop: false
  },
  streaming: {
    obsIntegration: false,
    autoRefresh: true,
    refreshInterval: 5000
  },
  cameras: {
    defaultResolution: "1920x1080",
    fps: 30,
    autoStart: false
  },
  lcu: {
    autoConnect: true,
    syncFrequency: 1000,
    enableChampSelectSync: true
  }
};

const DEFAULT_USER_PREFERENCES: UserPreferences = {
  favoriteChampions: [],
  defaultRole: "",
  teamDisplayMode: "cards",
  sessionSortBy: "date",
  showTutorials: true,
  compactMode: false
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { authenticatedFetch } = useAuthenticatedFetch();

  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getSystemInfo = useCallback(async (): Promise<void> => {
    try {
      const sysInfo: SystemInfo = {
        version: "1.0.0",
        buildNumber: process.env.NEXT_PUBLIC_BUILD_NUMBER || "0",
        electron: typeof window !== "undefined" && !!window.electronAPI?.isElectron,
        platform: typeof window !== "undefined" ? window.electronAPI?.platform || navigator.platform : "unknown"
      };

      // Get additional info if in Electron and method exists
      if (sysInfo.electron && window.electronAPI?.getVersions) {
        try {
          const versions = await window.electronAPI.getVersions();
          sysInfo.nodeVersion = versions.node;
          sysInfo.electronVersion = versions.electron;
        } catch (err) {
          console.debug("getVersions not available:", err);
        }
      }

      setSystemInfo(sysInfo);
      await storage.set(SYSTEM_INFO_CACHE_KEY, sysInfo);
    } catch (err) {
      console.error("Failed to get system info:", err);
    }
  }, []);

  const fetchSettingsFromAPI = useCallback(
    async (showLoading = true): Promise<void> => {
      if (showLoading) setLoading(true);
      setError(null);

      try {
        // In cloud mode, fetch from API
        const [appResponse, userResponse] = await Promise.all([
          authenticatedFetch("/api/v1/settings/app"),
          authenticatedFetch("/api/v1/settings/user")
        ]);

        if (appResponse.ok) {
          const appData = await appResponse.json();
          const fetchedAppSettings = {
            ...DEFAULT_APP_SETTINGS,
            ...appData.settings
          };
          setAppSettings(fetchedAppSettings);
          await storage.set(APP_SETTINGS_CACHE_KEY, fetchedAppSettings);
        }

        if (userResponse.ok) {
          const userData = await userResponse.json();
          const fetchedUserPreferences = {
            ...DEFAULT_USER_PREFERENCES,
            ...userData.preferences
          };
          setUserPreferences(fetchedUserPreferences);
          await storage.set(USER_PREFERENCES_CACHE_KEY, fetchedUserPreferences);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch settings";
        setError(errorMessage);
        console.error("Settings fetch error:", err);
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [authenticatedFetch]
  );

  const loadCachedData = useCallback(async (): Promise<void> => {
    try {
      const [cachedAppSettings, cachedUserPreferences, cachedSystemInfo] = await Promise.all([
        storage.get<AppSettings>(APP_SETTINGS_CACHE_KEY, { ttl: CACHE_TTL }),
        storage.get<UserPreferences>(USER_PREFERENCES_CACHE_KEY, {
          ttl: CACHE_TTL
        }),
        storage.get<SystemInfo>(SYSTEM_INFO_CACHE_KEY, { ttl: CACHE_TTL })
      ]);

      if (cachedAppSettings) {
        setAppSettings({ ...DEFAULT_APP_SETTINGS, ...cachedAppSettings });
      }

      if (cachedUserPreferences) {
        setUserPreferences({
          ...DEFAULT_USER_PREFERENCES,
          ...cachedUserPreferences
        });
      }

      if (cachedSystemInfo) {
        setSystemInfo(cachedSystemInfo);
      }

      setLoading(false);

      // Fetch fresh data in background
      if (user) {
        fetchSettingsFromAPI(false);
      }
      getSystemInfo();
    } catch (err) {
      console.error("Failed to load cached settings:", err);
      if (user) {
        await fetchSettingsFromAPI(true);
      } else {
        setLoading(false);
      }
    }
  }, [user, fetchSettingsFromAPI, getSystemInfo, setAppSettings, setUserPreferences, setSystemInfo, setLoading]);

  useEffect(() => {
    loadCachedData();
  }, [user, loadCachedData]);

  const updateAppSettings = useCallback(
    async (settings: Partial<AppSettings>): Promise<{ success: boolean; error?: string }> => {
      const updatedSettings = { ...appSettings, ...settings };

      try {
        // Update locally first for immediate feedback
        setAppSettings(updatedSettings);
        await storage.set(APP_SETTINGS_CACHE_KEY, updatedSettings);

        // If user is authenticated, sync to cloud
        if (user) {
          const response = await authenticatedFetch("/api/v1/settings/app", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ settings })
          });

          if (!response.ok) {
            // Revert on failure
            setAppSettings(appSettings);
            await storage.set(APP_SETTINGS_CACHE_KEY, appSettings);
            const data = await response.json();
            return {
              success: false,
              error: data.error || "Failed to update app settings"
            };
          }
        }

        return { success: true };
      } catch (err) {
        // Revert on error
        setAppSettings(appSettings);
        await storage.set(APP_SETTINGS_CACHE_KEY, appSettings);
        const error = err instanceof Error ? err.message : "Failed to update app settings";
        return { success: false, error };
      }
    },
    [appSettings, user, authenticatedFetch]
  );

  const updateUserPreferences = useCallback(
    async (preferences: Partial<UserPreferences>): Promise<{ success: boolean; error?: string }> => {
      const updatedPreferences = { ...userPreferences, ...preferences };

      try {
        // Update locally first
        setUserPreferences(updatedPreferences);
        await storage.set(USER_PREFERENCES_CACHE_KEY, updatedPreferences);

        // Sync to cloud if authenticated
        if (user) {
          const response = await authenticatedFetch("/api/v1/settings/user", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ preferences })
          });

          if (!response.ok) {
            // Revert on failure
            setUserPreferences(userPreferences);
            await storage.set(USER_PREFERENCES_CACHE_KEY, userPreferences);
            const data = await response.json();
            return {
              success: false,
              error: data.error || "Failed to update user preferences"
            };
          }
        }

        return { success: true };
      } catch (err) {
        // Revert on error
        setUserPreferences(userPreferences);
        await storage.set(USER_PREFERENCES_CACHE_KEY, userPreferences);
        const error = err instanceof Error ? err.message : "Failed to update user preferences";
        return { success: false, error };
      }
    },
    [userPreferences, user, authenticatedFetch]
  );

  const resetToDefaults = useCallback(async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      setAppSettings(DEFAULT_APP_SETTINGS);
      setUserPreferences(DEFAULT_USER_PREFERENCES);

      await Promise.all([
        storage.set(APP_SETTINGS_CACHE_KEY, DEFAULT_APP_SETTINGS),
        storage.set(USER_PREFERENCES_CACHE_KEY, DEFAULT_USER_PREFERENCES)
      ]);

      // Sync to cloud if authenticated
      if (user) {
        await Promise.all([
          authenticatedFetch("/api/v1/settings/app", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ settings: DEFAULT_APP_SETTINGS })
          }),
          authenticatedFetch("/api/v1/settings/user", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ preferences: DEFAULT_USER_PREFERENCES })
          })
        ]);
      }

      return { success: true };
    } catch (err) {
      const error = err instanceof Error ? err.message : "Failed to reset settings";
      return { success: false, error };
    }
  }, [user, authenticatedFetch]);

  const toggleTheme = useCallback(async (): Promise<void> => {
    const themeOrder: AppSettings["theme"][] = ["light", "dark", "auto"];
    const currentIndex = themeOrder.indexOf(appSettings.theme);
    const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length];

    await updateAppSettings({ theme: nextTheme });
  }, [appSettings.theme, updateAppSettings]);

  const addFavoriteChampion = useCallback(
    async (championId: string): Promise<void> => {
      if (!userPreferences.favoriteChampions.includes(championId)) {
        const updatedFavorites = [...userPreferences.favoriteChampions, championId];
        await updateUserPreferences({ favoriteChampions: updatedFavorites });
      }
    },
    [userPreferences.favoriteChampions, updateUserPreferences]
  );

  const removeFavoriteChampion = useCallback(
    async (championId: string): Promise<void> => {
      const updatedFavorites = userPreferences.favoriteChampions.filter((id) => id !== championId);
      await updateUserPreferences({ favoriteChampions: updatedFavorites });
    },
    [userPreferences.favoriteChampions, updateUserPreferences]
  );

  const updateNotificationSettings = useCallback(
    async (notifications: Partial<AppSettings["notifications"]>): Promise<void> => {
      await updateAppSettings({
        notifications: { ...appSettings.notifications, ...notifications }
      });
    },
    [appSettings.notifications, updateAppSettings]
  );

  const exportSettings = useCallback(async (): Promise<{
    success: boolean;
    data?: string;
    error?: string;
  }> => {
    try {
      const exportData = {
        appSettings,
        userPreferences,
        exportedAt: new Date().toISOString(),
        version: systemInfo?.version || "1.0.0"
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      return { success: true, data: jsonString };
    } catch (err) {
      const error = err instanceof Error ? err.message : "Failed to export settings";
      return { success: false, error };
    }
  }, [appSettings, userPreferences, systemInfo]);

  const importSettings = useCallback(
    async (settingsJson: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const importData = JSON.parse(settingsJson);

        if (importData.appSettings) {
          await updateAppSettings(importData.appSettings);
        }

        if (importData.userPreferences) {
          await updateUserPreferences(importData.userPreferences);
        }

        return { success: true };
      } catch (err) {
        const error = err instanceof Error ? err.message : "Failed to import settings";
        return { success: false, error };
      }
    },
    [updateAppSettings, updateUserPreferences]
  );

  const refreshSettings = useCallback(async (): Promise<void> => {
    if (user) {
      await fetchSettingsFromAPI(true);
    }
    await getSystemInfo();
  }, [user, fetchSettingsFromAPI, getSystemInfo]);

  const clearCache = useCallback(async (): Promise<void> => {
    await Promise.all([
      storage.remove(APP_SETTINGS_CACHE_KEY),
      storage.remove(USER_PREFERENCES_CACHE_KEY),
      storage.remove(SYSTEM_INFO_CACHE_KEY)
    ]);

    setAppSettings(DEFAULT_APP_SETTINGS);
    setUserPreferences(DEFAULT_USER_PREFERENCES);
    setSystemInfo(null);
  }, []);

  const getLastSync = useCallback(async (): Promise<Date | null> => {
    const timestamp = await storage.getTimestamp(APP_SETTINGS_CACHE_KEY);
    return timestamp ? new Date(timestamp) : null;
  }, []);

  const value: SettingsContextType = {
    appSettings,
    userPreferences,
    systemInfo,
    loading,
    error,
    updateAppSettings,
    updateUserPreferences,
    resetToDefaults,
    toggleTheme,
    addFavoriteChampion,
    removeFavoriteChampion,
    updateNotificationSettings,
    getSystemInfo,
    exportSettings,
    importSettings,
    refreshSettings,
    clearCache,
    getLastSync
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
