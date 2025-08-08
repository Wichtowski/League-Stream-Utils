import { ipcMain, dialog } from "electron";
import path from "path";
import fs from "fs";

function registerTournamentHandlers(mainWindow, tournamentsPath) {
  ipcMain.handle("save-tournament-file", async (event, tournamentData) => {
    try {
      const result = await dialog.showSaveDialog(mainWindow, {
        filters: [{ name: "Tournament Files", extensions: ["json"] }],
        defaultPath: path.join(tournamentsPath, `${tournamentData.name || "tournament"}.json`)
      });

      if (!result.canceled) {
        fs.writeFileSync(result.filePath, JSON.stringify(tournamentData, null, 2));
        return { success: true, filePath: result.filePath };
      }
      return { success: false, cancelled: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

export { registerTournamentHandlers };
