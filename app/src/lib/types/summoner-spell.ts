export interface DataDragonSummonerSpell {
  id: string;
  name: string;
  description: string;
  tooltip: string;
  maxrank: number;
  cooldown: number[];
  cost: number[];
  range: number[];
  image: {
    full: string;
    sprite: string;
    group: string;
    x: number;
    y: number;
    w: number;
    h: number;
  };
  key: string;
}

export interface DataDragonSummonerResponse {
  data: { [key: string]: DataDragonSummonerSpell };
}

export interface SummonerSpell {
  id: string;
  name: string;
  key: string;
  description: string;
  maxrank: number;
  cooldown: number[];
  cost: number[];
  range: number[];
  image: string;
}

export interface SummonerSpellCacheData {
  id: string;
  name: string;
  key: string;
  description: string;
  maxrank: number;
  cooldown: number[];
  cost: number[];
  range: number[];
  image: string;
}
