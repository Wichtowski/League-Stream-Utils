"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Cog6ToothIcon,
  CloudIcon,
  DocumentDuplicateIcon,
  ShieldCheckIcon,
  ComputerDesktopIcon,
  CheckCircleIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";
import { useModal } from "@lib/contexts/ModalContext";
import { riotAPI } from "@lib/services/riot/riot-api";
import { refreshChampionsCache, getChampions } from "@lib/champions";
import {
  tournamentTemplates,
  type TournamentTemplate,
} from "@lib/services/brackets/tournament-templates";
import { ElectronDataModeSelector } from "./dataModeSelector";
import { OBSControl } from "./obs-control";
import { Button } from "@/lib/components/common/buttons/Button";
import Link from "next/link";

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
  const [activeTab, setActiveTab] = useState("data-mode");
  const [isElectron, setIsElectron] = useState(false);
  const [loading, setLoading] = useState(false);

  // Riot API settings
  const [riotSettings, setRiotSettings] = useState<RiotAPISettings>({
    apiKey: "",
    defaultRegion: "euw1",
    cacheEnabled: true,
    rateLimitEnabled: true,
  });

  // State management
  const [cacheStats, setCacheStats] = useState<CacheStats>({
    champions: { count: 0, lastUpdated: "Never" },
    players: { count: 0, memoryUsage: "0 MB" },
    matches: { count: 0, memoryUsage: "0 MB" },
    assets: { totalSize: "0 MB", fileCount: 0, formattedSize: "0 MB" },
  });

  const [templates, setTemplates] = useState<TournamentTemplate[]>([]);
  const [championsVersion, setChampionsVersion] = useState("");
  const [integrityCheckResult, setIntegrityCheckResult] =
    useState<IntegrityCheckResult | null>(null);
  const [isCheckingIntegrity, setIsCheckingIntegrity] = useState(false);

  const loadCacheStats = useCallback(async () => {
    try {
      const stats = riotAPI.getCacheStats();
      const version = await riotAPI.getLatestGameVersion();

      // Load asset cache stats if in Electron
      let assetStats = {
        totalSize: "0 MB",
        fileCount: 0,
        formattedSize: "0 MB",
      };
      if (isElectron && window.electronAPI?.getAssetCacheStats) {
        const assetResult = await window.electronAPI.getAssetCacheStats();
        if (assetResult.success && assetResult.stats) {
          assetStats = {
            totalSize: assetResult.stats.formattedSize,
            fileCount: assetResult.stats.fileCount,
            formattedSize: assetResult.stats.formattedSize,
          };
        }
      }

      setCacheStats({
        champions: {
          count: stats.keys,
          lastUpdated: new Date().toLocaleString(),
        },
        players: {
          count: stats.hits,
          memoryUsage: `${Math.round(stats.keys * 0.1)} MB`,
        },
        matches: {
          count: stats.misses,
          memoryUsage: `${Math.round(stats.keys * 0.05)} MB`,
        },
        assets: assetStats,
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
        message:
          "Failed to update champions database. Please check your API key and internet connection.",
      });
    } finally {
      setLoading(false);
    }
  }, [loadCacheStats, showAlert]);

  useEffect(() => {
    setIsElectron(
      typeof window !== "undefined" && !!window.electronAPI?.isElectron,
    );

    // Set up Electron event listeners
    if (window.electronAPI) {
      window.electronAPI.onUpdateChampions(() => {
        handleUpdateChampions();
      });

      window.electronAPI.onChampionsCacheCleared(() => {
        setCacheStats((prev) => ({
          ...prev,
          champions: { count: 0, lastUpdated: "Never" },
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
      assets: { totalSize: "0 MB", fileCount: 0, formattedSize: "0 MB" },
    });
    await showAlert({
      type: "success",
      message: "Cache cleared successfully!",
    });
  };

  const handleClearAssetCache = async () => {
    if (!isElectron || !window.electronAPI?.clearAssetCache) {
      await showAlert({
        type: "error",
        message: "Asset cache clearing not available in web mode.",
      });
      return;
    }

    try {
      setLoading(true);
      const result = await window.electronAPI.clearAssetCache();
      if (result.success) {
        setCacheStats((prev) => ({
          ...prev,
          assets: { totalSize: "0 MB", fileCount: 0, formattedSize: "0 MB" },
        }));
        await showAlert({
          type: "success",
          message: "Asset cache cleared successfully!",
        });
      } else {
        await showAlert({
          type: "error",
          message: "Failed to clear asset cache.",
        });
      }
    } catch (error) {
      console.error("Failed to clear asset cache:", error);
      await showAlert({
        type: "error",
        message: "Failed to clear asset cache.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreloadChampionAssets = async () => {
    if (!isElectron) {
      await showAlert({
        type: "error",
        message: "Asset preloading not available in web mode.",
      });
      return;
    }

    try {
      setLoading(true);
      const champions = await getChampions();
      const championKeys = champions.map((champ): string => champ.key);

      // Import the asset cache service
      const { assetCache } = await import("@lib/services/cache/asset");
      await assetCache.preloadChampionAssets(championKeys, championsVersion);

      await loadCacheStats();
      await showAlert({
        type: "success",
        message: "Champion assets preloaded successfully!",
      });
    } catch (error) {
      console.error("Failed to preload champion assets:", error);
      await showAlert({
        type: "error",
        message: "Failed to preload champion assets.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportTemplate = async (templateId: string): Promise<void> => {
    try {
      const blob = await tournamentTemplates.exportTemplate(templateId);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `tournament-template-${templateId}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Failed to export template:", error);
      await showAlert({ type: "error", message: "Failed to export template." });
    }
  };

  const handleCheckDataIntegrity = async () => {
    if (!isElectron || !window.electronAPI?.checkAssetIntegrity) {
      await showAlert({
        type: "error",
        message: "Data integrity check not available in web mode.",
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
          message: result.integrity.message || "Integrity check completed",
        };

        setIntegrityCheckResult(integrityResult);

        if (integrityResult.isValid) {
          await showAlert({
            type: "success",
            message: `Data integrity check passed! All ${integrityResult.totalFiles} files are valid.`,
          });
        } else {
          // If there are missing or corrupted files, redirect to download page
          const missingCount = integrityResult.missingFiles.length;
          const corruptedCount = integrityResult.corruptedFiles.length;

          await showAlert({
            type: "warning",
            message: `Found ${missingCount} missing and ${corruptedCount} corrupted files. Redirecting to download page to fix these issues.`,
          });

          // Redirect to download page after a short delay
          setTimeout(() => {
            window.location.href = "/download/assets";
          }, 2000);
        }
      } else {
        await showAlert({
          type: "error",
          message: "Failed to check data integrity.",
        });
      }
    } catch (error) {
      console.error("Failed to check data integrity:", error);
      await showAlert({
        type: "error",
        message: "Failed to check data integrity.",
      });
    } finally {
      setIsCheckingIntegrity(false);
    }
  };

  const tabs = [
    { id: "data-mode", name: "Data Storage", icon: ComputerDesktopIcon },
    { id: "riot-api", name: "Riot API", icon: ShieldCheckIcon },
    {
      id: "templates",
      name: "Tournament Templates",
      icon: DocumentDuplicateIcon,
    },
    { id: "cache", name: "Cache Management", icon: CloudIcon },
    { id: "integrity", name: "Data Integrity", icon: CheckCircleIcon },
    { id: "obs-control", name: "OBS Control", icon: VideoCameraIcon },
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
            <Button
              onClick={handleUpdateChampions}
              disabled={loading}
              className="w-full"
            >
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
            <Button
              onClick={handleCheckDataIntegrity}
              disabled={isCheckingIntegrity || !isElectron}
              className="w-full"
            >
              {isCheckingIntegrity ? "Checking..." : "Check Data Integrity"}
            </Button>
            <Button
              onClick={handleClearAssetCache}
              disabled={loading}
              variant="secondary"
              className="w-full"
            >
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
            <Button
              onClick={handleClearCache}
              disabled={loading}
              variant="secondary"
              className="w-full"
            >
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
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Cog6ToothIcon className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Tournament Management Settings</h1>
          {isElectron && (
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
              Desktop App
            </span>
          )}
        </div>
        <p className="text-gray-600">
          Configure Riot API integration, tournament templates for professional
          esports production.
        </p>
      </div>

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
            <h3 className="text-lg font-medium text-gray-100 mb-4">
              Riot API Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={riotSettings.apiKey}
                  onChange={(e) =>
                    setRiotSettings((prev) => ({
                      ...prev,
                      apiKey: e.target.value,
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
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Default Region
                </label>
                <select
                  value={riotSettings.defaultRegion}
                  onChange={(e) =>
                    setRiotSettings((prev) => ({
                      ...prev,
                      defaultRegion: e.target.value,
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
                      cacheEnabled: e.target.checked,
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
                      rateLimitEnabled: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-100">
                  Enable automatic rate limiting
                </label>
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

      {/* Tournament Templates */}
      {activeTab === "templates" && (
        <div className="space-y-6">
          <div className="bg-gray-800 shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-100">
                Tournament Templates
              </h3>
              <button
                onClick={loadTemplates}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Refresh
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="border border-gray-600 rounded-lg p-4 bg-gray-700"
                >
                  <h4 className="text-lg font-medium text-gray-100 mb-2">
                    {template.name}
                  </h4>
                  <p className="text-sm text-gray-300 mb-3">
                    {template.description}
                  </p>

                  <div className="space-y-2 text-xs text-gray-400">
                    <div>Format: {template.format}</div>
                    <div>Max Teams: {template.maxTeams}</div>
                    <div>
                      Fearless Draft: {template.fearlessDraft ? "Yes" : "No"}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleExportTemplate(template.id)}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                    >
                      Export
                    </button>
                    <button className="text-green-600 hover:text-green-800 text-xs font-medium">
                      Use Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cache Management */}
      {activeTab === "cache" && renderCacheTab()}

      {/* Data Integrity */}
      {activeTab === "integrity" && (
        <div className="space-y-6">
          <div className="bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-100 mb-4">
              Data Integrity Check
            </h3>
            <p className="text-sm text-gray-300 mb-6">
              Verify the integrity of your cached assets and detect any missing
              or corrupted files.
            </p>

            <div className="mb-6">
              <Button
                onClick={handleCheckDataIntegrity}
                disabled={isCheckingIntegrity || !isElectron}
                className="w-full md:w-auto"
              >
                {isCheckingIntegrity
                  ? "Checking Integrity..."
                  : "Check Data Integrity"}
              </Button>
            </div>

            {integrityCheckResult && (
              <div
                className={`p-4 rounded-lg border ${
                  integrityCheckResult.isValid
                    ? "bg-green-900 border-green-600"
                    : "bg-yellow-900 border-yellow-600"
                }`}
              >
                <div className="flex items-start">
                  <CheckCircleIcon
                    className={`w-5 h-5 mt-0.5 mr-3 ${
                      integrityCheckResult.isValid
                        ? "text-green-600"
                        : "text-yellow-600"
                    }`}
                  />
                  <div className="flex-1">
                    <h4
                      className={`font-medium ${
                        integrityCheckResult.isValid
                          ? "text-green-200"
                          : "text-yellow-200"
                      }`}
                    >
                      {integrityCheckResult.isValid
                        ? "Integrity Check Passed"
                        : "Integrity Issues Found"}
                    </h4>
                    <p
                      className={`text-sm mt-1 ${
                        integrityCheckResult.isValid
                          ? "text-green-300"
                          : "text-yellow-300"
                      }`}
                    >
                      {integrityCheckResult.message}
                    </p>

                    <div className="mt-3 space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Total Files:</span>{" "}
                        {integrityCheckResult.totalFiles}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Valid Files:</span>{" "}
                        {integrityCheckResult.validFiles}
                      </div>
                      {integrityCheckResult.missingFiles.length > 0 && (
                        <div className="text-sm">
                          <span className="font-medium text-red-400">
                            Missing Files:
                          </span>{" "}
                          {integrityCheckResult.missingFiles.length}
                        </div>
                      )}
                      {integrityCheckResult.corruptedFiles.length > 0 && (
                        <div className="text-sm">
                          <span className="font-medium text-red-400">
                            Corrupted Files:
                          </span>{" "}
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
                  Data integrity check is only available in the desktop
                  application.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* OBS Control */}
      {activeTab === "obs-control" && <OBSControl />}
    </div>
  );
};
