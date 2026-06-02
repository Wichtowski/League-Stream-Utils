import { ipcMain, app } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';

function configPath() {
  return path.join(app.getPath('userData'), 'config.json');
}

export async function readConfig(): Promise<Record<string, unknown>> {
  try {
    const raw = await fs.readFile(configPath(), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeConfig(data: Record<string, unknown>): Promise<void> {
  await fs.writeFile(configPath(), JSON.stringify(data, null, 2), 'utf-8');
}

export function registerUtilHandlers() {
  ipcMain.handle('util:user-data-path', () => app.getPath('userData'));
  ipcMain.handle('util:app-version', () => app.getVersion());
  ipcMain.handle('util:platform', () => process.platform);

  ipcMain.handle('util:get-app-mode', async () => {
    const cfg = await readConfig();
    return (cfg.appMode as string) ?? null;
  });

  ipcMain.handle('util:set-app-mode', async (_e, mode: string) => {
    const cfg = await readConfig();
    cfg.appMode = mode;
    await writeConfig(cfg);
  });
}
