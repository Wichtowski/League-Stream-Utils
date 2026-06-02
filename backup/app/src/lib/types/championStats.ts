// Champion Statistics for tournaments
export interface ChampionStats {
  championId: number;
  championName: string;
  championKey: string;
  image: string;

  totalPicks: number;
  totalBans: number;
  blueSidePicks: number;
  blueSideBans: number;
  redSidePicks: number;
  redSideBans: number;

  wins: number;
  losses: number;

  pickRate: number;
  banRate: number;
  presenceRate: number;

  roleDistribution: {
    TOP: number;
    JUNGLE: number;
    MID: number;
    BOTTOM: number;
    SUPPORT: number;
  };

  lastUpdated: Date;
}
