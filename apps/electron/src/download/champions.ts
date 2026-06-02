import { BaseDownloadManager } from './base';
import { DDRAGON_CDN } from './constants';

interface DDChampionEntry {
  id: string;
  key: string;
  name: string;
  image: { full: string };
  spells: Array<{ id: string; image: { full: string } }>;
  passive: { image: { full: string } };
}

const RECAST_CHAMPIONS: Record<string, string[]> = {
  Aatrox: ['AatroxQ2', 'AatroxQ3'],
  Riven: ['RivenTriCleave2', 'RivenTriCleave3'],
  Yasuo: ['YasuoQ2', 'YasuoQ3'],
  Yone: ['YoneQ3'],
  Katarina: ['KatarinaEDagger'],
  KhaZix: ['KhaZixQEvo', 'KhaZixWEvo', 'KhaZixEEvo', 'KhaZixREvo'],
  Kassadin: ['KassadinRStack2', 'KassadinRStack3', 'KassadinRStack4'],
};

export class ChampionDownloadManager extends BaseDownloadManager {
  readonly category = 'champions';

  async download(version: string): Promise<void> {
    this.progress({ stage: 'fetching champion list', itemName: 'champions.json' });

    const listUrl = `${DDRAGON_CDN}/${version}/data/en_US/champion.json`;
    const list = await this.fetchJson<{
      data: Record<string, { id: string; key: string; name: string }>;
    }>(listUrl);
    const keys = Object.keys(list.data);

    const manifest = await this.loadManifest(version);
    const completed = new Set(manifest?.completedItems ?? []);
    const missing = keys.filter((k) => !completed.has(k));

    if (missing.length === 0) {
      this.progress({
        stage: 'complete',
        current: keys.length,
        total: keys.length,
        itemName: 'all cached',
      });
      return;
    }

    const total = keys.length;
    let current = total - missing.length;

    for (const key of missing) {
      current++;
      this.progress({ stage: 'downloading', current, total, itemName: key });
      await this.downloadChampion(key, version);
      completed.add(key);
      await this.saveManifest(version, [...completed]);
    }

    this.progress({ stage: 'complete', current: total, total, itemName: 'done' });
  }

  private async downloadChampion(key: string, version: string): Promise<void> {
    const detailUrl = `${DDRAGON_CDN}/${version}/data/en_US/champion/${key}.json`;
    const detail = await this.fetchJson<{ data: Record<string, DDChampionEntry> }>(detailUrl);
    const champ = detail.data[key]!;
    const dir = this.resolvePath(version, 'champions', key);

    const tasks = [
      {
        url: `${DDRAGON_CDN}/${version}/img/champion/${champ.image.full}`,
        dest: `${dir}/square.png`,
        label: `${key}/square`,
      },
      {
        url: `${DDRAGON_CDN}/img/champion/splash/${key}_0.jpg`,
        dest: `${dir}/splash.jpg`,
        label: `${key}/splash`,
      },
      {
        url: `${DDRAGON_CDN}/img/champion/loading/${key}_0.jpg`,
        dest: `${dir}/loading.jpg`,
        label: `${key}/loading`,
      },
      {
        url: `${DDRAGON_CDN}/img/champion/centered/${key}_0.jpg`,
        dest: `${dir}/splashCentered.jpg`,
        label: `${key}/splashCentered`,
      },
    ];

    // Passive
    tasks.push({
      url: `${DDRAGON_CDN}/${version}/img/passive/${champ.passive.image.full}`,
      dest: `${dir}/passive.png`,
      label: `${key}/passive`,
    });

    // Spells (Q W E R)
    const slotNames = ['Q', 'W', 'E', 'R'];
    champ.spells.forEach((spell, i) => {
      tasks.push({
        url: `${DDRAGON_CDN}/${version}/img/spell/${spell.image.full}`,
        dest: `${dir}/${slotNames[i]}.png`,
        label: `${key}/${slotNames[i]}`,
      });
    });

    // Recast variants
    const recasts = RECAST_CHAMPIONS[key];
    if (recasts) {
      for (const spellId of recasts) {
        tasks.push({
          url: `${DDRAGON_CDN}/${version}/img/spell/${spellId}.png`,
          dest: `${dir}/${spellId}.png`,
          label: `${key}/${spellId}`,
        });
      }
    }

    await this.downloadBatch(tasks, 6);
  }
}
