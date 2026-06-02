import { ipcMain, app } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';

function getCachePath() {
  return path.join(app.getPath('userData'), 'cache', 'champions');
}

export function registerChampionHandlers() {
  ipcMain.handle('champions:save-cache', async (_e, version: string, data: unknown) => {
    const dir = path.join(getCachePath(), version);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, 'champions.json'), JSON.stringify(data), 'utf-8');
    return { success: true };
  });

  ipcMain.handle('champions:load-cache', async () => {
    const cacheDir = getCachePath();
    try {
      await fs.access(cacheDir);
    } catch {
      return null;
    }

    const versions = await fs.readdir(cacheDir, { withFileTypes: true });
    const dirs = versions
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort()
      .reverse();

    if (dirs.length === 0) return null;

    const filePath = path.join(cacheDir, dirs[0], 'champions.json');
    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      return { version: dirs[0], data: JSON.parse(raw) };
    } catch {
      return null;
    }
  });
}
