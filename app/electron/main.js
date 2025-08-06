import { app, BrowserWindow } from "electron";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isDev = process.env.NODE_ENV === "development";

// Import modules using dynamic imports
let createWindow, registerTournamentHandlers, registerChampionHandlers, 
    registerAssetHandlers, registerLCUHandlers, registerUtilHandlers, 
    registerOBSHandlers, broadcastLCUDataUpdate, broadcastMockDataToggle;

// Load modules dynamically
async function loadModules() {
  const windowModule = await import("./window.js");
  createWindow = windowModule.createWindow;
  
  const tournamentModule = await import("./ipc-handlers/tournament.js");
  registerTournamentHandlers = tournamentModule.registerTournamentHandlers;
  
  const championModule = await import("./ipc-handlers/champions.js");
  registerChampionHandlers = championModule.registerChampionHandlers;
  
  const assetModule = await import("./ipc-handlers/assets.js");
  registerAssetHandlers = assetModule.registerAssetHandlers;
  
  const lcuModule = await import("./ipc-handlers/lcu.js");
  registerLCUHandlers = lcuModule.registerLCUHandlers;
  
  const utilModule = await import("./ipc-handlers/util.js");
  registerUtilHandlers = utilModule.registerUtilHandlers;
  
  const obsModule = await import("./ipc-handlers/obs.js");
  registerOBSHandlers = obsModule.registerOBSHandlers;
  
  const broadcastModule = await import("./utils/broadcast.js");
  broadcastLCUDataUpdate = broadcastModule.broadcastLCUDataUpdate;
  broadcastMockDataToggle = broadcastModule.broadcastMockDataToggle;
}

// Set environment variable for Next.js to use user data directory
process.env.USE_USER_DATA = "true";
// Keep a global reference of the window object
let mainWindow;

// LCU Data state for overlay communication
let lcuData = {
  isConnected: false,
  isConnecting: false,
  champSelectSession: null,
  connectionError: null,
};

let useMockData = false;

// Simple HTTP server for web overlay data
let dataServer;

// Tournament data storage paths
const userDataPath = app.getPath("userData");
const tournamentsPath = path.join(userDataPath, "tournaments");
const championsPath = path.join(userDataPath, "champions");
const assetsPath = path.join(userDataPath, "assets");
const uploadsPath = path.join(userDataPath, "uploads", "cameras");
const assetCachePath = path.join(userDataPath, "assets");

// Ensure directories exist
[
  tournamentsPath,
  championsPath,
  assetsPath,
  uploadsPath,
  assetCachePath,
].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// App event handlers
const mainWindowRef = { value: null };

app.whenReady().then(async () => {
  // Load all modules first
  await loadModules();
  
  // Register handlers after modules are loaded
  const lcuDataRef = { value: lcuData };
  const useMockDataRef = { value: useMockData };
  
  registerTournamentHandlers(mainWindow, tournamentsPath);
  registerChampionHandlers(mainWindow, championsPath, userDataPath);
  registerAssetHandlers(mainWindow, assetsPath, assetCachePath);
  registerLCUHandlers(
    lcuDataRef,
    useMockDataRef,
    () => broadcastLCUDataUpdate(mainWindow, lcuData),
    () => broadcastMockDataToggle(mainWindow, useMockData),
  );
  registerUtilHandlers();
  registerOBSHandlers();
  
  // Create window after handlers are registered
  createWindow(mainWindowRef);
  mainWindow = mainWindowRef.value;
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    if (dataServer) {
      dataServer.close();
    }
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("before-quit", () => {
  if (dataServer) {
    dataServer.close();
  }
});

// Start Next.js in development
if (isDev) {
  app.whenReady().then(() => {
    // Next.js should already be running via npm run dev
    console.log("Development mode: assuming Next.js is running on port 2137");
  });
}
