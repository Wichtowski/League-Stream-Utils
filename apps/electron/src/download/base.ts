import { app } from 'electron';
import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

export interface DownloadProgress {
  category: string;
  current: number;
  total: number;
  itemName: string;
  stage: string;
  percentage: number;
}

export type ProgressCallback = (progress: DownloadProgress) => void;

export interface Manifest {
  version: string;
  completedItems: string[];
  updatedAt: number;
}

export abstract class BaseDownloadManager {
  protected assetsDir: string;
  protected onProgress: ProgressCallback | null = null;

  constructor() {
    this.assetsDir = path.join(app.getPath('userData'), 'assets');
  }

  abstract readonly category: string;

  setProgressCallback(cb: ProgressCallback) {
    this.onProgress = cb;
  }

  abstract download(version: string): Promise<void>;

  protected progress(p: Partial<DownloadProgress>) {
    this.onProgress?.({
      category: this.category,
      current: p.current ?? 0,
      total: p.total ?? 0,
      itemName: p.itemName ?? '',
      stage: p.stage ?? 'downloading',
      percentage: p.total ? Math.round(((p.current ?? 0) / p.total) * 100) : 0,
    });
  }

  protected resolvePath(...segments: string[]): string {
    return path.join(this.assetsDir, ...segments);
  }

  protected async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  protected async ensureDir(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true });
  }

  protected async downloadFile(url: string, dest: string): Promise<void> {
    await this.ensureDir(path.dirname(dest));
    const res = await fetch(url);
    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}: ${url}`);
    const ws = createWriteStream(dest);
    // @ts-expect-error Node ReadableStream compat
    await pipeline(res.body, ws);
  }

  protected async downloadBatch(
    tasks: Array<{ url: string; dest: string; label: string }>,
    concurrency = 8,
  ): Promise<{ downloaded: number; failed: string[] }> {
    let downloaded = 0;
    const failed: string[] = [];
    const total = tasks.length;

    for (let i = 0; i < total; i += concurrency) {
      const batch = tasks.slice(i, i + concurrency);
      const results = await Promise.allSettled(
        batch.map(async (t) => {
          if (await this.exists(t.dest)) return;
          await this.downloadFile(t.url, t.dest);
        }),
      );
      results.forEach((r, idx) => {
        if (r.status === 'fulfilled') downloaded++;
        else failed.push(batch[idx]!.label);
      });
    }

    return { downloaded, failed };
  }

  protected async loadManifest(version: string): Promise<Manifest | null> {
    const p = this.resolvePath(version, `${this.category}-manifest.json`);
    try {
      const raw = await fs.readFile(p, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  protected async saveManifest(version: string, completedItems: string[]): Promise<void> {
    const p = this.resolvePath(version, `${this.category}-manifest.json`);
    await this.ensureDir(path.dirname(p));
    const manifest: Manifest = { version, completedItems, updatedAt: Date.now() };
    await fs.writeFile(p, JSON.stringify(manifest), 'utf-8');
  }

  protected async fetchJson<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
    return res.json() as Promise<T>;
  }
}
