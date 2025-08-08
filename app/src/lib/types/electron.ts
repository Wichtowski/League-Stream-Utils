import { Tournament } from "@lib/types/tournament";
import { Champion } from "@lib/types/game";

export interface TournamentData {
  tournament: Tournament;
  teams: string[];
  settings: Record<string, string | number | boolean>;
}

export interface ChampionsData {
  champions: Champion[];
  version: string;
  lastUpdated: string;
}

export interface CachedAsset {
  path: string;
  url: string;
  size: number;
  timestamp: number;
  checksum: string;
}

export interface LCUChampSelectSession {
  timer: {
    phase: string;
    adjustedTimeLeftInPhase: number;
  };
  bans: {
    myTeamBans: number[];
    theirTeamBans: number[];
  };
  picks: {
    myTeam: Array<{
      championId: number;
      spell1Id: number;
      spell2Id: number;
    }>;
    theirTeam: Array<{
      championId: number;
      spell1Id: number;
      spell2Id: number;
    }>;
  };
}

export interface LCUData {
  isConnected: boolean;
  isConnecting: boolean;
  champSelectSession: LCUChampSelectSession | null;
  connectionError: string | null;
  useMockData: boolean;
}

export interface ElectronAPI {
  // Platform info
  isElectron: boolean;
  platform: string;

  // File operations
  saveTournamentFile: (data: TournamentData) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  saveChampionsCache: (data: ChampionsData) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  loadChampionsCache: () => Promise<{
    success: boolean;
    data?: ChampionsData;
    error?: string;
  }>;
  copyAssetFile: (
    sourcePath: string,
    targetPath: string
  ) => Promise<{ success: boolean; localPath?: string; error?: string }>;
  saveCameraUpload: (
    fileBuffer: Buffer,
    fileName: string
  ) => Promise<{
    success: boolean;
    localPath?: string;
    publicPath?: string;
    error?: string;
  }>;
  saveTeamLogo: (
    fileBuffer: Buffer,
    fileName: string
  ) => Promise<{
    success: boolean;
    localPath?: string;
    error?: string;
  }>;
  saveTournamentLogo: (
    fileBuffer: Buffer,
    fileName: string
  ) => Promise<{
    success: boolean;
    localPath?: string;
    error?: string;
  }>;
  saveSponsorLogo: (
    tournamentId: string,
    fileBuffer: Buffer,
    fileName: string
  ) => Promise<{
    success: boolean;
    localPath?: string;
    error?: string;
  }>;
  getUserDataPath: () => Promise<string>;
  getDatabasePath: () => Promise<string>;
  getMongoDBStatus: () => Promise<{ isRunning: boolean; port: number; pid?: number }>;

  // Database management
  getDatabaseCollections: () => Promise<{ name: string; count: number; sample: unknown[] }[]>;
  getCollectionData: (collectionName: string, limit?: number) => Promise<unknown[]>;
  exportCollection: (collectionName: string) => Promise<string>;
  exportAllData: () => Promise<string>;
  createDatabaseBackup: () => Promise<{
    id: string;
    timestamp: Date;
    collections: string[];
    size: number;
    path: string;
  }>;
  getDatabaseBackups: () => Promise<
    { id: string; timestamp: Date; collections: string[]; size: number; path: string }[]
  >;
  restoreBackup: (backupPath: string) => Promise<void>;
  deleteBackup: (backupId: string) => Promise<void>;
  openDataDirectory: () => Promise<void>;

  checkFileExists: (filePath: string) => Promise<{ success: boolean; exists?: boolean; error?: string }>;

  // Asset caching system
  downloadAsset: (
    url: string,
    category: string,
    assetKey: string
  ) => Promise<{ success: boolean; localPath?: string; error?: string }>;
  loadCategoryManifest: (category: string) => Promise<{
    success: boolean;
    data?: Record<string, CachedAsset>;
    error?: string;
  }>;
  saveCategoryManifest: (
    category: string,
    manifestData: Record<string, CachedAsset>
  ) => Promise<{ success: boolean; error?: string }>;
  scanAndUpdateManifest: () => Promise<{
    success: boolean;
    updatedCount?: number;
    error?: string;
  }>;
  getFileSize: (filePath: string) => Promise<{ success: boolean; size?: number; error?: string }>;
  removeAsset: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  clearAssetCache: () => Promise<{ success: boolean; error?: string }>;
  getAssetCacheStats: () => Promise<{
    success: boolean;
    stats?: { totalSize: number; fileCount: number; formattedSize: string };
    error?: string;
  }>;
  checkAssetIntegrity: () => Promise<{
    success: boolean;
    integrity?: {
      isValid: boolean;
      missingFiles: string[];
      corruptedFiles: string[];
      totalFiles: number;
      validFiles: number;
      message: string;
    };
    error?: string;
  }>;
  pauseBackgroundProcesses: () => Promise<{ success: boolean; error?: string }>;
  resumeBackgroundProcesses: () => Promise<{
    success: boolean;
    error?: string;
  }>;
  setModeSwitching: (enabled: boolean) => Promise<{ success: boolean; error?: string }>;
  getModeSwitchingState: () => Promise<{
    success: boolean;
    isModeSwitching?: boolean;
    error?: string;
  }>;

  // LCU Data communication for overlay
  getLCUData: () => Promise<LCUData>;
  updateLCUData: (data: Partial<LCUData>) => Promise<{ success: boolean }>;
  setMockData: (enabled: boolean) => Promise<{ success: boolean }>;
  onLCUDataUpdate: (callback: (data: LCUData) => void) => void;
  onLCUConnectionChange: (
    callback: (data: Pick<LCUData, "isConnected" | "isConnecting" | "connectionError">) => void
  ) => void;
  onMockDataToggle: (callback: (enabled: boolean) => void) => void;

  // Storage operations (AppData persistent storage)
  storage?: {
    set: (key: string, value: unknown) => Promise<void>;
    get: (key: string) => Promise<unknown | null>;
    remove: (key: string) => Promise<void>;
    clear: (prefix?: string) => Promise<void>;
  };

  // System info
  getVersions?: () => Promise<{
    node: string;
    electron: string;
    chrome: string;
  }>;

  // Menu event listeners
  onCreateTournament: (callback: () => void) => void;
  onLoadTournament: (callback: (data: TournamentData) => void) => void;
  onSaveTournament: (callback: () => void) => void;
  onImportLogos: (callback: (filePaths: string[]) => void) => void;
  onExportTournament: (callback: (filePath: string) => void) => void;
  onUpdateChampions: (callback: () => void) => void;
  onChampionsCacheCleared: (callback: () => void) => void;
  onOpenOBSControl: (callback: () => void) => void;
  onOpenSettings: (callback: () => void) => void;

  // OBS Control
  obsConnect: (config: {
    host?: string;
    port?: number;
    password?: string;
  }) => Promise<{ success: boolean; message?: string; error?: string }>;
  obsDisconnect: () => Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }>;
  obsGetConnectionStatus: () => Promise<{ isConnected: boolean }>;
  obsGetSceneList: () => Promise<{
    success: boolean;
    scenes?: Array<{
      sceneIndex: number;
      sceneName: string;
      sceneEnabled: boolean;
    }>;
    error?: string;
  }>;
  obsSetCurrentScene: (sceneName: string) => Promise<{ success: boolean; error?: string }>;
  obsGetCurrentScene: () => Promise<{
    success: boolean;
    sceneName?: string;
    error?: string;
  }>;
  obsCreateScene: (sceneName: string) => Promise<{ success: boolean; error?: string }>;
  obsRemoveScene: (sceneName: string) => Promise<{ success: boolean; error?: string }>;
  obsStartStreaming: () => Promise<{ success: boolean; error?: string }>;
  obsStopStreaming: () => Promise<{ success: boolean; error?: string }>;
  obsGetStreamingStatus: () => Promise<{
    success: boolean;
    isStreaming?: boolean;
    isRecording?: boolean;
    error?: string;
  }>;
  obsStartRecording: () => Promise<{ success: boolean; error?: string }>;
  obsStopRecording: () => Promise<{ success: boolean; error?: string }>;
  obsGetSourceList: () => Promise<{
    success: boolean;
    sources?: Array<{ sourceName: string; sourceType: string }>;
    error?: string;
  }>;
  obsSetSourceEnabled: (sourceName: string, enabled: boolean) => Promise<{ success: boolean; error?: string }>;
  obsGetSourceEnabled: (sourceName: string) => Promise<{ success: boolean; enabled?: boolean; error?: string }>;

  // Cleanup
  removeAllListeners: (channel: string) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
