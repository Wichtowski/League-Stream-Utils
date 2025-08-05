/* eslint-disable @typescript-eslint/no-require-imports */
const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");
const isDev = process.env.NODE_ENV === "development";
const { createWindow } = require("./window");
const { registerTournamentHandlers } = require("./ipc-handlers/tournament");
const { registerChampionHandlers } = require("./ipc-handlers/champions");
const { registerAssetHandlers } = require("./ipc-handlers/assets");
const { registerLCUHandlers } = require("./ipc-handlers/lcu");
const { registerUtilHandlers } = require("./ipc-handlers/util");
const { registerOBSHandlers } = require("./ipc-handlers/obs");
const {
  broadcastLCUDataUpdate,
  broadcastMockDataToggle,
} = require("./utils/broadcast");
/* eslint-enable @typescript-eslint/no-require-imports */

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

// App event handlers
const mainWindowRef = { value: null };
app.whenReady().then(() => {
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
