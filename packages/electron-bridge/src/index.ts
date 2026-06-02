export type AppMode = 'online' | 'offline' | null;

export interface AssetTreeNode {
  name: string;
  type: 'file' | 'directory';
  size?: number;
  children?: AssetTreeNode[];
}

export interface DownloadProgress {
  category: string;
  current: number;
  total: number;
  itemName: string;
  stage: string;
  percentage: number;
}

export interface SyncResult {
  pushed: number;
  pulled: number;
  conflicts: number;
  errors: string[];
}

export interface SyncStatus {
  lastSyncedAt: string | null;
  pendingChanges: number;
  isOnline: boolean;
}

export interface SyncProgress {
  stage: 'pushing' | 'pulling' | 'complete' | 'error';
  table: string;
  current: number;
  total: number;
  detail: string;
}

export interface ElectronAPI {
  downloadAsset: (url: string, destPath: string) => Promise<{ path: string }>;
  checkFileExists: (filePath: string) => Promise<boolean>;
  getAssetCacheStats: () => Promise<{ totalFiles: number; totalSize: number }>;
  clearAssetCache: () => Promise<{ success: boolean }>;
  checkAssetIntegrity: () => Promise<{
    valid: number;
    corrupted: number;
    missing: number;
    corruptedFiles: string[];
  }>;
  listAssetTree: () => Promise<AssetTreeNode[]>;

  onAssetProgress: (callback: (progress: DownloadProgress) => void) => () => void;

  saveChampionsCache: (version: string, data: unknown) => Promise<{ success: boolean }>;
  loadChampionsCache: () => Promise<{ version: string; data: unknown } | null>;

  obsConnect: (url: string, password?: string) => Promise<{ success: boolean }>;
  obsDisconnect: () => Promise<{ success: boolean }>;
  obsGetScenes: () => Promise<{ scenes: unknown[]; currentScene: string }>;
  obsSwitchScene: (sceneName: string) => Promise<{ success: boolean }>;
  obsGetStreamStatus: () => Promise<unknown>;
  obsStartStream: () => Promise<{ success: boolean }>;
  obsStopStream: () => Promise<{ success: boolean }>;

  getUserDataPath: () => Promise<string>;
  getPlatform: () => string;
  getVersion: () => Promise<string>;

  getDatabaseCollections: () => Promise<string[]>;
  exportCollectionData: (collection: string) => Promise<unknown>;
  createBackup: () => Promise<{ id: string; createdAt: string }>;
  getBackups: () => Promise<{ id: string; createdAt: string }[]>;
  restoreBackup: (backupId: string) => Promise<{ success: boolean }>;
  deleteBackup: (backupId: string) => Promise<{ success: boolean }>;

  getAppMode: () => Promise<AppMode>;
  setAppMode: (mode: 'online' | 'offline') => Promise<void>;

  syncPush: () => Promise<SyncResult>;
  syncPull: () => Promise<SyncResult>;
  syncFull: () => Promise<SyncResult>;
  syncGetStatus: () => Promise<SyncStatus>;
  syncReset: () => Promise<{ success: boolean }>;
  onSyncProgress: (callback: (progress: SyncProgress) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export function isElectron(): boolean {
  return typeof window !== 'undefined' && !!window.electronAPI;
}

export function getElectronAPI(): ElectronAPI | null {
  if (typeof window === 'undefined') return null;
  return window.electronAPI ?? null;
}
