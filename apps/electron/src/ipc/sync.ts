import { ipcMain, BrowserWindow } from 'electron';
import { SyncManager } from '../sync';

let syncManager: SyncManager | null = null;

function getManager(): SyncManager {
  if (!syncManager) {
    syncManager = new SyncManager();
    syncManager.onProgress((progress) => {
      for (const win of BrowserWindow.getAllWindows()) {
        win.webContents.send('sync:progress', progress);
      }
    });
  }
  return syncManager;
}

export function registerSyncHandlers() {
  ipcMain.handle('sync:push', async () => {
    return getManager().push();
  });

  ipcMain.handle('sync:pull', async () => {
    return getManager().pull();
  });

  ipcMain.handle('sync:full', async () => {
    return getManager().fullSync();
  });

  ipcMain.handle('sync:status', async () => {
    return getManager().getStatus();
  });

  ipcMain.handle('sync:reset', async () => {
    await getManager().resetSync();
    return { success: true };
  });
}
