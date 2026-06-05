import { BaseDownloadManager } from "./base";
import { CDRAGON_RAW, DDRAGON_CDN } from "./constants";

interface CDragonRune {
  id: number;
  name: string;
  iconPath: string;
}

export class RuneDownloadManager extends BaseDownloadManager {
  readonly category = "runes";

  async download(version: string): Promise<void> {
    this.progress({ stage: "fetching rune data", itemName: "perks.json" });

    const url = `${CDRAGON_RAW}/plugins/rcp-be-lol-game-data/global/default/v1/perks.json`;
    const runes = await this.fetchJson<CDragonRune[]>(url);
    const filtered = runes.filter((r) => !r.iconPath.includes("7000.png"));

    const manifest = await this.loadManifest(version);
    const completed = new Set(manifest?.completedItems ?? []);
    const missing = filtered.filter((r) => !completed.has(String(r.id)));

    if (missing.length === 0) {
      this.progress({
        stage: "complete",
        current: filtered.length,
        total: filtered.length,
        itemName: "all cached",
      });

      return;
    }

    const dir = this.resolvePath(version, "runes");
    const total = filtered.length;
    let current = total - missing.length;

    const tasks = missing.map((rune) => {
      const fileName = rune.iconPath.split("/").pop()!.toLowerCase();

      return {
        url: `${DDRAGON_CDN}/img/perk-images/${fileName}`,
        dest: `${dir}/${rune.id}.png`,
        label: String(rune.id),
      };
    });

    for (let i = 0; i < tasks.length; i += 24) {
      const batch = tasks.slice(i, i + 24);
      await this.downloadBatch(batch, 8);
      batch.forEach((t) => completed.add(t.label));
      current += batch.length;
      this.progress({ stage: "downloading", current, total, itemName: `${batch.length} runes` });
      await this.saveManifest(version, [...completed]);
    }

    // Save rune data
    const dataPath = this.resolvePath(version, "runes", "runes.json");
    await this.ensureDir(dir);
    const { writeFile } = await import("node:fs/promises");
    await writeFile(dataPath, JSON.stringify(filtered), "utf-8");

    this.progress({ stage: "complete", current: total, total, itemName: "done" });
  }
}
