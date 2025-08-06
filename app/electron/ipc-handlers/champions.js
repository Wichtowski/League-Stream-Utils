import https from "https";
import { ipcMain } from "electron";
import path from "path";
import fs from "fs";

function registerChampionHandlers(mainWindow, championsPath, userDataPath) {
  ipcMain.handle("save-champions-cache", async (event, championsData) => {
    try {
      const filePath = path.join(championsPath, "champions.json");
      fs.writeFileSync(filePath, JSON.stringify(championsData, null, 2));
      return { success: true, filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("load-champions-cache", async () => {
    try {
      const filePath = path.join(championsPath, "champions.json");
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
        return { success: true, data };
      }
      return { success: false, error: "No cache file found" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("get-champion-cache-path", async () => {
    try {
      const championCachePath = path.join(userDataPath, "champions");
      if (!fs.existsSync(championCachePath)) {
        fs.mkdirSync(championCachePath, { recursive: true });
      }
      return { success: true, cachePath: championCachePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("check-file-exists", async (event, filePath) => {
    try {
      const exists = fs.existsSync(filePath);
      return { success: true, exists };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("load-champion-data", async (event, filePath) => {
    try {
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
        return { success: true, data };
      }
      return { success: false, error: "File not found" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("save-champion-data", async (event, filePath, data) => {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("create-champion-directory", async (event, dirPath) => {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("download-champion-image", async (event, url, localPath) => {
    try {
      if (fs.existsSync(localPath)) {
        return { success: true, localPath };
      }
      return new Promise((resolve) => {
        const file = fs.createWriteStream(localPath);
        https
          .get(url, (response) => {
            if (response.statusCode === 200) {
              response.pipe(file);
              file.on("finish", () => {
                file.close();
                resolve({ success: true, localPath });
              });
            } else {
              file.close();
              fs.unlinkSync(localPath);
              resolve({ success: false, error: `HTTP ${response.statusCode}` });
            }
          })
          .on("error", (err) => {
            file.close();
            if (fs.existsSync(localPath)) {
              fs.unlinkSync(localPath);
            }
            resolve({ success: false, error: err.message });
          });
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("clear-champion-cache", async (event, cacheDir) => {
    try {
      if (fs.existsSync(cacheDir)) {
        fs.rmSync(cacheDir, { recursive: true, force: true });
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("get-champion-cache-stats", async (event, cacheDir) => {
    try {
      if (!fs.existsSync(cacheDir)) {
        return { success: true, totalChampions: 0, cacheSize: 0 };
      }
      let totalChampions = 0;
      let cacheSize = 0;
      function calculateStats(dirPath) {
        const items = fs.readdirSync(dirPath);
        for (const item of items) {
          const itemPath = path.join(dirPath, item);
          const stat = fs.statSync(itemPath);
          if (stat.isDirectory()) {
            if (item === "champions") {
              const championDirs = fs.readdirSync(itemPath);
              totalChampions += championDirs.length;
            }
            calculateStats(itemPath);
          } else {
            cacheSize += stat.size;
          }
        }
      }
      calculateStats(cacheDir);
      return {
        success: true,
        totalChampions,
        cacheSize: formatBytes(cacheSize),
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export { registerChampionHandlers };
