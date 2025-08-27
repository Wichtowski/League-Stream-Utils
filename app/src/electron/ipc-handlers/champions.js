import { ipcMain } from "electron";
import path from "path";
import fs from "fs";

function registerChampionHandlers(_mainWindow, assetsRootPath) {
  ipcMain.handle("save-champions-cache", async (_event, championsData) => {
    try {
      const version = championsData?.version || "unknown";
      const dirPath = path.join(assetsRootPath, version, "champions");
      if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
      const filePath = path.join(dirPath, "champions.json");
      fs.writeFileSync(filePath, JSON.stringify(championsData, null, 2));
      return { success: true, filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("load-champions-cache", async () => {
    try {
      // Attempt to load the newest champions.json from versioned assets
      if (!fs.existsSync(assetsRootPath)) return { success: false, error: "No assets directory" };
      const versions = fs
        .readdirSync(assetsRootPath, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort()
        .reverse();
      for (const v of versions) {
        const candidate = path.join(assetsRootPath, v, "champions", "champions.json");
        if (fs.existsSync(candidate)) {
          const data = JSON.parse(fs.readFileSync(candidate, "utf8"));
          return { success: true, data };
        }
      }
      return { success: false, error: "No cache file found" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("check-file-exists", async (_event, filePath) => {
    try {
      const exists = fs.existsSync(filePath);
      return { success: true, exists };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

export { registerChampionHandlers };
