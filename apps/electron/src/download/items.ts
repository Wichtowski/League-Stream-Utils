import { BaseDownloadManager } from './base';
import { DDRAGON_CDN } from './constants';

interface DDItemEntry {
  name: string;
  image: { full: string };
  gold: { total: number; base: number; sell: number; purchasable: boolean };
  into?: string[];
  from?: string[];
}

export class ItemDownloadManager extends BaseDownloadManager {
  readonly category = 'items';

  async download(version: string): Promise<void> {
    this.progress({ stage: 'fetching item list', itemName: 'item.json' });

    const url = `${DDRAGON_CDN}/${version}/data/en_US/item.json`;
    const data = await this.fetchJson<{ data: Record<string, DDItemEntry> }>(url);
    const ids = Object.keys(data.data);

    const manifest = await this.loadManifest(version);
    const completed = new Set(manifest?.completedItems ?? []);
    const missing = ids.filter((id) => !completed.has(id));

    if (missing.length === 0) {
      this.progress({
        stage: 'complete',
        current: ids.length,
        total: ids.length,
        itemName: 'all cached',
      });
      return;
    }

    const dir = this.resolvePath(version, 'items');
    const tasks = missing.map((id) => ({
      url: `${DDRAGON_CDN}/${version}/img/item/${id}.png`,
      dest: `${dir}/${id}.png`,
      label: id,
    }));

    const total = ids.length;
    let current = total - missing.length;

    for (let i = 0; i < tasks.length; i += 20) {
      const batch = tasks.slice(i, i + 20);
      await this.downloadBatch(batch, 10);
      batch.forEach((t) => completed.add(t.label));
      current += batch.length;
      this.progress({ stage: 'downloading', current, total, itemName: `${batch.length} items` });
      await this.saveManifest(version, [...completed]);
    }

    // Save item data JSON
    const dataPath = this.resolvePath(version, 'items', 'items.json');
    await this.ensureDir(this.resolvePath(version, 'items'));
    const { writeFile } = await import('node:fs/promises');
    await writeFile(dataPath, JSON.stringify(data.data), 'utf-8');

    this.progress({ stage: 'complete', current: total, total, itemName: 'done' });
  }
}
