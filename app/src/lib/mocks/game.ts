import { Player } from "@lib/types";
import { Match, Tournament } from "@libTournament/types";
import { LivePlayer, SummonerSpell } from "@libLeagueClient/types/LivePlayer";
import { GameEvent } from "@libLeagueClient/types";

const initialSpell = (name: string): SummonerSpell => ({ displayName: name, rawDescription: name });

const getRandomValue = (between: number = 10): number => {
  return Math.floor(Math.random() * between);
};

const getRandomItem = (slot: number): { itemID: number; name: string; count: number; price: number; slot: number } => {
  const items = [
    { itemID: 1001, name: "Boots", count: 1, price: 300 },
    { itemID: 1055, name: "Doran's Blade", count: 1, price: 450 },
    { itemID: 1056, name: "Doran's Ring", count: 1, price: 400 },
    { itemID: 1036, name: "Long Sword", count: 1, price: 350 },
    { itemID: 1037, name: "Pickaxe", count: 1, price: 875 },
    { itemID: 3006, name: "Berserker's Greaves", count: 1, price: 1100 },
    { itemID: 3072, name: "Bloodthirster", count: 1, price: 3400 },
    { itemID: 3032, name: "Yun Tal's", count: 1, price: 3000 },
    { itemID: 3031, name: "Infinity Edge", count: 1, price: 3450 },
    { itemID: 3855, name: "Relic Shield", count: 1, price: 400 },
    { itemID: 3859, name: "Steel Shoulderguards", count: 1, price: 400 },
    { itemID: 1039, name: "Hunter's Talisman", count: 1, price: 350 }
  ];
  
  const randomItem = items[Math.floor(Math.random() * items.length)];
  return { ...randomItem, slot };
};

const getRandomItems = (): { itemID: number; name: string; count: number; price: number; slot: number }[] => {
  const itemCount = Math.floor(Math.random() * 4) + 1; // 1-4 items
  const items = [];
  
  for (let i = 0; i < itemCount; i++) {
    items.push(getRandomItem(i));
  }
  
  // Add trinket in slot 6
  const trinkets = [
    { itemID: 3363, name: "Farsight Alteration", count: 1, price: 0, slot: 6 },
    { itemID: 3364, name: "Oracle Lens", count: 1, price: 0, slot: 6 },
    { itemID: 3340, name: "Stealth Ward", count: 1, price: 0, slot: 6 }
  ];
  
  const randomTrinket = trinkets[Math.floor(Math.random() * trinkets.length)];
  items.push(randomTrinket);
  
  return items;
};

export const staticPlayersOrderMock: LivePlayer[] = [
  {
    summonerName: "frajgo#FMS",
    championName: "Darius",
    team: "ORDER",
    riotIdGameName: "frajgo",
    riotIdTag: "FMS",
    position: "TOP",
    scores: {
      kills: getRandomValue(),
      deaths: getRandomValue(),
      assists: getRandomValue(),
      creepScore: getRandomValue(250),
      wardScore: getRandomValue(30),
    },
    items: getRandomItems(),
    level: getRandomValue(18),
    gold: getRandomValue(10000),
    currentHealth: getRandomValue(2259),
    maxHealth: 2259,
    resourceType: "mana",
    resourceValue: getRandomValue(1000),
    resourceMax: 1000,
    respawnTimer: 0,
    isDead: false,
    summonerSpells: { summonerSpellOne: initialSpell("Flash"), summonerSpellTwo: initialSpell("Teleport Unleashed") },
    runes: { keystone: "Conqueror", primaryRuneTree: "Precision", secondaryRuneTree: "Resolve" }
  },
  {
    summonerName: "Rybson#FMS",
    championName: "Olaf",
    team: "ORDER",
    riotIdGameName: "Rybson",
    riotIdTag: "FMS",
    position: "JUNGLE",
    scores: {
      kills: getRandomValue(),
      deaths: getRandomValue(),
      assists: getRandomValue(),
      creepScore: getRandomValue(250),
      wardScore: getRandomValue(30),
    },
    items: getRandomItems(),
    level: getRandomValue(18),
    gold: getRandomValue(10000),
    currentHealth: getRandomValue(2259),
    maxHealth: 2259,
    resourceType: "mana",
    resourceValue: getRandomValue(1000),
    resourceMax: 1000,
    respawnTimer: 0,
    isDead: false,
    summonerSpells: { summonerSpellOne: initialSpell("Smite"), summonerSpellTwo: initialSpell("Flash") },
    runes: { keystone: "Conqueror", primaryRuneTree: "Precision", secondaryRuneTree: "Resolve" }
  },
  {
    summonerName: "Mrozku#FMS",
    championName: "Ahri",
    team: "ORDER",
    riotIdGameName: "Mrozku",
    riotIdTag: "FMS",
    position: "MID",
    scores: {
      kills: getRandomValue(),
      deaths: getRandomValue(),
      assists: getRandomValue(),
      creepScore: getRandomValue(250),
      wardScore: getRandomValue(30),
    },
    items: getRandomItems(),
    level: getRandomValue(18),
    gold: getRandomValue(10000),
    currentHealth: getRandomValue(2259),
    maxHealth: 2259,
    resourceType: "mana",
    resourceValue: getRandomValue(1000),
    resourceMax: 1000,
    respawnTimer: 0,
    isDead: false,
    summonerSpells: { summonerSpellOne: initialSpell("Flash"), summonerSpellTwo: initialSpell("Ignite") },
    runes: { keystone: "Electrocute", primaryRuneTree: "Domination", secondaryRuneTree: "Sorcery" }
  },
  {
    summonerName: "zamulek#FMS",
    championName: "Lucian",
    team: "ORDER",
    riotIdGameName: "zamulek",
    riotIdTag: "FMS",
    position: "BOTTOM",
    scores: {
      kills: getRandomValue(),
      deaths: getRandomValue(),
      assists: getRandomValue(),
      creepScore: getRandomValue(250),
      wardScore: getRandomValue(30),
    },
    items: getRandomItems(),
    level: getRandomValue(18),
    gold: getRandomValue(10000),
    currentHealth: getRandomValue(2259),
    maxHealth: 2259,
    resourceType: "mana",
    resourceValue: getRandomValue(1000),
    resourceMax: 1000,
    respawnTimer: 0,
    isDead: false,
    summonerSpells: { summonerSpellOne: initialSpell("Flash"), summonerSpellTwo: initialSpell("Heal") },
    runes: { keystone: "Lethal Tempo", primaryRuneTree: "Precision", secondaryRuneTree: "Inspiration" }
  },
  {
    summonerName: "minemaciek#FMS",
    championName: "Nami",
    team: "ORDER",
    riotIdGameName: "minemaciek",
    riotIdTag: "FMS",
    position: "UTILITY",
    scores: {
      kills: getRandomValue(),
      deaths: getRandomValue(),
      assists: getRandomValue(),
      creepScore: getRandomValue(250),
      wardScore: getRandomValue(30),
    },
    items: getRandomItems(),
    level: getRandomValue(18),
    gold: getRandomValue(10000),
    currentHealth: getRandomValue(2259),
    maxHealth: 2259,
    resourceType: "mana",
    resourceValue: getRandomValue(1000),
    resourceMax: 1000,
    respawnTimer: 0,
    isDead: false,
    summonerSpells: { summonerSpellOne: initialSpell("Flash"), summonerSpellTwo: initialSpell("Exhaust") },
    runes: { keystone: "Aftershock", primaryRuneTree: "Resolve", secondaryRuneTree: "Inspiration" }
  }
];

export const staticPlayersChaosMock: LivePlayer[] = [
  {
    summonerName: "Bausffs#LR",
    championName: "Sion",
    team: "CHAOS",
    riotIdGameName: "Bausffs",
    riotIdTag: "LR",
    position: "TOP",
    scores: {
      kills: getRandomValue(),
      deaths: getRandomValue(),
      assists: getRandomValue(),
      creepScore: getRandomValue(250),
      wardScore: getRandomValue(30),
    },
    items: getRandomItems(),
    level: getRandomValue(18),
    gold: getRandomValue(10000),
    currentHealth: getRandomValue(2259),
    maxHealth: 2259,
    resourceType: "mana",
    resourceValue: getRandomValue(1000),
    resourceMax: 1000,
    respawnTimer: 0,
    isDead: false,
    summonerSpells: { summonerSpellOne: initialSpell("Flash"), summonerSpellTwo: initialSpell("Teleport") },
    runes: { keystone: "Conqueror", primaryRuneTree: "Precision", secondaryRuneTree: "Resolve" }
  },
  {
    summonerName: "Velja#LR",
    championName: "Naafiri",
    team: "CHAOS",
    riotIdGameName: "Velja",
    riotIdTag: "LR",
    position: "JUNGLE",
    scores: {
      kills: getRandomValue(),
      deaths: getRandomValue(),
      assists: getRandomValue(),
      creepScore: getRandomValue(250),
      wardScore: getRandomValue(30),
    },
    items: getRandomItems(),
    level: getRandomValue(18),
    gold: getRandomValue(10000),
    currentHealth: getRandomValue(2259),
    maxHealth: 2259,
    resourceType: "mana",
    resourceValue: getRandomValue(1000),
    resourceMax: 1000,
    respawnTimer: 0,
    isDead: false,
    summonerSpells: { summonerSpellOne: initialSpell("Smite"), summonerSpellTwo: initialSpell("Flash") },
    runes: { keystone: "Electrocute", primaryRuneTree: "Domination", secondaryRuneTree: "Sorcery" }
  },
  {
    summonerName: "Nemesis#LR",
    championName: "Aurelion Sol",
    team: "CHAOS",
    riotIdGameName: "Nemesis",
    riotIdTag: "LR",
    position: "MID",
    scores: {
      kills: getRandomValue(),
      deaths: getRandomValue(),
      assists: getRandomValue(),
      creepScore: getRandomValue(250),
      wardScore: getRandomValue(30),
    },
    items: getRandomItems(),
    level: getRandomValue(18),
    gold: getRandomValue(10000),
    currentHealth: getRandomValue(2259),
    maxHealth: 2259,
    resourceType: "mana",
    resourceValue: getRandomValue(1000),
    resourceMax: 1000,
    respawnTimer: 0,
    isDead: false,
    summonerSpells: { summonerSpellOne: initialSpell("Flash"), summonerSpellTwo: initialSpell("Ignite") },
    runes: { keystone: "Electrocute", primaryRuneTree: "Domination", secondaryRuneTree: "Precision" }
  },
  {
    summonerName: "Crownie#LR",
    championName: "Kai'Sa",
    team: "CHAOS",
    riotIdGameName: "Crownie",
    riotIdTag: "LR",
    position: "BOTTOM",
    scores: {
      kills: getRandomValue(),
      deaths: getRandomValue(),
      assists: getRandomValue(),
      creepScore: getRandomValue(250),
      wardScore: getRandomValue(30),
    },
    items: getRandomItems(),
    level: getRandomValue(18),
    gold: getRandomValue(10000),
    currentHealth: getRandomValue(2259),
    maxHealth: 2259,
    resourceType: "mana",
    resourceValue: getRandomValue(1000),
    resourceMax: 1000,
    respawnTimer: 0,
    isDead: false,
    summonerSpells: { summonerSpellOne: initialSpell("Flash"), summonerSpellTwo: initialSpell("Heal") },
    runes: { keystone: "Fleet Footwork", primaryRuneTree: "Precision", secondaryRuneTree: "Inspiration" }
  },
  {
    summonerName: "Rekkles#LR",
    championName: "Leona",
    team: "CHAOS",
    riotIdGameName: "Rekkles",
    riotIdTag: "LR",
    position: "UTILITY",
    scores: {
      kills: getRandomValue(),
      deaths: getRandomValue(),
      assists: getRandomValue(),
      creepScore: getRandomValue(250),
      wardScore: getRandomValue(30),
    },
    items: getRandomItems(),
    level: getRandomValue(18),
    gold: getRandomValue(10000),
    currentHealth: getRandomValue(2259),
    maxHealth: 2259,
    resourceType: "mana",
    resourceValue: getRandomValue(1000),
    resourceMax: 1000,
    respawnTimer: 0,
    isDead: false,
    summonerSpells: { summonerSpellOne: initialSpell("Flash"), summonerSpellTwo: initialSpell("Exhaust") },
    runes: { keystone: "Aftershock", primaryRuneTree: "Resolve", secondaryRuneTree: "Inspiration" }
  }
];


export const MockedRiotEvents: GameEvent[] = [
  {
    EventID: 0,
    EventName: "GameStart",
    EventTime: 0.0
  },
  {
    EventID: 1,
    EventName: "MinionsSpawning",
    EventTime: 0.0
  },
  {
    EventID: 6,
    EventName: "DragonKill",
    EventTime: 350.0, // 5:50
    DragonType: "Chemtech",
    Stolen: "False",
    KillerName: "Rybson#FMS",
    Assisters: ["frajgo#FMS", "Mrozku#FMS"]
  },
  {
    EventID: 2,
    EventName: "FirstBrick",
    EventTime: 508.4645080566406,
    KillerName: "Minion_T200L2S12N0070"
  },
  {
    EventID: 3,
    EventName: "TurretKilled",
    EventTime: 508.4645080566406,
    TurretKilled: "Turret_TOrder_L2_P3_1509986696",
    KillerName: "Minion_T200L2S12N0070",
    Assisters: []
  },
  {
    EventID: 4,
    EventName: "InhibKilled",
    EventTime: 600.0,
    InhibKilled: "Barracks_T2_R1",
    KillerName: "frajgo#FMS",
    Assisters: ["Rybson#FMS"]
  },
  {
    EventID: 5,
    EventName: "HordeKill",
    EventTime: 651.75537109375, // 10:51
    KillerName: "Niskrojs",
    Assisters: [],
    Stolen: "False"
  },
  // Commented out 2 voidgrub kills for demo - only 1 killed so voidgrubs are still alive
  // {
  //   EventID: 5.1,
  //   EventName: "HordeKill",
  //   EventTime: 680.0, // 11:20
  //   KillerName: "Niskrojs",
  //   Assisters: [],
  //   Stolen: "False"
  // },
  // {
  //   EventID: 5.2,
  //   EventName: "HordeKill",
  //   EventTime: 710.0, // 11:50
  //   KillerName: "Niskrojs",
  //   Assisters: [],
  //   Stolen: "False"
  // },
  // {
  //   EventID: 10,
  //   EventName: "AtakhanKill",
  //   EventTime: 1200.0,
  //   KillerName: "Niskrojs",
  //   Assisters: [],
  //   Stolen: "False"
  // },
  // Commented out 3 dragon kills for demo - start with 0 dragons killed
  // {
  //   EventID: 6,
  //   EventName: "DragonKill",
  //   EventTime: 420.0,
  //   DragonType: "Earth",
  //   Stolen: "False",
  //   KillerName: "Rybson#FMS",
  //   Assisters: ["frajgo#FMS"]
  // },
  // {
  //   EventID: 7,
  //   EventName: "DragonKill",
  //   EventTime: 420.0,
  //   DragonType: "Fire",
  //   Stolen: "False",
  //   KillerName: "Rybson#FMS",
  //   Assisters: ["frajgo#FMS"]
  // },
  // {
  //   EventID: 8,
  //   EventName: "DragonKill",
  //   EventTime: 420.0,
  //   DragonType: "Air",
  //   Stolen: "False",
  //   KillerName: "Rybson#FMS",
  //   Assisters: ["frajgo#FMS"]
  // },
  // {
  //   EventID: 9,
  //   EventName: "DragonKill",
  //   EventTime: 420.0,
  //   DragonType: "Air",
  //   Stolen: "False",
  //   KillerName: "Rybson#FMS",
  //   Assisters: ["frajgo#FMS"]
  // },
  // Commented out herald kill for demo - herald should only spawn after voidgrubs are slain
  // {
  //   EventID: 7,
  //   EventName: "HeraldKill",
  //   EventTime: 480.0,
  //   Stolen: "False",
  //   KillerName: "Rybson#FMS",
  //   Assisters: ["frajgo#FMS"]
  // },
  // Commented out baron kill for demo - baron should only spawn after herald dies
  // {
  //   EventID: 8,
  //   EventName: "BaronKill",
  //   EventTime: 900.0,
  //   Stolen: "False",
  //   KillerName: "Rybson#FMS",
  //   Assisters: ["frajgo#FMS", "Mrozku#FMS", "zamulek#FMS"]
  // },
  {
    EventID: 9,
    EventName: "ChampionKill",
    EventTime: 150.0,
    VictimName: "Bausffs#LR",
    KillerName: "frajgo#FMS",
    Assisters: ["Rybson#FMS"]
  },
  {
    EventID: 10,
    EventName: "Multikill",
    EventTime: 200.0,
    KillerName: "frajgo#FMS",
    KillStreak: 2
  },
  {
    EventID: 11,
    EventName: "Multikill",
    EventTime: 250.0,
    KillerName: "frajgo#FMS",
    KillStreak: 3
  },
  {
    EventID: 12,
    EventName: "Multikill",
    EventTime: 300.0,
    KillerName: "frajgo#FMS",
    KillStreak: 4
  },
  {
    EventID: 13,
    EventName: "Multikill",
    EventTime: 350.0,
    KillerName: "frajgo#FMS",
    KillStreak: 5
  },
  {
    EventID: 14,
    EventName: "Ace",
    EventTime: 400.0,
    Acer: "frajgo#FMS",
    AcingTeam: "ORDER"
  }
];

export const mockTournament: Tournament = {
  _id: "tourn_1",
  name: "Mock Tournament",
  abbreviation: "MT",
  startDate: new Date(),
  endDate: new Date(),
  requireRegistrationDeadline: false,
  matchFormat: "BO5",
  tournamentFormat: "Ladder",
  phaseMatchFormats: { default: "BO5" },
  maxTeams: 16,
  registrationOpen: true,
  fearlessDraft: false,
  logo: { type: "url", url: "" },
  registeredTeams: [],
  selectedTeams: [],
  status: "ongoing",
  allowSubstitutes: true,
  maxSubstitutes: 2,
  timezone: "UTC",
  matchDays: ["saturday"],
  defaultMatchTime: "19:00",
  userId: "mock-user",
  createdAt: new Date(),
  updatedAt: new Date()
};

export const mockStaticPlayersBlue: Player[] = [
  {
    _id: "1",
    inGameName: "frajgo",
    tag: "FMS",
    role: "TOP",

    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: "2",
    inGameName: "Rybson",
    tag: "FMS",
    role: "JUNGLE",

    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: "3",
    inGameName: "Mrozku",
    tag: "FMS",
    role: "MID",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: "4",
    inGameName: "zamulek",
    tag: "FMS",
    role: "BOTTOM",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: "5",
    inGameName: "minemaciek",
    tag: "FMS",
    role: "SUPPORT",

    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const mockStaticPlayersRed: Player[] = [
  {
    _id: "6",
    inGameName: "Bausffs",
    tag: "LR",
    role: "TOP",

    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: "7",
    inGameName: "Velja",
    tag: "LR",
    role: "JUNGLE",

    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: "8",
    inGameName: "Nemesis",
    tag: "LR",
    role: "MID",

    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: "9",
    inGameName: "Crownie",
    tag: "LR",
    role: "BOTTOM",

    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: "10",
    inGameName: "Rekkles",
    tag: "LR",
    role: "SUPPORT",

    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const mockMatch: Match = {
  _id: "match_1",
  name: "Los Ratones vs FMS - BO5",
  type: "tournament",
  tournamentId: "tourn_1",
  blueTeamId: "1", // Los Ratones
  redTeamId: "2", // FMS
  isFearlessDraft: true,
  format: "BO5",
  patchName: "25.13",
  status: "in-progress",

  games: [
    {
      _id: "game1",
      winner: "blue",
      blueTeam: "1", // Los Ratones
      redTeam: "2", // FMS
      gameNumber: 1,
      blueScore: 1,
      redScore: 0
    },
    {
      _id: "game2",
      winner: "red",
      blueTeam: "1", // Los Ratones
      redTeam: "2", // FMS
      gameNumber: 2,
      blueScore: 0,
      redScore: 1
    },
    {
      _id: "game3",
      winner: "blue",
      blueTeam: "1", // Los Ratones
      redTeam: "2", // FMS
      gameNumber: 3,
      blueScore: 1,
      redScore: 0
    },
    {
      _id: "game4",
      winner: "red",
      blueTeam: "1", // Los Ratones
      redTeam: "2", // FMS
      gameNumber: 4,
      blueScore: 0,
      redScore: 1
    }
  ],
  commentators: [],
  predictions: [],
  createdBy: "mock-user",
  createdAt: new Date(),
  updatedAt: new Date()
};
