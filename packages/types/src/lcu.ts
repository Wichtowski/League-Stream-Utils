export interface LCUStatus {
  connected: boolean;
  gameflowPhase?: string;
  inChampSelect?: boolean;
  currentSummoner?: {
    displayName: string;
    puuid: string;
    summonerId: number;
  };
  lastUpdated: Date;
}
