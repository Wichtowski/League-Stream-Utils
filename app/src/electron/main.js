import { app, BrowserWindow, protocol } from "electron";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { createHandler } from "next-electron-rsc";

// Set the app name for proper userData directory
app.setName("League Stream Utils");

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isDev = process.env.NODE_ENV === "development";

// ⬇ Next.js handler ⬇
const appRootDir = path.join(__dirname, "..", "..");
const appPath = isDev ? appRootDir : app.getAppPath();
console.log("App path:", appPath);

let createInterceptor;
let localhostUrl;

if (isDev) {
  // In dev, rely on the running Next dev server directly
  localhostUrl = "http://localhost:2137";
  createInterceptor = async () => () => {};
} else {
  // In prod, use next-electron-rsc to serve the built app
  const dir = path.join(appPath, ".next", "standalone");
  const handler = createHandler({
    dev: false,
    dir,
    protocol,
    debug: true,
    turbo: true,
    port: 2137
  });
  createInterceptor = handler.createInterceptor;
  localhostUrl = handler.localhostUrl;
}

// Import modules using dynamic imports
let createWindow,
  registerChampionHandlers,
  registerHostedHandlers,
  registerLCUHandlers,
  registerUtilHandlers,
  registerOBSHandlers,
  broadcastLCUDataUpdate,
  broadcastMockDataToggle;

// Load modules dynamically
async function loadModules() {
  const windowModule = await import("./window.js");
  createWindow = windowModule.createWindow;

  const championModule = await import("./ipc-handlers/champions.js");
  registerChampionHandlers = championModule.registerChampionHandlers;

  const hostedAssetsModule = await import("./ipc-handlers/assets.js");
  registerHostedHandlers = hostedAssetsModule.registerHostedAssetsHandlers;

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
  connectionError: null
};

let useMockData = false;

// Simple HTTP server for web overlay data
let dataServer;

// Data storage paths
const userDataPath = app.getPath("userData");
const hostedPath = path.join(userDataPath, "hosted");
const databasePath = path.join(userDataPath, "database");
const championsPath = (version) => {
  return path.join(userDataPath, "hosted", version, "champions");
}
// Ensure directories exist
[hostedPath, databasePath].forEach((dir) => {
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
    console.log("🐳 Initializing local MongoDB...");
    const { localMongoDBService } = await import("./database/local-mongodb-service.js");

    // Check if MongoDB is already running
    const status = await localMongoDBService.getStatus();

    if (!status.isRunning) {
      console.log("🚀 Starting local MongoDB...");
      await localMongoDBService.start();
      await localMongoDBService.waitForReady();
      console.log("✅ Local MongoDB is ready");
    } else {
      console.log("✅ Local MongoDB is already running");
    }
  } catch (error) {
    console.error("❌ Failed to initialize local MongoDB:", error);
    console.warn("⚠️ Continuing with external MongoDB...");
  }

  // Register handlers after modules are loaded
  const lcuDataRef = { value: lcuData };
  const useMockDataRef = { value: useMockData };

  registerChampionHandlers(mainWindow, championsPath, userDataPath);
  registerHostedHandlers(mainWindow, hostedPath, path.join(hostedPath, "cache"));
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
