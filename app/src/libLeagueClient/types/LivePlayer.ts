

export interface SummonerSpell {
  displayName: string;
  rawDescription: string;
}

export interface LivePlayer {
  summonerName: string;
  championName: string;
  team: "ORDER" | "CHAOS";
  position: string;
  scores: {
    kills: number;
    deaths: number;
    assists: number;
    creepScore: number;
    visionScore: number;
  };
  items: LiveItem[];
  level: number;
  gold: number;
  health?: number;
  maxHealth?: number;
  summonerSpells: {
    summonerSpellOne: SummonerSpell;
    summonerSpellTwo: SummonerSpell;
  };
  runes: {
    keystone: string;
    primaryRuneTree: string;
    secondaryRuneTree: string;
  };
}

export interface LiveItem {
  itemID: number;
  name: string;
  count: number;
  price: number;
}

