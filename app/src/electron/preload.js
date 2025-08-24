// eslint-disable-next-line @typescript-eslint/no-require-imports
const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // Environment
  isElectron: true,

  // Champions cache
  saveChampionsCache: (championsData) => ipcRenderer.invoke("save-champions-cache", championsData),
  loadChampionsCache: () => ipcRenderer.invoke("load-champions-cache"),

  // Core filesystem and asset cache
  getUserDataPath: () => ipcRenderer.invoke("get-user-data-path"),
  checkFileExists: (filePath) => ipcRenderer.invoke("check-file-exists", filePath),
  getFileSize: (filePath) => ipcRenderer.invoke("get-file-size", filePath),
  downloadAsset: (url, category, assetKey) => ipcRenderer.invoke("download-asset", url, category, assetKey),
  loadCategoryManifest: (category) => ipcRenderer.invoke("load-category-manifest", category),
  saveCategoryManifest: (category, manifestData) =>
    ipcRenderer.invoke("save-category-manifest", category, manifestData),
  removeAsset: (filePath) => ipcRenderer.invoke("remove-asset", filePath),
  clearAssetCache: () => ipcRenderer.invoke("clear-asset-cache"),
  getAssetCacheStats: () => ipcRenderer.invoke("get-asset-cache-stats"),
  checkAssetIntegrity: () => ipcRenderer.invoke("check-asset-integrity"),

  // Asset helpers
  copyAssetFile: (sourcePath, fileName) => ipcRenderer.invoke("copy-asset-file", sourcePath, fileName),
  saveCameraUpload: (fileBuffer, fileName) => ipcRenderer.invoke("save-camera-upload", fileBuffer, fileName),

  // Background/mode switching
  pauseBackgroundProcesses: () => ipcRenderer.invoke("pause-background-processes"),
  resumeBackgroundProcesses: () => ipcRenderer.invoke("resume-background-processes"),
  setModeSwitching: (enabled) => ipcRenderer.invoke("set-mode-switching", enabled),



  // Electron menu events
  onUpdateChampions: (callback) => ipcRenderer.on("update-champions", callback),
  onChampionsCacheCleared: (callback) => ipcRenderer.on("champions-cache-cleared", callback),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),

  // Local DB management
  getMongoDBStatus: () => ipcRenderer.invoke("get-mongodb-status"),
  getDatabaseCollections: () => ipcRenderer.invoke("get-database-collections"),
  getCollectionData: (collectionName, limit) => ipcRenderer.invoke("get-collection-data", collectionName, limit),
  exportCollection: (collectionName) => ipcRenderer.invoke("export-collection", collectionName),
  exportAllData: () => ipcRenderer.invoke("export-all-data"),
  createDatabaseBackup: () => ipcRenderer.invoke("create-database-backup"),
  getDatabaseBackups: () => ipcRenderer.invoke("get-database-backups"),
  restoreBackup: (backupPath) => ipcRenderer.invoke("restore-backup", backupPath),
  deleteBackup: (backupId) => ipcRenderer.invoke("delete-backup", backupId),
  openDataDirectory: () => ipcRenderer.invoke("open-data-directory")
});
