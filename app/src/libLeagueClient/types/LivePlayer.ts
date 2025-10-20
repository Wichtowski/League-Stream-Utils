export interface SummonerSpell {
  displayName: string;
  rawDescription: string;
}

export interface LivePlayer {
  summonerName: string;
  championName: string;
  team: "ORDER" | "CHAOS";
  riotIdGameName: string;
  riotIdTag: string;
  position: string;
  scores: {
    kills: number;
    deaths: number;
    assists: number;
    creepScore: number;
    wardScore: number;
  };
  items: LiveItem[];
  level: number;
  gold: number;
  currentHealth: number;
  maxHealth: number;
  respawnTimer: number;
  isDead: boolean;
  resourceType?: string;
  resourceValue?: number;
  resourceMax?: number;
  summonerSpells: {
    summonerSpellOne: SummonerSpell;
    summonerSpellTwo: SummonerSpell;
  };
  runes: {
    keystone: string;
    primaryRuneTree: string;
    secondaryRuneTree: string;
  };
  liveInfo?: {
    currentGold?: number;
    championStats?: {
      resourceType?: string;
      resourceValue?: number;
      maxHealth?: number;
      currentHealth?: number;
    };
    timestamp?: number;
  };
}

export interface LiveItem {
  itemID: number;
  name: string;
  count: number;
  price: number;
  slot: number;
}
