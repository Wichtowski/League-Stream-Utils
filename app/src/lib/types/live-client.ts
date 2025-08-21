export type TeamSideLCU = "ORDER" | "CHAOS";

export interface RiotAbility {
  abilityLevel?: number;
  displayName: string;
  id: string;
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

export interface RiotGameEvent {
  EventID: number;
  EventName: string;
  EventTime: number;
}

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
