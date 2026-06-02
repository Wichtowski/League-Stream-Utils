import { ipcMain, app } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';

function getAssetsPath() {
  return path.join(app.getPath('userData'), 'assets');
}

export function registerAssetHandlers() {
  ipcMain.handle('assets:download', async (_e, url: string, destPath: string) => {
    const fullPath = path.join(getAssetsPath(), destPath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    const response = await fetch(url);
    if (!response.ok || !response.body) {
      throw new Error(`Download failed: ${response.status}`);
    }

    const fileStream = createWriteStream(fullPath);
    // @ts-expect-error Node stream compatibility
    await pipeline(response.body, fileStream);
    return { path: fullPath };
  });

  ipcMain.handle('assets:exists', async (_e, filePath: string) => {
    try {
      const fullPath = path.join(getAssetsPath(), filePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle('assets:cache-stats', async () => {
    const assetsDir = getAssetsPath();
    try {
      await fs.access(assetsDir);
    } catch {
      return { totalFiles: 0, totalSize: 0 };
    }

    let totalFiles = 0;
    let totalSize = 0;

    async function walk(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(full);
        } else {
          totalFiles++;
          const stat = await fs.stat(full);
          totalSize += stat.size;
        }
      }
    }

    await walk(assetsDir);
    return { totalFiles, totalSize };
  });

  ipcMain.handle('assets:clear-cache', async () => {
    const assetsDir = getAssetsPath();
    try {
      await fs.rm(assetsDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
    return { success: true };
  });

  ipcMain.handle('assets:check-integrity', async () => {
    const assetsDir = getAssetsPath();
    const results = { valid: 0, corrupted: 0, missing: 0, corruptedFiles: [] as string[] };

    try {
      await fs.access(assetsDir);
    } catch {
      return results;
    }

    async function check(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await check(full);
        } else {
          try {
            const stat = await fs.stat(full);
            if (stat.size === 0) {
              results.corrupted++;
              results.corruptedFiles.push(path.relative(assetsDir, full));
            } else {
              results.valid++;
            }
          } catch {
            results.missing++;
          }
        }
      }
    }

    await check(assetsDir);
    return results;
  });

  ipcMain.handle('assets:list-tree', async () => {
    const assetsDir = getAssetsPath();
    try {
      await fs.access(assetsDir);
    } catch {
      return [];
    }

    interface TreeNode {
      name: string;
      type: 'file' | 'directory';
      size?: number;
      children?: TreeNode[];
    }

    async function buildTree(dir: string): Promise<TreeNode[]> {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const nodes: TreeNode[] = [];
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          nodes.push({ name: entry.name, type: 'directory', children: await buildTree(full) });
        } else {
          const stat = await fs.stat(full);
          nodes.push({ name: entry.name, type: 'file', size: stat.size });
        }
      }
      return nodes.sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'directory' ? -1 : 1));
    }

    return buildTree(assetsDir);
  });
}
