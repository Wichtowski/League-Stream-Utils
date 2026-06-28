import type { DownloadProgress } from "./base";
import { ChampionDownloadManager } from "./champions";
import { getLatestVersion } from "./constants";
import { ItemDownloadManager } from "./items";
import { RuneDownloadManager } from "./runes";
import { SummonerSpellDownloadManager } from "./summoner-spells";

export type { DownloadProgress };

export async function downloadAllAssets(
  onProgress?: (progress: DownloadProgress) => void,
): Promise<void> {
  const version = await getLatestVersion();
  console.log(`[download] DDragon version: ${version}`);

  const managers = [
    new ChampionDownloadManager(),
    new ItemDownloadManager(),
    new RuneDownloadManager(),
    new SummonerSpellDownloadManager(),
  ];

  for (const mgr of managers) {
    if (onProgress) mgr.setProgressCallback(onProgress);
  }

  // Run champions first (largest), then the rest in parallel
  const [champions, ...rest] = managers;

  await Promise.all([champions!.download(version), ...rest.map((m) => m.download(version))]);

  console.log("[download] All assets downloaded");
}
