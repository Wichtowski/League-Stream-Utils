import { BaseDownloadManager } from "./base";
import { DDRAGON_CDN } from "./constants";

interface DDSummonerSpell {
  id: string;
  key: string;
  name: string;
  image: { full: string };
}

export class SummonerSpellDownloadManager extends BaseDownloadManager {
  readonly category = "spells";

  async download(version: string): Promise<void> {
    this.progress({ stage: "fetching spell list", itemName: "summoner.json" });

    const url = `${DDRAGON_CDN}/${version}/data/en_US/summoner.json`;
    const data = await this.fetchJson<{ data: Record<string, DDSummonerSpell> }>(url);
    const spells = Object.values(data.data);

    const manifest = await this.loadManifest(version);
    const completed = new Set(manifest?.completedItems ?? []);
    const missing = spells.filter((s) => !completed.has(s.id));

    if (missing.length === 0) {
      this.progress({
        stage: "complete",
        current: spells.length,
        total: spells.length,
        itemName: "all cached",
      });

      return;
    }

    const dir = this.resolvePath(version, "spells");
    const tasks = missing.map((spell) => ({
      url: `${DDRAGON_CDN}/${version}/img/spell/${spell.image.full}`,
      dest: `${dir}/${spell.id}.png`,
      label: spell.id,
    }));

    await this.downloadBatch(tasks, 8);
    tasks.forEach((t) => completed.add(t.label));
    await this.saveManifest(version, [...completed]);

    // Save spell data
    const dataPath = this.resolvePath(version, "spells", "summoner.json");
    await this.ensureDir(dir);
    const { writeFile } = await import("node:fs/promises");
    await writeFile(dataPath, JSON.stringify(data.data), "utf-8");

    this.progress({
      stage: "complete",
      current: spells.length,
      total: spells.length,
      itemName: "done",
    });
  }
}
