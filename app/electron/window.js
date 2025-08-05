/* eslint-disable @typescript-eslint/no-require-imports */
const { BrowserWindow, shell } = require("electron");
const path = require("path");
const isDev = process.env.NODE_ENV === "development";
/* eslint-enable @typescript-eslint/no-require-imports */

function createWindow(mainWindow) {
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
    },
    icon: path.join(__dirname, "../public/favicon.ico"),
    titleBarStyle: "default",
    show: false, // Don't show until ready
  });

  // Hide the default menu bar
  mainWindow.value.setMenuBarVisibility(false);
  mainWindow.value.setAutoHideMenuBar(true);

  // Load the Next.js app
  const port = process.env.PORT || 2137;

  // If running on Windows and connecting to WSL, use the WSL network IP
  let hostname = "localhost";
  if (process.platform === "win32" && process.env.WSL_HOST) {
    hostname = process.env.WSL_HOST;
  }

  // Always use development server in development mode
  const appUrl = `http://${hostname}:${port}/download/assets`;

  console.log(`Loading Electron app from: ${appUrl}`);
  console.log("Development mode: loading from Next.js development server");
  mainWindow.value.loadURL(appUrl);

  // Show window when ready to prevent visual flash
  mainWindow.value.once("ready-to-show", () => {
    mainWindow.value.show();

    if (isDev) {
      mainWindow.value.webContents.openDevTools();
    }
  });

  // Add error handling for page load
  mainWindow.value.webContents.on(
    "did-fail-load",
    (_event, errorCode, errorDescription, validatedURL) => {
      console.error(
        "Failed to load page:",
        errorCode,
        errorDescription,
        validatedURL,
      );
    },
  );

  // Add console logging from renderer
  mainWindow.value.webContents.on(
    "console-message",
    (_event, level, message) => {
      console.log(`Renderer [${level}]:`, message);
    },
  );

  // Handle window closed
  mainWindow.value.on("closed", () => {
    mainWindow.value = null;
    // Removed nextProcess.kill() logic as nextProcess is not used
  });

  // Handle external links
  mainWindow.value.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

module.exports = { createWindow };
