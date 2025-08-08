/* eslint-disable-next-line @typescript-eslint/no-require-imports */
import { ipcMain } from 'electron';

function registerLCUHandlers(lcuDataRef, useMockDataRef, broadcastLCUDataUpdate, broadcastMockDataToggle) {
    ipcMain.handle('get-lcu-data', async () => {
        return {
            ...lcuDataRef.value,
            useMockData: useMockDataRef.value
        };
    });

    ipcMain.handle('update-lcu-data', async (event, data) => {
        lcuDataRef.value = { ...lcuDataRef.value, ...data };
        broadcastLCUDataUpdate();
        return { success: true };
    });

    ipcMain.handle('set-mock-data', async (event, enabled) => {
        useMockDataRef.value = enabled;
        broadcastMockDataToggle();
        return { success: true };
    });
}

export { registerLCUHandlers };
