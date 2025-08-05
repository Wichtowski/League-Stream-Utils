export interface DownloadProgress {
  current: number;
  total: number;
  itemName: string;
  stage: string;
  percentage: number;
  assetType?:
    | "champion"
    | "champion-data"
    | "champion-images"
    | "ability-images"
    | "item-data"
    | "item-images"
    | "spell-data"
    | "spell-images"
    | "rune-data"
    | "rune-images";
  currentAsset?: string;
}

export type ChampionDownloadProgress = DownloadProgress & {
  championName?: string;
};
