const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Tournament management
    saveTournamentFile: (tournamentData) => ipcRenderer.invoke('save-tournament-file', tournamentData),

    // Champions data management
    saveChampionsCache: (championsData) => ipcRenderer.invoke('save-champions-cache', championsData),
    loadChampionsCache: () => ipcRenderer.invoke('load-champions-cache'),

    // Enhanced champion caching system
    getChampionCachePath: () => ipcRenderer.invoke('get-champion-cache-path'),
    checkFileExists: (filePath) => ipcRenderer.invoke('check-file-exists', filePath),
    loadChampionData: (filePath) => ipcRenderer.invoke('load-champion-data', filePath),
    saveChampionData: (filePath, data) => ipcRenderer.invoke('save-champion-data', filePath, data),
    createChampionDirectory: (dirPath) => ipcRenderer.invoke('create-champion-directory', dirPath),
    downloadChampionImage: (url, localPath) => ipcRenderer.invoke('download-champion-image', url, localPath),
    clearChampionCache: (cacheDir) => ipcRenderer.invoke('clear-champion-cache', cacheDir),
    getChampionCacheStats: (cacheDir) => ipcRenderer.invoke('get-champion-cache-stats', cacheDir),

    // Asset management
    copyAssetFile: (sourcePath, fileName) => ipcRenderer.invoke('copy-asset-file', sourcePath, fileName),
    saveCameraUpload: (fileBuffer, fileName) => ipcRenderer.invoke('save-camera-upload', fileBuffer, fileName),
    getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),

    // Asset caching system
    downloadAsset: (url, category, assetKey) => ipcRenderer.invoke('download-asset', url, category, assetKey),
    loadAssetManifest: () => ipcRenderer.invoke('load-asset-manifest'),
    saveAssetManifest: (manifestData) => ipcRenderer.invoke('save-asset-manifest', manifestData),
    scanAndUpdateManifest: () => ipcRenderer.invoke('scan-and-update-manifest'),
    getFileSize: (filePath) => ipcRenderer.invoke('get-file-size', filePath),
    removeAsset: (filePath) => ipcRenderer.invoke('remove-asset', filePath),
    clearAssetCache: () => ipcRenderer.invoke('clear-asset-cache'),
    getAssetCacheStats: () => ipcRenderer.invoke('get-asset-cache-stats'),

    // LCU Data communication for overlay
    getLCUData: () => ipcRenderer.invoke('get-lcu-data'),
    updateLCUData: (data) => ipcRenderer.invoke('update-lcu-data', data),
    setMockData: (enabled) => ipcRenderer.invoke('set-mock-data', enabled),
    onLCUDataUpdate: (callback) => ipcRenderer.on('lcu-data-update', callback),
    onLCUConnectionChange: (callback) => ipcRenderer.on('lcu-connection-change', callback),
    onMockDataToggle: (callback) => ipcRenderer.on('mock-data-toggle', callback),

    // Electron menu events
    onCreateTournament: (callback) => ipcRenderer.on('create-tournament', callback),
    onLoadTournament: (callback) => ipcRenderer.on('load-tournament', callback),
    onSaveTournament: (callback) => ipcRenderer.on('save-tournament', callback),
    onImportLogos: (callback) => ipcRenderer.on('import-logos', callback),
    onExportTournament: (callback) => ipcRenderer.on('export-tournament', callback),
    onUpdateChampions: (callback) => ipcRenderer.on('update-champions', callback),
    onChampionsCacheCleared: (callback) => ipcRenderer.on('champions-cache-cleared', callback),
    onOpenOBSControl: (callback) => ipcRenderer.on('open-obs-control', callback),
    onOpenSettings: (callback) => ipcRenderer.on('open-settings', callback),

    // Clean up listeners
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),

    // Platform info
    platform: process.platform,
    isElectron: true
});

// Log that preload script has loaded
console.log('League Stream Utils Electron preload script loaded');

// Log the exposed API methods
const exposedMethods = [
    'saveTournamentFile', 'saveChampionsCache', 'loadChampionsCache',
    'getChampionCachePath', 'checkFileExists', 'loadChampionData', 'saveChampionData',
    'createChampionDirectory', 'downloadChampionImage', 'clearChampionCache', 'getChampionCacheStats',
    'copyAssetFile', 'saveCameraUpload', 'getUserDataPath',
    'downloadAsset', 'loadAssetManifest', 'saveAssetManifest', 'scanAndUpdateManifest', 'getFileSize', 'removeAsset', 'clearAssetCache', 'getAssetCacheStats',
    'getLCUData', 'updateLCUData', 'setMockData', 'onLCUDataUpdate', 'onLCUConnectionChange', 'onMockDataToggle',
    'onCreateTournament', 'onLoadTournament', 'onSaveTournament', 'onImportLogos', 'onExportTournament',
    'onUpdateChampions', 'onChampionsCacheCleared', 'onOpenOBSControl', 'onOpenSettings',
    'removeAllListeners', 'platform', 'isElectron'
];
console.log('Exposed electronAPI methods:', exposedMethods); 