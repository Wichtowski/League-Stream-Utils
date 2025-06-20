const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Tournament management
    saveTournamentFile: (tournamentData) => ipcRenderer.invoke('save-tournament-file', tournamentData),

    // Champions data management
    saveChampionsCache: (championsData) => ipcRenderer.invoke('save-champions-cache', championsData),
    loadChampionsCache: () => ipcRenderer.invoke('load-champions-cache'),

    // Asset management
    copyAssetFile: (sourcePath, fileName) => ipcRenderer.invoke('copy-asset-file', sourcePath, fileName),
    saveCameraUpload: (fileBuffer, fileName) => ipcRenderer.invoke('save-camera-upload', fileBuffer, fileName),
    getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),

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