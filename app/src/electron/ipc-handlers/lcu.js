/* eslint-disable-next-line @typescript-eslint/no-require-imports */
import { ipcMain } from "electron";

function registerLCUHandlers(lcuDataRef, useMockDataRef, broadcastLCUDataUpdate, broadcastMockDataToggle) {
  // Removed unused get-lcu-data handler

  ipcMain.handle("update-lcu-data", async (event, data) => {
    lcuDataRef.value = { ...lcuDataRef.value, ...data };
    broadcastLCUDataUpdate();
    return { success: true };
  });

  ipcMain.handle("set-mock-data", async (event, enabled) => {
    useMockDataRef.value = enabled;
    broadcastMockDataToggle();
    return { success: true };
  });
}

export { registerLCUHandlers };
