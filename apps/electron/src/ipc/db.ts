import { ipcMain, app } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';

function getBackupsPath() {
  return path.join(app.getPath('userData'), 'backups');
}

function getDataPath() {
  return path.join(app.getPath('userData'), 'data');
}

export function registerDBHandlers() {
  ipcMain.handle('db:collections', async () => {
    const dataDir = getDataPath();
    try {
      const files = await fs.readdir(dataDir);
      return files.filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''));
    } catch {
      return [];
    }
  });

  ipcMain.handle('db:export-collection', async (_e, collection: string) => {
    const filePath = path.join(getDataPath(), `${collection}.json`);
    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  ipcMain.handle('db:create-backup', async () => {
    const backupsDir = getBackupsPath();
    await fs.mkdir(backupsDir, { recursive: true });

    const dataDir = getDataPath();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(backupsDir, timestamp);
    await fs.mkdir(backupDir, { recursive: true });

    try {
      const files = await fs.readdir(dataDir);
      for (const file of files) {
        await fs.copyFile(path.join(dataDir, file), path.join(backupDir, file));
      }
    } catch {
      // data dir may not exist yet
    }

    return { id: timestamp, createdAt: new Date().toISOString() };
  });

  ipcMain.handle('db:get-backups', async () => {
    const backupsDir = getBackupsPath();
    try {
      const entries = await fs.readdir(backupsDir, { withFileTypes: true });
      return entries
        .filter((e) => e.isDirectory())
        .map((e) => ({ id: e.name, createdAt: e.name.replace(/-/g, (m, i) => (i < 19 ? ([10, 13].includes(i) ? ':' : i === 4 || i === 7 ? '-' : m) : m)) }))
        .reverse();
    } catch {
      return [];
    }
  });

  ipcMain.handle('db:restore-backup', async (_e, backupId: string) => {
    const backupDir = path.join(getBackupsPath(), backupId);
    const dataDir = getDataPath();
    await fs.mkdir(dataDir, { recursive: true });

    const files = await fs.readdir(backupDir);
    for (const file of files) {
      await fs.copyFile(path.join(backupDir, file), path.join(dataDir, file));
    }
    return { success: true };
  });

  ipcMain.handle('db:delete-backup', async (_e, backupId: string) => {
    const backupDir = path.join(getBackupsPath(), backupId);
    await fs.rm(backupDir, { recursive: true, force: true });
    return { success: true };
  });
}
