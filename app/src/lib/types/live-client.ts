export type TeamSideLCU = "ORDER" | "CHAOS";

export interface RiotAbility {
  abilityLevel?: number;
  displayName: string;
  _id: string;
  rawDescription: string;
  rawDisplayName: string;
}

export interface RiotAbilities {
  Q: RiotAbility;
  W: RiotAbility;
  E: RiotAbility;
  R: RiotAbility;
  Passive: Omit<RiotAbility, "abilityLevel"> & { abilityLevel?: number };
}

export interface RiotChampionStats {
  abilityPower: number;
  armor: number;
  armorPenetrationFlat: number;
  armorPenetrationPercent: number;
  attackDamage: number;
  attackRange: number;
  attackSpeed: number;
  bonusArmorPenetrationPercent: number;
  bonusMagicPenetrationPercent: number;
  cooldownReduction: number;
  critChance: number;
  critDamage: number;
  currentHealth: number;
  healthRegenRate: number;
  lifeSteal: number;
  magicLethality: number;
  magicPenetrationFlat: number;
  magicPenetrationPercent: number;
  magicResist: number;
  maxHealth: number;
  moveSpeed: number;
  physicalLethality: number;
  resourceMax: number;
  resourceRegenRate: number;
  resourceType: string;
  resourceValue: number;
  spellVamp: number;
  tenacity: number;
}

export interface RiotRuneSimple {
  displayName: string;
  id: number;
  rawDescription: string;
  rawDisplayName: string;
}

export interface RiotRuneTree {
  displayName: string;
  id: number;
  rawDescription: string;
  rawDisplayName: string;
}

export interface RiotStatRune {
  id: number;
  rawDescription: string;
}

export interface RiotFullRunes {
  generalRunes: RiotRuneSimple[];
  keystone: RiotRuneSimple;
  primaryRuneTree: RiotRuneTree;
  secondaryRuneTree: RiotRuneTree;
  statRunes: RiotStatRune[];
}

export interface RiotActivePlayer {
  abilities: RiotAbilities;
  championStats: RiotChampionStats;
  currentGold: number;
  fullRunes: RiotFullRunes;
  level: number;
  summonerName: string;
}

export interface RiotSummonerSpell {
  displayName: string;
  rawDescription: string;
  rawDisplayName: string;
}

export interface RiotPlayerRunes {
  keystone: RiotRuneSimple;
  primaryRuneTree: RiotRuneTree;
  secondaryRuneTree: RiotRuneTree;
}

export interface RiotItem {
  itemID?: number;
  name?: string;
  count?: number;
}

export interface RiotAllPlayer {
  championName: string;
  isBot: boolean;
  isDead: boolean;
  items: RiotItem[];
  level: number;
  position: string;
  rawChampionName: string;
  respawnTimer: number;
  runes: RiotPlayerRunes;
  scores: {
    assists: number;
    creepScore: number;
    deaths: number;
    kills: number;
    wardScore: number;
  };
  skinID: number;
  summonerName: string;
  summonerSpells: {
    summonerSpellOne: RiotSummonerSpell;
    summonerSpellTwo: RiotSummonerSpell;
  };
  team: TeamSideLCU;
}



interface BaseGameEvent {
  EventID: number;
  EventTime: number;
}

interface ObjectiveGameEvent extends BaseGameEvent {
  EventName: "DragonKill" | "HeraldKill" | "BaronKill" | "InhibKilled" | "FirstBrick" | "TurretKilled" | "GameStart" | "MinionsSpawning" | "HordeKill" | "Multikill" | "Ace" | "ChampionKill" | "AtakhanKill";
  DragonType?: "Earth" | "Elder" | "Fire" | "Water" | "Air" | "Chemtech" | "Hextech";
  Stolen?: boolean | string;
  KillerName?: string;
  Assisters?: string[];
  TurretKilled?: string;
  InhibKilled?: string;
  Multikill?: number;
  KillStreak?: number;
  Ace?: string;
  AcingTeam?: "ORDER" | "CHAOS";
  ChampionKill?: string;
  VictimName?: string;
}


export type RiotGameEvent = ObjectiveGameEvent;

export interface RiotEventsWrapper {
  Events: RiotGameEvent[];
}

export interface RiotGameDataMeta {
  gameMode: string;
  gameTime: number;
  mapName: string;
  mapNumber: number;
  mapTerrain: string;
}

export interface RiotLiveClientData {
  activePlayer: RiotActivePlayer;
  allPlayers: RiotAllPlayer[];
  events: RiotEventsWrapper;
  gameData: RiotGameDataMeta;
}
