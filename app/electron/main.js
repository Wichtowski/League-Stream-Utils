import { app, BrowserWindow, protocol } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createHandler } from 'next-electron-rsc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isDev = process.env.NODE_ENV === 'development';

// ⬇ Next.js handler ⬇
const appPath = app.getAppPath();
const dir = path.join(appPath, '.next', 'standalone');

const { createInterceptor, localhostUrl } = createHandler({
    dev: isDev,
    dir,
    protocol,
    debug: true,
    turbo: true, // optional
    port: 2137
});

// Import modules using dynamic imports
let createWindow,
    registerTournamentHandlers,
    registerChampionHandlers,
    registerAssetHandlers,
    registerLCUHandlers,
    registerUtilHandlers,
    registerOBSHandlers,
    broadcastLCUDataUpdate,
    broadcastMockDataToggle;

// Load modules dynamically
async function loadModules() {
    const windowModule = await import('./window.js');
    createWindow = windowModule.createWindow;

    const tournamentModule = await import('./ipc-handlers/tournament.js');
    registerTournamentHandlers = tournamentModule.registerTournamentHandlers;

    const championModule = await import('./ipc-handlers/champions.js');
    registerChampionHandlers = championModule.registerChampionHandlers;

    const assetModule = await import('./ipc-handlers/assets.js');
    registerAssetHandlers = assetModule.registerAssetHandlers;

    const lcuModule = await import('./ipc-handlers/lcu.js');
    registerLCUHandlers = lcuModule.registerLCUHandlers;

    const utilModule = await import('./ipc-handlers/util.js');
    registerUtilHandlers = utilModule.registerUtilHandlers;

    const obsModule = await import('./ipc-handlers/obs.js');
    registerOBSHandlers = obsModule.registerOBSHandlers;

    const broadcastModule = await import('./utils/broadcast.js');
    broadcastLCUDataUpdate = broadcastModule.broadcastLCUDataUpdate;
    broadcastMockDataToggle = broadcastModule.broadcastMockDataToggle;
}

// Set environment variable for Next.js to use user data directory
process.env.USE_USER_DATA = 'true';
// Keep a global reference of the window object
let mainWindow;

// LCU Data state for overlay communication
let lcuData = {
    isConnected: false,
    isConnecting: false,
    champSelectSession: null,
    connectionError: null
};

let useMockData = false;

// Simple HTTP server for web overlay data
let dataServer;

// Data storage paths
const userDataPath = app.getPath('userData');
const assetsPath = path.join(userDataPath, 'assets');
const databasePath = path.join(userDataPath, 'database');
const championsPath = path.join(userDataPath, 'champions');

// Ensure directories exist
[assetsPath, databasePath, championsPath].forEach((dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// App event handlers
const mainWindowRef = { value: null };

app.whenReady().then(async () => {
    // Load all modules first
    await loadModules();

    // Initialize MongoDB if running in Electron
    try {
        console.log('🐳 Initializing local MongoDB...');
        const { localMongoDBService } = await import('./database/local-mongodb-service.js');

        // Check if MongoDB is already running
        const status = await localMongoDBService.getStatus();

        if (!status.isRunning) {
            console.log('🚀 Starting local MongoDB...');
            await localMongoDBService.start();
            await localMongoDBService.waitForReady();
            console.log('✅ Local MongoDB is ready');
        } else {
            console.log('✅ Local MongoDB is already running');
        }
    } catch (error) {
        console.error('❌ Failed to initialize local MongoDB:', error);
        console.warn('⚠️ Continuing with external MongoDB...');
    }

    // Register handlers after modules are loaded
    const lcuDataRef = { value: lcuData };
    const useMockDataRef = { value: useMockData };

    registerTournamentHandlers(mainWindow, databasePath);
    registerChampionHandlers(mainWindow, championsPath, userDataPath);
    registerAssetHandlers(mainWindow, assetsPath, assetsPath);
    registerLCUHandlers(
        lcuDataRef,
        useMockDataRef,
        () => broadcastLCUDataUpdate(mainWindow, lcuData),
        () => broadcastMockDataToggle(mainWindow, useMockData)
    );
    registerUtilHandlers();
    registerOBSHandlers();

    // Create window after handlers are registered
    createWindow(mainWindowRef, localhostUrl, createInterceptor);
    mainWindow = mainWindowRef.value;
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        if (dataServer) {
            dataServer.close();
        }
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.on('before-quit', () => {
    if (dataServer) {
        dataServer.close();
    }
});
