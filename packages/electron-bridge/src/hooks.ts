import { create } from 'zustand';
import { isElectron, getElectronAPI, type AssetTreeNode, type DownloadProgress, type AppMode, type SyncResult, type SyncStatus, type SyncProgress } from './index';

interface ElectronStore {
  isElectronEnv: boolean;
  cacheStats: { totalFiles: number; totalSize: number } | null;
  assetTree: AssetTreeNode[] | null;
  integrityResults: {
    valid: number;
    corrupted: number;
    missing: number;
    corruptedFiles: string[];
  } | null;
  loading: boolean;
  refreshCacheStats: () => Promise<void>;
  refreshAssetTree: () => Promise<void>;
  runIntegrityCheck: () => Promise<void>;
  clearCache: () => Promise<void>;
}

export const useElectronStore = create<ElectronStore>((set) => ({
  isElectronEnv: isElectron(),
  cacheStats: null,
  assetTree: null,
  integrityResults: null,
  loading: false,

  refreshCacheStats: async () => {
    const api = getElectronAPI();
    if (!api) return;
    set({ loading: true });
    const stats = await api.getAssetCacheStats();
    set({ cacheStats: stats, loading: false });
  },

  refreshAssetTree: async () => {
    const api = getElectronAPI();
    if (!api) return;
    try {
      if (typeof api.listAssetTree !== 'function') return;
      const tree = await api.listAssetTree();
      set({ assetTree: tree });
    } catch {
      // IPC handler not yet registered — electron needs restart
    }
  },

  runIntegrityCheck: async () => {
    const api = getElectronAPI();
    if (!api) return;
    set({ loading: true });
    const results = await api.checkAssetIntegrity();
    set({ integrityResults: results, loading: false });
  },

  clearCache: async () => {
    const api = getElectronAPI();
    if (!api) return;
    set({ loading: true });
    await api.clearAssetCache();
    set({ cacheStats: { totalFiles: 0, totalSize: 0 }, loading: false });
  },
}));

interface OBSElectronStore {
  connected: boolean;
  scenes: unknown[];
  currentScene: string;
  connecting: boolean;
  error: string | null;
  connect: (url: string, password?: string) => Promise<void>;
  disconnect: () => Promise<void>;
  switchScene: (sceneName: string) => Promise<void>;
  refreshScenes: () => Promise<void>;
  startStream: () => Promise<void>;
  stopStream: () => Promise<void>;
}

export const useOBSElectron = create<OBSElectronStore>((set) => ({
  connected: false,
  scenes: [],
  currentScene: '',
  connecting: false,
  error: null,

  connect: async (url, password) => {
    const api = getElectronAPI();
    if (!api) return;
    set({ connecting: true, error: null });
    try {
      await api.obsConnect(url, password);
      const { scenes, currentScene } = await api.obsGetScenes();
      set({ connected: true, scenes, currentScene, connecting: false });
    } catch (e: any) {
      set({ error: e.message ?? 'Connection failed', connecting: false });
    }
  },

  disconnect: async () => {
    const api = getElectronAPI();
    if (!api) return;
    await api.obsDisconnect();
    set({ connected: false, scenes: [], currentScene: '' });
  },

  switchScene: async (sceneName) => {
    const api = getElectronAPI();
    if (!api) return;
    await api.obsSwitchScene(sceneName);
    set({ currentScene: sceneName });
  },

  refreshScenes: async () => {
    const api = getElectronAPI();
    if (!api) return;
    const { scenes, currentScene } = await api.obsGetScenes();
    set({ scenes, currentScene });
  },

  startStream: async () => {
    const api = getElectronAPI();
    if (!api) return;
    await api.obsStartStream();
  },

  stopStream: async () => {
    const api = getElectronAPI();
    if (!api) return;
    await api.obsStopStream();
  },
}));

interface BackupStore {
  backups: { id: string; createdAt: string }[];
  loading: boolean;
  refreshBackups: () => Promise<void>;
  createBackup: () => Promise<void>;
  restoreBackup: (id: string) => Promise<void>;
  deleteBackup: (id: string) => Promise<void>;
}

export const useBackupStore = create<BackupStore>((set, get) => ({
  backups: [],
  loading: false,

  refreshBackups: async () => {
    const api = getElectronAPI();
    if (!api) return;
    set({ loading: true });
    const backups = await api.getBackups();
    set({ backups, loading: false });
  },

  createBackup: async () => {
    const api = getElectronAPI();
    if (!api) return;
    set({ loading: true });
    await api.createBackup();
    await get().refreshBackups();
  },

  restoreBackup: async (id) => {
    const api = getElectronAPI();
    if (!api) return;
    set({ loading: true });
    await api.restoreBackup(id);
    set({ loading: false });
  },

  deleteBackup: async (id) => {
    const api = getElectronAPI();
    if (!api) return;
    set({ loading: true });
    await api.deleteBackup(id);
    await get().refreshBackups();
  },
}));

interface DownloadProgressStore {
  categories: Record<string, DownloadProgress>;
  active: boolean;
  subscribe: () => () => void;
}

export const useDownloadProgress = create<DownloadProgressStore>((set) => ({
  categories: {},
  active: false,

  subscribe: () => {
    const api = getElectronAPI();
    if (!api) return () => {};
    return api.onAssetProgress((progress) => {
      set((state) => {
        const categories = { ...state.categories, [progress.category]: progress };
        const active = Object.values(categories).some((c) => c.stage !== 'complete');
        return { categories, active };
      });
    });
  },
}));

interface AppModeStore {
  mode: AppMode;
  loading: boolean;
  load: () => Promise<void>;
  setMode: (mode: 'online' | 'offline' | null) => Promise<void>;
}

export const useAppMode = create<AppModeStore>((set) => ({
  mode: null,
  loading: true,

  load: async () => {
    const api = getElectronAPI();
    if (!api) {
      set({ mode: 'online', loading: false });
      return;
    }
    const mode = await api.getAppMode();
    set({ mode, loading: false });
  },

  setMode: async (mode) => {
    const api = getElectronAPI();
    if (api && mode) await api.setAppMode(mode);
    if (api && !mode) await api.setAppMode(null as any);
    set({ mode });
  },
}));

interface SyncStore {
  status: SyncStatus | null;
  syncing: boolean;
  progress: SyncProgress | null;
  lastResult: SyncResult | null;
  refreshStatus: () => Promise<void>;
  push: () => Promise<SyncResult | null>;
  pull: () => Promise<SyncResult | null>;
  fullSync: () => Promise<SyncResult | null>;
  resetSync: () => Promise<void>;
  subscribe: () => () => void;
}

export const useSyncStore = create<SyncStore>((set, get) => ({
  status: null,
  syncing: false,
  progress: null,
  lastResult: null,

  refreshStatus: async () => {
    const api = getElectronAPI();
    if (!api) return;
    const status = await api.syncGetStatus();
    set({ status });
  },

  push: async () => {
    const api = getElectronAPI();
    if (!api) return null;
    set({ syncing: true, progress: null });
    try {
      const result = await api.syncPush();
      set({ syncing: false, lastResult: result });
      await get().refreshStatus();
      return result;
    } catch {
      set({ syncing: false });
      return null;
    }
  },

  pull: async () => {
    const api = getElectronAPI();
    if (!api) return null;
    set({ syncing: true, progress: null });
    try {
      const result = await api.syncPull();
      set({ syncing: false, lastResult: result });
      await get().refreshStatus();
      return result;
    } catch {
      set({ syncing: false });
      return null;
    }
  },

  fullSync: async () => {
    const api = getElectronAPI();
    if (!api) return null;
    set({ syncing: true, progress: null });
    try {
      const result = await api.syncFull();
      set({ syncing: false, lastResult: result });
      await get().refreshStatus();
      return result;
    } catch {
      set({ syncing: false });
      return null;
    }
  },

  resetSync: async () => {
    const api = getElectronAPI();
    if (!api) return;
    await api.syncReset();
    set({ status: null, lastResult: null, progress: null });
    await get().refreshStatus();
  },

  subscribe: () => {
    const api = getElectronAPI();
    if (!api) return () => {};
    return api.onSyncProgress((progress) => {
      set({ progress: progress as SyncProgress });
    });
  },
}));
