export interface DataDragonSummonerSpell {
  _id: string;
  name: string;
  description: string;
  cooldown: number[];
  cost: number[];
  range: number[];
  maxrank: number;
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
  _id: string;
  name: string;
  description: string;
  cooldown: number[];
  cost: number[];
  range: number[];
  maxrank: number;
  image: string;
  key: string;
}

export interface SummonerSpellCacheData {
  _id: string;
  name: string;
  description: string;
  cooldown: number[];
  cost: number[];
  range: number[];
  maxrank: number;
  image: string;
  key: string;
}
