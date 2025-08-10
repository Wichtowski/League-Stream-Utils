import { ipcMain } from "electron";
import path from "path";
import fs from "fs";

function registerChampionHandlers(mainWindow, championsPath) {
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

  ipcMain.handle("check-file-exists", async (event, filePath) => {
    try {
      const exists = fs.existsSync(filePath);
      return { success: true, exists };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

export { registerChampionHandlers };
