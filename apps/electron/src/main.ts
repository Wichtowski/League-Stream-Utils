import { app, BrowserWindow, session } from 'electron';
import { createWindow } from './window';
import { registerAllHandlers } from './ipc';
import { downloadAllAssets } from './download';
import { readConfig } from './ipc/util';

let mainWindow: BrowserWindow | null = null;

const DEV_URL = 'http://localhost:3000';

async function waitForDevServer(url: string, maxAttempts = 60): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  console.warn('[electron] Dev server not responding, opening anyway');
}

app.whenReady().then(async () => {
  registerAllHandlers();

  if (!app.isPackaged) {
    console.log('[electron] Waiting for web dev server...');
    await waitForDevServer(DEV_URL);
    console.log('[electron] Dev server ready');
  }

  mainWindow = createWindow(DEV_URL);

  const cfg = await readConfig();
  if (cfg.appMode === 'offline') {
    const cookieUrl = app.isPackaged ? 'https://app.local' : DEV_URL;
    await session.defaultSession.cookies.set({
      url: cookieUrl,
      name: 'app_mode',
      value: 'offline',
      path: '/',
      sameSite: 'lax',
    });
  }

  downloadAllAssets((progress) => {
    mainWindow?.webContents.send('assets:progress', progress);
  }).catch((err) => console.error('Asset download failed:', err));

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow(DEV_URL);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
