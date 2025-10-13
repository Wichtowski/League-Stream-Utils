import { BaseCacheService } from "@lib/services/assets/base";

type StyleEntry = {
  id: number;
  key: string;
  filename: string;
};

export class RuneStylesDownloader extends BaseCacheService<void> {
  private readonly CDN_BASE: string =
    "https://raw.communitydragon.org/15.20/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/styles";

  private getStylesList(): StyleEntry[] {
    return [
      { id: 7200, key: "domination", filename: "7200_domination.png" },
      { id: 7201, key: "precision", filename: "7201_precision.png" },
      { id: 7202, key: "sorcery", filename: "7202_sorcery.png" },
      { id: 7203, key: "whimsy", filename: "7203_whimsy.png" },
      { id: 7204, key: "resolve", filename: "7204_resolve.png" }
    ];
  }

  async download(): Promise<void> {
    await this.initialize();

    const version = await this.getLatestVersion();
    const destBase = `${version}/runes`;

    const tasks = this.getStylesList().map((s) => ({
      url: `${this.CDN_BASE}/${encodeURIComponent(s.filename)}`,
      category: "assets",
      assetKey: `${destBase}/${s.filename.toLowerCase()}`
    }));

    this.updateProgress({
      current: 0,
      total: tasks.length,
      itemName: "rune-styles",
      stage: "downloading",
      assetType: "rune-images",
      currentAsset: "Downloading rune style images"
    });

    const result = await this.downloadAssetsParallel(tasks);

    this.updateProgress({
      current: result.downloaded,
      total: result.total,
      itemName: "rune-styles",
      stage: result.downloaded === result.total ? "complete" : "error",
      assetType: "rune-images",
      currentAsset: result.downloaded === result.total ? "Rune styles downloaded" : "Some styles failed"
    });
  }

  async getAll(): Promise<void[]> {
    return [];
  }

  async getById(_id: string): Promise<void | null> {
    return null;
  }
}

export const runeStylesDownloader = new RuneStylesDownloader();


