"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CloudIcon,
  ShieldCheckIcon,
  ComputerDesktopIcon,
  CheckCircleIcon,
  VideoCameraIcon,
  ServerIcon,
  UserIcon
} from "@heroicons/react/24/outline";
import { useModal } from "@lib/contexts/ModalContext";
import { riotAPI } from "@lib/services/external/RIOT/api";
import { refreshChampionsCache, getChampions } from "@lib/champions";
import { tournamentTemplates, type TournamentTemplate } from "@lib/services/tournament";
import { ElectronDataModeSelector } from "./dataModeSelector";
import { OBSControl } from "./obsControl";
import { LocalDatabaseManager } from "./LocalDatabaseManager";
import { Button } from "@lib/components/common";
import { useElectron } from "@libElectron/contexts/ElectronContext";
import { LogoutButton } from "@lib/components/settings/LogoutButton";
import { useAuth } from "@lib/contexts/AuthContext";

interface RiotAPISettings {
  apiKey: string;
  defaultRegion: string;
  cacheEnabled: boolean;
  rateLimitEnabled: boolean;
}

interface CacheStats {
  champions: { count: number; lastUpdated: string };
  players: { count: number; memoryUsage: string };
  matches: { count: number; memoryUsage: string };
  assets: { totalSize: string; fileCount: number; formattedSize: string };
}

interface IntegrityCheckResult {
  isValid: boolean;
  missingFiles: string[];
  corruptedFiles: string[];
  totalFiles: number;
  validFiles: number;
  message: string;
}

export const ElectronSettings = () => {
  const { showAlert } = useModal();
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("account");
  const [isElectron, setIsElectron] = useState(false);
  const [loading, setLoading] = useState(false);

  // Riot API settings
  const [riotSettings, setRiotSettings] = useState<RiotAPISettings>({
    apiKey: "",
    defaultRegion: "euw1",
    cacheEnabled: true,
    rateLimitEnabled: true
  });

  // State management
  const [cacheStats, setCacheStats] = useState<CacheStats>({
    champions: { count: 0, lastUpdated: "Never" },
    players: { count: 0, memoryUsage: "0 MB" },
    matches: { count: 0, memoryUsage: "0 MB" },
    assets: { totalSize: "0 MB", fileCount: 0, formattedSize: "0 MB" }
  });

  const [_templates, setTemplates] = useState<TournamentTemplate[]>([]);
  const [championsVersion, setChampionsVersion] = useState("");
  const [integrityCheckResult, setIntegrityCheckResult] = useState<IntegrityCheckResult | null>(null);
  const [isCheckingIntegrity, setIsCheckingIntegrity] = useState(false);
  const { useLocalData: _useLocalData } = useElectron();

  const loadCacheStats = useCallback(async () => {
    try {
      const stats = riotAPI.getCacheStats();
      const version = await riotAPI.getLatestGameVersion();

      // Load asset cache stats if in Electron
      let assetStats = {
        totalSize: "0 MB",
        fileCount: 0,
        formattedSize: "0 MB"
      };
      if (isElectron && window.electronAPI?.getAssetCacheStats) {
        const assetResult = await window.electronAPI.getAssetCacheStats();
        if (assetResult.success && assetResult.stats) {
          assetStats = {
            totalSize: assetResult.stats.formattedSize,
            fileCount: assetResult.stats.fileCount,
            formattedSize: assetResult.stats.formattedSize
          };
        }
      }

      setCacheStats({
        champions: {
          count: stats.keys,
          lastUpdated: new Date().toLocaleString()
        },
        players: {
          count: stats.hits,
          memoryUsage: `${Math.round(stats.keys * 0.1)} MB`
        },
        matches: {
          count: stats.misses,
          memoryUsage: `${Math.round(stats.keys * 0.05)} MB`
        },
        assets: assetStats
      });
      setChampionsVersion(version);
    } catch (error) {
      console.error("Failed to load cache stats:", error);
    }
  }, [isElectron]);

  const loadTemplates = useCallback(async () => {
    try {
      const templateList = await tournamentTemplates.getAllTemplates();
      setTemplates(templateList);
    } catch (error) {
      console.error("Failed to load templates:", error);
    }
  }, []);

  const handleUpdateChampions = useCallback(async () => {
    setLoading(true);
    try {
      await refreshChampionsCache();
      await loadCacheStats();
    } catch (error) {
      console.error("Failed to update champions:", error);
      await showAlert({
        type: "error",
        message: "Failed to update champions database. Please check your API key and internet connection."
      });
    } finally {
      setLoading(false);
    }
  }, [loadCacheStats, showAlert]);

  useEffect(() => {
    setIsElectron(typeof window !== "undefined" && !!window.electronAPI?.isElectron);

    // Set up Electron event listeners
    if (window.electronAPI) {
      window.electronAPI.onUpdateChampions(() => {
        handleUpdateChampions();
      });

      window.electronAPI.onChampionsCacheCleared(() => {
        setCacheStats((prev) => ({
          ...prev,
          champions: { count: 0, lastUpdated: "Never" }
        }));
      });
    }

    // Load initial data
    loadCacheStats();
    loadTemplates();

    return () => {
      // Cleanup
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners("update-champions");
        window.electronAPI.removeAllListeners("champions-cache-cleared");
      }
    };
  }, [loadCacheStats, handleUpdateChampions, loadTemplates]);

  const handleClearCache = async () => {
    riotAPI.clearCache();
    setCacheStats({
      champions: { count: 0, lastUpdated: "Never" },
      players: { count: 0, memoryUsage: "0 MB" },
      matches: { count: 0, memoryUsage: "0 MB" },
      assets: { totalSize: "0 MB", fileCount: 0, formattedSize: "0 MB" }
    });
    await showAlert({
      type: "success",
      message: "Cache cleared successfully!"
    });
  };

  const handleClearAssetCache = async () => {
    if (!isElectron || !window.electronAPI?.clearAssetCache) {
      await showAlert({
        type: "error",
        message: "Asset cache clearing not available in web mode."
      });
      return;
    }

    try {
      setLoading(true);
      const result = await window.electronAPI.clearAssetCache();
      if (result.success) {
        setCacheStats((prev) => ({
          ...prev,
          assets: { totalSize: "0 MB", fileCount: 0, formattedSize: "0 MB" }
        }));
        await showAlert({
          type: "success",
          message: "Asset cache cleared successfully!"
        });
      } else {
        await showAlert({
          type: "error",
          message: "Failed to clear asset cache."
        });
      }
    } catch (error) {
      console.error("Failed to clear asset cache:", error);
      await showAlert({
        type: "error",
        message: "Failed to clear asset cache."
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreloadChampionAssets = async () => {
    if (!isElectron) {
      await showAlert({
        type: "error",
        message: "Asset preloading not available in web mode."
      });
      return;
    }

    try {
      setLoading(true);
      const champions = await getChampions();
      const championKeys = champions.map((champ): string => champ.key);

      // Import the asset cache service
      const { assetCache } = await import("@lib/services/assets/assetCache");
      await assetCache.preloadChampionAssets(championKeys, championsVersion);

      await loadCacheStats();
      await showAlert({
        type: "success",
        message: "Champion assets preloaded successfully!"
      });
    } catch (error) {
      console.error("Failed to preload champion assets:", error);
      await showAlert({
        type: "error",
        message: "Failed to preload champion assets."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckDataIntegrity = async () => {
    if (!isElectron || !window.electronAPI?.checkAssetIntegrity) {
      await showAlert({
        type: "error",
        message: "Data integrity check not available in web mode."
      });
      return;
    }

    try {
      setIsCheckingIntegrity(true);
      setIntegrityCheckResult(null);

      const result = await window.electronAPI.checkAssetIntegrity();

      if (result.success && result.integrity) {
        const integrityResult: IntegrityCheckResult = {
          isValid: result.integrity.isValid,
          missingFiles: result.integrity.missingFiles || [],
          corruptedFiles: result.integrity.corruptedFiles || [],
          totalFiles: result.integrity.totalFiles || 0,
          validFiles: result.integrity.validFiles || 0,
          message: result.integrity.message || "Integrity check completed"
        };

        setIntegrityCheckResult(integrityResult);

        if (integrityResult.isValid) {
          await showAlert({
            type: "success",
            message: `Data integrity check passed! All ${integrityResult.totalFiles} files are valid.`
          });
        } else {
          // If there are missing or corrupted files, redirect to download page
          const missingCount = integrityResult.missingFiles.length;
          const corruptedCount = integrityResult.corruptedFiles.length;

          await showAlert({
            type: "warning",
            message: `Found ${missingCount} missing and ${corruptedCount} corrupted files. Redirecting to download page to fix these issues.`
          });

          // Redirect to download page after a short delay
          setTimeout(() => {
            window.location.href = "/download";
          }, 2000);
        }
      } else {
        await showAlert({
          type: "error",
          message: "Failed to check data integrity."
        });
      }
    } catch (error) {
      console.error("Failed to check data integrity:", error);
      await showAlert({
        type: "error",
        message: "Failed to check data integrity."
      });
    } finally {
      setIsCheckingIntegrity(false);
    }
  };

  const tabs = [
    { id: "account", name: "Account", icon: UserIcon },
    { id: "data-mode", name: "Data Storage", icon: ComputerDesktopIcon },
    { id: "database", name: "Database Manager", icon: ServerIcon },
    { id: "riot-api", name: "Riot API", icon: ShieldCheckIcon },
    { id: "cache", name: "Cache Management", icon: CloudIcon },
    { id: "integrity", name: "Data Integrity", icon: CheckCircleIcon },
    { id: "obs-control", name: "OBS Control", icon: VideoCameraIcon }
  ];

  const renderCacheTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Champions Cache</h3>
          <div className="space-y-2">
            <p>Count: {cacheStats.champions.count}</p>
            <p>Last Updated: {cacheStats.champions.lastUpdated}</p>
          </div>
          <div className="mt-4 space-y-2">
            <Button onClick={handleUpdateChampions} disabled={loading} className="w-full">
              Update Champions Database
            </Button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Asset Cache</h3>
          <div className="space-y-2">
            <p>Files: {cacheStats.assets.fileCount}</p>
            <p>Size: {cacheStats.assets.formattedSize}</p>
          </div>
          <div className="mt-4 space-y-2">
            <Button onClick={handleCheckDataIntegrity} disabled={isCheckingIntegrity || !isElectron} className="w-full">
              {isCheckingIntegrity ? "Checking..." : "Check Data Integrity"}
            </Button>
            <Button onClick={handleClearAssetCache} disabled={loading} variant="secondary" className="w-full">
              Clear Asset Cache
            </Button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">API Cache</h3>
          <div className="space-y-2">
            <p>Players: {cacheStats.players.count}</p>
            <p>Matches: {cacheStats.matches.count}</p>
          </div>
          <div className="mt-4">
            <Button onClick={handleClearCache} disabled={loading} variant="secondary" className="w-full">
              Clear All Cache
            </Button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Cache Info</h3>
          <div className="space-y-2">
            <p>Champions Version: {championsVersion}</p>
            <p>Total Memory: {cacheStats.players.memoryUsage}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Account Settings */}
      {activeTab === "account" && (
        <div className="space-y-6">
          <div className="bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-100">User Information</h3>
            
            {/* Loading state */}
            {authLoading && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="animate-spin h-8 w-8 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    role="img"
                    aria-label="Loading user information"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-300 mb-2">Loading Account Information</h4>
                <p className="text-gray-400">Please wait while we load your account details...</p>
              </div>
            )}

            {/* Authenticated user state */}
            {!authLoading && user && (
              <div className="space-y-8">
                {/* User Information */}
                <div className="border-b border-gray-700">
                  <dl className="space-y-2">
                    <div className="flex justify-between items-center">
                      <dt className="text-sm font-medium text-gray-300">Username</dt>
                      <dd className="text-sm text-gray-100 font-mono bg-gray-900 px-3 py-1 rounded border border-gray-600">
                        {user.username}
                      </dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-sm font-medium text-gray-300">Email</dt>
                      <dd className="text-sm text-gray-100 font-mono bg-gray-900 px-3 py-1 rounded border border-gray-600">
                        {user.email}
                      </dd>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <dt className="text-sm font-medium text-gray-300">Role</dt>
                      <dd className="text-sm text-gray-100">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.isAdmin 
                            ? 'bg-blue-900 text-blue-200 border border-blue-700' 
                            : 'bg-gray-900 text-gray-200 border border-gray-600'
                        }`}>
                          {user.isAdmin ? "Administrator" : "User"}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Account Actions */}
                <div>
                  <h4 className="text-md font-medium text-gray-200 mb-4">Account Actions</h4>
                  <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-red-900 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-medium text-gray-200 mb-1">Sign Out</h5>
                        <p className="text-sm text-gray-400 mb-3">
                          End your current session and return to the login page. You&apos;ll need to sign in again to access your account.
                        </p>
                        <LogoutButton 
                          showConfirmation={true} 
                          variant="destructive"
                          size="md"
                          className="inline-flex"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Unauthenticated state */}
            {!authLoading && !user && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-300 mb-2">Not Signed In</h4>
                <p className="text-gray-400 mb-6">You are not currently logged in to your account.</p>
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-3">
                    To access account settings and logout functionality, please sign in to your account.
                  </p>
                  <Link
                    href="/login"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Data Storage Mode */}
      {activeTab === "data-mode" && (
        <div className="space-y-6">
          <ElectronDataModeSelector />
        </div>
      )}

      {/* Riot API Settings */}
      {activeTab === "riot-api" && (
        <div className="space-y-6">
          <div className="bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-100 mb-4">Riot API Configuration</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">API Key</label>
                <input
                  type="password"
                  value={riotSettings.apiKey}
                  onChange={(e) =>
                    setRiotSettings((prev) => ({
                      ...prev,
                      apiKey: e.target.value
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get your API key from{" "}
                  <Link
                    href="https://developer.riotgames.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Riot Developer Portal
                  </Link>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Default Region</label>
                <select
                  value={riotSettings.defaultRegion}
                  onChange={(e) =>
                    setRiotSettings((prev) => ({
                      ...prev,
                      defaultRegion: e.target.value
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="euw1">Europe West</option>
                  <option value="na1">North America</option>
                  <option value="eun1">Europe Nordic & East</option>
                  <option value="kr">Korea</option>
                  <option value="jp1">Japan</option>
                </select>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={riotSettings.cacheEnabled}
                  onChange={(e) =>
                    setRiotSettings((prev) => ({
                      ...prev,
                      cacheEnabled: e.target.checked
                    }))
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-100">
                  Enable caching (recommended for better performance)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={riotSettings.rateLimitEnabled}
                  onChange={(e) =>
                    setRiotSettings((prev) => ({
                      ...prev,
                      rateLimitEnabled: e.target.checked
                    }))
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-100">Enable automatic rate limiting</label>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleUpdateChampions}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update Champions Database"}
              </button>

              <button
                onClick={handleClearCache}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Clear Cache
              </button>
            </div>

            {championsVersion && (
              <div className="mt-4 p-3 bg-green-50 rounded-md">
                <p className="text-sm text-green-800">
                  <strong>Current Game Version:</strong> {championsVersion}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cache Management */}
      {activeTab === "cache" && renderCacheTab()}

      {/* Data Integrity */}
      {activeTab === "integrity" && (
        <div className="space-y-6">
          <div className="bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-100 mb-4">Data Integrity Check</h3>
            <p className="text-sm text-gray-300 mb-6">
              Verify the integrity of your cached assets and detect any missing or corrupted files.
            </p>

            <div className="mb-6">
              <Button
                onClick={handleCheckDataIntegrity}
                disabled={isCheckingIntegrity || !isElectron}
                className="w-full md:w-auto"
              >
                {isCheckingIntegrity ? "Checking Integrity..." : "Check Data Integrity"}
              </Button>
            </div>

            {integrityCheckResult && (
              <div
                className={`p-4 rounded-lg border ${
                  integrityCheckResult.isValid ? "bg-green-900 border-green-600" : "bg-yellow-900 border-yellow-600"
                }`}
              >
                <div className="flex items-start">
                  <CheckCircleIcon
                    className={`w-5 h-5 mt-0.5 mr-3 ${
                      integrityCheckResult.isValid ? "text-green-600" : "text-yellow-600"
                    }`}
                  />
                  <div className="flex-1">
                    <h4
                      className={`font-medium ${integrityCheckResult.isValid ? "text-green-200" : "text-yellow-200"}`}
                    >
                      {integrityCheckResult.isValid ? "Integrity Check Passed" : "Integrity Issues Found"}
                    </h4>
                    <p
                      className={`text-sm mt-1 ${
                        integrityCheckResult.isValid ? "text-green-300" : "text-yellow-300"
                      }`}
                    >
                      {integrityCheckResult.message}
                    </p>

                    <div className="mt-3 space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Total Files:</span> {integrityCheckResult.totalFiles}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Valid Files:</span> {integrityCheckResult.validFiles}
                      </div>
                      {integrityCheckResult.missingFiles.length > 0 && (
                        <div className="text-sm">
                          <span className="font-medium text-red-400">Missing Files:</span>{" "}
                          {integrityCheckResult.missingFiles.length}
                        </div>
                      )}
                      {integrityCheckResult.corruptedFiles.length > 0 && (
                        <div className="text-sm">
                          <span className="font-medium text-red-400">Corrupted Files:</span>{" "}
                          {integrityCheckResult.corruptedFiles.length}
                        </div>
                      )}
                    </div>

                    {(integrityCheckResult.missingFiles.length > 0 ||
                      integrityCheckResult.corruptedFiles.length > 0) && (
                      <div className="mt-4">
                        <Button
                          onClick={handlePreloadChampionAssets}
                          disabled={loading}
                          variant="secondary"
                          className="w-full md:w-auto"
                        >
                          Re-download Corrupted Assets
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!isElectron && (
              <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-300">
                  Data integrity check is only available in the desktop application.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Database Manager */}
      {activeTab === "database" && (
        <div className="space-y-6">
          <LocalDatabaseManager />
        </div>
      )}

      {/* OBS Control */}
      {activeTab === "obs-control" && <OBSControl />}
    </div>
  );
};
