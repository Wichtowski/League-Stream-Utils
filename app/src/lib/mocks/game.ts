import { Player } from "@lib/types";
import { Match, Tournament } from "@libTournament/types";
import { LivePlayer, SummonerSpell } from "@libLeagueClient/types/LivePlayer";
import { GameEvent } from "@libLeagueClient/types";

const initialSpell = (name: string): SummonerSpell => ({ displayName: name, rawDescription: name });

const getRandomValue = (between: number = 10): number => {
  return Math.floor(Math.random() * between);
};

export const staticPlayersOrderMock: LivePlayer[] = [
  {
    summonerName: "frajgo",
    championName: "Darius",
    team: "ORDER",
    position: "TOP",
    scores: {
      kills: getRandomValue(),
      deaths: getRandomValue(),
      assists: getRandomValue(),
      creepScore: getRandomValue(250),
      visionScore: getRandomValue(30)
    },
    items: [{ itemID: 1001, name: "Boots", count: 1, price: 300 }],
    level: getRandomValue(18),
    gold: getRandomValue(10000),
    health: getRandomValue(2259),
    maxHealth: getRandomValue(2259),
    summonerSpells: { summonerSpellOne: initialSpell("Flash"), summonerSpellTwo: initialSpell("Teleport") },
    runes: { keystone: "Conqueror", primaryRuneTree: "Precision", secondaryRuneTree: "Resolve" }
  },
  {
    summonerName: "Rybson",
    championName: "Olaf",
    team: "ORDER",
    position: "JUNGLE",
    scores: {
      kills: getRandomValue(),
      deaths: getRandomValue(),
      assists: getRandomValue(),
      creepScore: getRandomValue(250),
      visionScore: getRandomValue(30)
    },
    items: [{ itemID: 1001, name: "Boots", count: 1, price: 300 }],
    level: getRandomValue(18),
    gold: getRandomValue(10000),
    health: getRandomValue(2259),
    maxHealth: getRandomValue(2259),
    summonerSpells: { summonerSpellOne: initialSpell("Smite"), summonerSpellTwo: initialSpell("Flash") },
    runes: { keystone: "Conqueror", primaryRuneTree: "Precision", secondaryRuneTree: "Resolve" }
  },
  {
    summonerName: "Mrozku",
    championName: "Ahri",
    team: "ORDER",
    position: "MID",
    scores: {
      kills: getRandomValue(),
      deaths: getRandomValue(),
      assists: getRandomValue(),
      creepScore: getRandomValue(250),
      visionScore: getRandomValue(30)
    },
    items: [{ itemID: 1056, name: "Doran's Ring", count: 1, price: 400 }],
    level: getRandomValue(18),
    gold: getRandomValue(10000),
    health: getRandomValue(2259),
    maxHealth: getRandomValue(2259),
    summonerSpells: { summonerSpellOne: initialSpell("Flash"), summonerSpellTwo: initialSpell("Ignite") },
    runes: { keystone: "Electrocute", primaryRuneTree: "Domination", secondaryRuneTree: "Sorcery" }
  },
  {
    summonerName: "zamulek",
    championName: "Lucian",
    team: "ORDER",
    position: "BOTTOM",
    scores: {
      kills: getRandomValue(),
      deaths: getRandomValue(),
      assists: getRandomValue(),
      creepScore: getRandomValue(250),
      visionScore: getRandomValue(30)
    },
    items: [{ itemID: 1055, name: "Doran's Blade", count: 1, price: 450 }],
    level: getRandomValue(18),
    gold: getRandomValue(10000),
    health: getRandomValue(2259),
    maxHealth: getRandomValue(2259),
    summonerSpells: { summonerSpellOne: initialSpell("Flash"), summonerSpellTwo: initialSpell("Heal") },
    runes: { keystone: "Lethal Tempo", primaryRuneTree: "Precision", secondaryRuneTree: "Inspiration" }
  },
  {
    summonerName: "minemaciek",
    championName: "Nami",
    team: "ORDER",
    position: "UTILITY",
    scores: {
      kills: getRandomValue(),
      deaths: getRandomValue(),
      assists: getRandomValue(),
      creepScore: getRandomValue(250),
      visionScore: getRandomValue(30)
    },
    items: [{ itemID: 3855, name: "Relic Shield", count: 1, price: 400 }],
    level: getRandomValue(18),
    gold: getRandomValue(10000),
    health: getRandomValue(2259),
    maxHealth: getRandomValue(2259),
    summonerSpells: { summonerSpellOne: initialSpell("Flash"), summonerSpellTwo: initialSpell("Exhaust") },
    runes: { keystone: "Aftershock", primaryRuneTree: "Resolve", secondaryRuneTree: "Inspiration" }
  }
];

export const staticPlayersChaosMock: LivePlayer[] = [
  {
    summonerName: "Bausffs",
    championName: "Sion",
    team: "CHAOS",
    position: "TOP",
    scores: {
      kills: getRandomValue(),
      deaths: getRandomValue(),
      assists: getRandomValue(),
      creepScore: getRandomValue(250),
      visionScore: getRandomValue(30)
    },
    items: [{ itemID: 1036, name: "Long Sword", count: 1, price: 350 }],
    level: getRandomValue(18),
    gold: getRandomValue(10000),
    health: getRandomValue(2259),
    maxHealth: getRandomValue(2259),
    summonerSpells: { summonerSpellOne: initialSpell("Flash"), summonerSpellTwo: initialSpell("Teleport") },
    runes: { keystone: "Conqueror", primaryRuneTree: "Precision", secondaryRuneTree: "Resolve" }
  },
  {
    summonerName: "Velja",
    championName: "Naafiri",
    team: "CHAOS",
    position: "JUNGLE",
    scores: {
      kills: getRandomValue(),
      deaths: getRandomValue(),
      assists: getRandomValue(),
      creepScore: getRandomValue(250),
      visionScore: getRandomValue(30)
    },
    items: [{ itemID: 1039, name: "Hunter's Talisman", count: 1, price: 350 }],
    level: getRandomValue(18),
    gold: getRandomValue(10000),
    health: getRandomValue(2259),
    maxHealth: getRandomValue(2259),
    summonerSpells: { summonerSpellOne: initialSpell("Smite"), summonerSpellTwo: initialSpell("Flash") },
    runes: { keystone: "Electrocute", primaryRuneTree: "Domination", secondaryRuneTree: "Sorcery" }
  },
  {
    summonerName: "Nemesis",
    championName: "Aurelion Sol",
    team: "CHAOS",
    position: "MID",
    scores: {
      kills: getRandomValue(),
      deaths: getRandomValue(),
      assists: getRandomValue(),
      creepScore: getRandomValue(250),
      visionScore: getRandomValue(30)
    },
    items: [
      { itemID: 3072, name: "Bloodthirster", count: 1, price: 350 },
      { itemID: 3032, name: "Yun Tal's", count: 1, price: 350 },
      { itemID: 3031, name: "Infinity Edge", count: 1, price: 350 },
      { itemID: 3006, name: "Berserker's Greaves", count: 1, price: 350 }
    ],
    level: getRandomValue(18),
    gold: getRandomValue(10000),
    health: getRandomValue(2259),
    maxHealth: getRandomValue(2259),
    summonerSpells: { summonerSpellOne: initialSpell("Flash"), summonerSpellTwo: initialSpell("Ignite") },
    runes: { keystone: "Electrocute", primaryRuneTree: "Domination", secondaryRuneTree: "Precision" }
  },
  {
    summonerName: "Crownie",
    championName: "Kai'Sa",
    team: "CHAOS",
    position: "UTILITY",
    scores: {
      kills: getRandomValue(),
      deaths: getRandomValue(),
      assists: getRandomValue(),
      creepScore: getRandomValue(250),
      visionScore: getRandomValue(30)
    },
    items: [
      { itemID: 3072, name: "Bloodthirster", count: 1, price: 3400 },
      { itemID: 3032, name: "Yun Tal's", count: 1, price: 3000 },
      { itemID: 3031, name: "Infinity Edge", count: 1, price: 3450 },
      { itemID: 3006, name: "Berserker's Greaves", count: 1, price: 1100 }
    ],
    level: getRandomValue(18),
    gold: getRandomValue(10000),
    health: getRandomValue(2259),
    maxHealth: getRandomValue(2259),
    summonerSpells: { summonerSpellOne: initialSpell("Flash"), summonerSpellTwo: initialSpell("Heal") },
    runes: { keystone: "Fleet Footwork", primaryRuneTree: "Precision", secondaryRuneTree: "Inspiration" }
  },
  {
    summonerName: "Rekkles",
    championName: "Leona",
    team: "CHAOS",
    position: "BOTTOM",
    scores: {
      kills: getRandomValue(),
      deaths: getRandomValue(),
      assists: getRandomValue(),
      creepScore: getRandomValue(250),
      visionScore: getRandomValue(30)
    },
    items: [{ itemID: 3859, name: "Steel Shoulderguards", count: 1, price: 400 }],
    level: getRandomValue(18),
    gold: getRandomValue(10000),
    health: getRandomValue(2259),
    maxHealth: getRandomValue(2259),
    summonerSpells: { summonerSpellOne: initialSpell("Flash"), summonerSpellTwo: initialSpell("Exhaust") },
    runes: { keystone: "Aftershock", primaryRuneTree: "Resolve", secondaryRuneTree: "Inspiration" }
  }
];

export const MockedEvents: GameEvent[] = [
  {
    EventName: "KILL",
    EventTime: 10,
    KillerName: "frajgo",
    KillerTeam: "ORDER",
    VictimName: "Baus",
    VictimTeam: "CHAOS",
    Position: { x: 100, y: 100 }
  },
  {
    EventName: "KILL",
    EventTime: 10,
    KillerName: "Rybson",
    KillerTeam: "ORDER",
    VictimName: "Velja",
    VictimTeam: "CHAOS",
    Position: { x: 100, y: 100 }
  },
  {
    EventName: "KILL",
    EventTime: 10,
    KillerName: "Mrozku",
    KillerTeam: "ORDER",
    VictimName: "Nemesis",
    VictimTeam: "CHAOS",
    Position: { x: 100, y: 100 }
  },
  {
    EventName: "KILL",
    EventTime: 10,
    KillerName: "zamulek",
    KillerTeam: "ORDER",
    VictimName: "Crownie",
    VictimTeam: "CHAOS",
    Position: { x: 100, y: 100 }
  },
  {
    EventName: "KILL",
    EventTime: 10,
    KillerName: "minemaciek",
    KillerTeam: "ORDER",
    VictimName: "Rekkles",
    VictimTeam: "CHAOS",
    Position: { x: 100, y: 100 }
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
