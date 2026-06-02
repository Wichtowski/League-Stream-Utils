import { contextBridge, ipcRenderer } from 'electron';

const api = {
  // Assets
  downloadAsset: (url: string, destPath: string) =>
    ipcRenderer.invoke('assets:download', url, destPath),
  checkFileExists: (filePath: string) => ipcRenderer.invoke('assets:exists', filePath),
  getAssetCacheStats: () => ipcRenderer.invoke('assets:cache-stats'),
  clearAssetCache: () => ipcRenderer.invoke('assets:clear-cache'),
  checkAssetIntegrity: () => ipcRenderer.invoke('assets:check-integrity'),
  listAssetTree: () => ipcRenderer.invoke('assets:list-tree'),

  // Asset download progress
  onAssetProgress: (callback: (progress: unknown) => void) => {
    const handler = (_event: unknown, progress: unknown) => callback(progress);
    ipcRenderer.on('assets:progress', handler);
    return () => ipcRenderer.removeListener('assets:progress', handler);
  },

  // Champions cache
  saveChampionsCache: (version: string, data: unknown) =>
    ipcRenderer.invoke('champions:save-cache', version, data),
  loadChampionsCache: () => ipcRenderer.invoke('champions:load-cache'),

  // OBS
  obsConnect: (url: string, password?: string) => ipcRenderer.invoke('obs:connect', url, password),
  obsDisconnect: () => ipcRenderer.invoke('obs:disconnect'),
  obsGetScenes: () => ipcRenderer.invoke('obs:get-scenes'),
  obsSwitchScene: (sceneName: string) => ipcRenderer.invoke('obs:switch-scene', sceneName),
  obsGetStreamStatus: () => ipcRenderer.invoke('obs:stream-status'),
  obsStartStream: () => ipcRenderer.invoke('obs:start-stream'),
  obsStopStream: () => ipcRenderer.invoke('obs:stop-stream'),

  // System
  getUserDataPath: () => ipcRenderer.invoke('util:user-data-path'),
  getPlatform: () => ipcRenderer.invoke('util:platform'),
  getVersion: () => ipcRenderer.invoke('util:app-version'),

  // Database
  getDatabaseCollections: () => ipcRenderer.invoke('db:collections'),
  exportCollectionData: (collection: string) =>
    ipcRenderer.invoke('db:export-collection', collection),
  createBackup: () => ipcRenderer.invoke('db:create-backup'),
  getBackups: () => ipcRenderer.invoke('db:get-backups'),
  restoreBackup: (backupId: string) => ipcRenderer.invoke('db:restore-backup', backupId),
  deleteBackup: (backupId: string) => ipcRenderer.invoke('db:delete-backup', backupId),

  // App mode
  getAppMode: () => ipcRenderer.invoke('util:get-app-mode'),
  setAppMode: (mode: string) => ipcRenderer.invoke('util:set-app-mode', mode),

  // Sync
  syncPush: () => ipcRenderer.invoke('sync:push'),
  syncPull: () => ipcRenderer.invoke('sync:pull'),
  syncFull: () => ipcRenderer.invoke('sync:full'),
  syncGetStatus: () => ipcRenderer.invoke('sync:status'),
  syncReset: () => ipcRenderer.invoke('sync:reset'),
  onSyncProgress: (callback: (progress: unknown) => void) => {
    const handler = (_event: unknown, progress: unknown) => callback(progress);
    ipcRenderer.on('sync:progress', handler);
    return () => ipcRenderer.removeListener('sync:progress', handler);
  },
} as const;

export type ElectronAPI = typeof api;

contextBridge.exposeInMainWorld('electronAPI', api);
