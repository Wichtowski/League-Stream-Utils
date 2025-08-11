import { BrowserWindow, shell } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isDev = process.env.NODE_ENV === "development";

let stopIntercept;

async function createWindow(mainWindow, localhostUrl, createInterceptor) {
  // Create the browser window
  mainWindow.value = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js"),
      // Additional security settings
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      webSecurity: true
    },
    icon: path.join(__dirname, "../public/favicon.ico"),
    titleBarStyle: "default",
    show: false
  });

  // Set CSP headers for development mode to avoid conflicts
  if (isDev) {
    mainWindow.value.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': ['default-src \'self\'; script-src \'self\' \'unsafe-inline\' \'unsafe-eval\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data: https:; font-src \'self\'; connect-src \'self\' ws: wss: https://ddragon.leagueoflegends.com https://raw.communitydragon.org; frame-ancestors \'none\'; object-src \'none\'; base-uri \'self\'']
        }
      });
    });
  }

  // Hide the default menu bar
  mainWindow.value.setMenuBarVisibility(false);
  mainWindow.value.setAutoHideMenuBar(true);

  // Load the Next.js app
  const appUrl = localhostUrl + "/download";
  console.log(`Loading Electron app from: ${appUrl}`);

  // ⬇ Next.js handler ⬇
  if (!isDev) {
    stopIntercept = await createInterceptor({ session: mainWindow.value.webContents.session });
  }
  // ⬆ Next.js handler ⬆

  mainWindow.value.loadURL(appUrl);

  // Show window when ready to prevent visual flash
  mainWindow.value.once("ready-to-show", () => {
    mainWindow.value.show();

    if (isDev) {
      mainWindow.value.webContents.openDevTools();
    }
  });

  // Add error handling for page load
  mainWindow.value.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
    console.error("Failed to load page:", errorCode, errorDescription, validatedURL);
  });

  // Add console logging from renderer
  mainWindow.value.webContents.on("console-message", (_event, level, message) => {
    console.log(`Renderer [${level}]:`, message);
  });

  // Handle window closed
  mainWindow.value.on("closed", () => {
    mainWindow.value = null;
    stopIntercept?.();
  });

  // Handle external links
  mainWindow.value.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

export { createWindow };
