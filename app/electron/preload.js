/* eslint-disable-next-line @typescript-eslint/no-require-imports */
const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // Electron environment check
  isElectron: true,

  // Tournament management
  saveTournamentFile: (tournamentData) =>
    ipcRenderer.invoke("save-tournament-file", tournamentData),

  // Champions data management
  saveChampionsCache: (championsData) =>
    ipcRenderer.invoke("save-champions-cache", championsData),
  loadChampionsCache: () => ipcRenderer.invoke("load-champions-cache"),

  // Enhanced champion caching system
  getChampionCachePath: () => ipcRenderer.invoke("get-champion-cache-path"),
  checkFileExists: (filePath) =>
    ipcRenderer.invoke("check-file-exists", filePath),
  loadChampionData: (filePath) =>
    ipcRenderer.invoke("load-champion-data", filePath),
  saveChampionData: (filePath, data) =>
    ipcRenderer.invoke("save-champion-data", filePath, data),
  createChampionDirectory: (dirPath) =>
    ipcRenderer.invoke("create-champion-directory", dirPath),
  downloadChampionImage: (url, localPath) =>
    ipcRenderer.invoke("download-champion-image", url, localPath),
  clearChampionCache: (cacheDir) =>
    ipcRenderer.invoke("clear-champion-cache", cacheDir),
  getChampionCacheStats: (cacheDir) =>
    ipcRenderer.invoke("get-champion-cache-stats", cacheDir),

  // Asset management
  copyAssetFile: (sourcePath, fileName) =>
    ipcRenderer.invoke("copy-asset-file", sourcePath, fileName),
  saveCameraUpload: (fileBuffer, fileName) =>
    ipcRenderer.invoke("save-camera-upload", fileBuffer, fileName),
  getUserDataPath: () => ipcRenderer.invoke("get-user-data-path"),

  // Asset caching system
  downloadAsset: (url, category, assetKey) =>
    ipcRenderer.invoke("download-asset", url, category, assetKey),
  downloadAssetsParallel: (downloadTasks) =>
    ipcRenderer.invoke("download-assets-parallel", downloadTasks),
  loadCategoryManifest: (category) =>
    ipcRenderer.invoke("load-category-manifest", category),
  saveCategoryManifest: (category, manifestData) =>
    ipcRenderer.invoke("save-category-manifest", category, manifestData),
  scanAndUpdateManifest: () => ipcRenderer.invoke("scan-and-update-manifest"),
  getFileSize: (filePath) => ipcRenderer.invoke("get-file-size", filePath),
  removeAsset: (filePath) => ipcRenderer.invoke("remove-asset", filePath),
  clearAssetCache: () => ipcRenderer.invoke("clear-asset-cache"),
  getAssetCacheStats: () => ipcRenderer.invoke("get-asset-cache-stats"),
  checkAssetIntegrity: () => ipcRenderer.invoke("check-asset-integrity"),
  pauseBackgroundProcesses: () =>
    ipcRenderer.invoke("pause-background-processes"),
  resumeBackgroundProcesses: () =>
    ipcRenderer.invoke("resume-background-processes"),
  setModeSwitching: (enabled) =>
    ipcRenderer.invoke("set-mode-switching", enabled),
  getModeSwitchingState: () => ipcRenderer.invoke("get-mode-switching-state"),

  // LCU Data communication for overlay
  getLCUData: () => ipcRenderer.invoke("get-lcu-data"),
  updateLCUData: (data) => ipcRenderer.invoke("update-lcu-data", data),
  setMockData: (enabled) => ipcRenderer.invoke("set-mock-data", enabled),
  onLCUDataUpdate: (callback) => ipcRenderer.on("lcu-data-update", callback),
  onLCUConnectionChange: (callback) =>
    ipcRenderer.on("lcu-connection-change", callback),
  onMockDataToggle: (callback) => ipcRenderer.on("mock-data-toggle", callback),

  // Electron menu events
  onCreateTournament: (callback) =>
    ipcRenderer.on("create-tournament", callback),
  onLoadTournament: (callback) => ipcRenderer.on("load-tournament", callback),
  onSaveTournament: (callback) => ipcRenderer.on("save-tournament", callback),
  onImportLogos: (callback) => ipcRenderer.on("import-logos", callback),
  onExportTournament: (callback) =>
    ipcRenderer.on("export-tournament", callback),
  onUpdateChampions: (callback) => ipcRenderer.on("update-champions", callback),
  onChampionsCacheCleared: (callback) =>
    ipcRenderer.on("champions-cache-cleared", callback),
  onOpenOBSControl: (callback) => ipcRenderer.on("open-obs-control", callback),
  onOpenSettings: (callback) => ipcRenderer.on("open-settings", callback),

  // Clean up listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),

  // OBS Control
  obsConnect: (config) => ipcRenderer.invoke("obs-connect", config),
  obsDisconnect: () => ipcRenderer.invoke("obs-disconnect"),
  obsGetConnectionStatus: () => ipcRenderer.invoke("obs-get-connection-status"),
  obsGetSceneList: () => ipcRenderer.invoke("obs-get-scene-list"),
  obsSetCurrentScene: (sceneName) =>
    ipcRenderer.invoke("obs-set-current-scene", sceneName),
  obsGetCurrentScene: () => ipcRenderer.invoke("obs-get-current-scene"),
  obsCreateScene: (sceneName) =>
    ipcRenderer.invoke("obs-create-scene", sceneName),
  obsRemoveScene: (sceneName) =>
    ipcRenderer.invoke("obs-remove-scene", sceneName),
  obsStartStreaming: () => ipcRenderer.invoke("obs-start-streaming"),
  obsStopStreaming: () => ipcRenderer.invoke("obs-stop-streaming"),
  obsGetStreamingStatus: () => ipcRenderer.invoke("obs-get-streaming-status"),
  obsStartRecording: () => ipcRenderer.invoke("obs-start-recording"),
  obsStopRecording: () => ipcRenderer.invoke("obs-stop-recording"),
  obsGetSourceList: () => ipcRenderer.invoke("obs-get-source-list"),
  obsSetSourceEnabled: (sourceName, enabled) =>
    ipcRenderer.invoke("obs-set-source-enabled", { sourceName, enabled }),
  obsGetSourceEnabled: (sourceName) =>
    ipcRenderer.invoke("obs-get-source-enabled", sourceName),

  // Platform info
  platform: process.platform,
  isElectron: true,
});
