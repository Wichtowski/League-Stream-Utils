import { GameEvent, LivePlayer, SummonerSpell } from "@lib/services/game/game-service";


const initialSpell = (name: string): SummonerSpell => ({ displayName: name, rawDescription: name });

const getRandomValue = (): number => {
  return Math.floor(Math.random() * 10);
};

export const staticPlayersOrderMock: LivePlayer[] = [
{
    summonerName: "Get In The Ring",
    championName: "Tryndamere",
    team: "ORDER",
    position: "TOP",
    scores: { kills: getRandomValue(), deaths: getRandomValue(), assists: getRandomValue(), creepScore: 0, visionScore: 0 },
    items: [ { itemID: 1001, name: "Boots", count: 1, price: 300 } ],
    level: 16,
    gold: 10000,
    health: 70,
    maxHealth: 2259,
    summonerSpells: { summonerSpellOne: initialSpell("Flash"), summonerSpellTwo: initialSpell("Teleport") },
    runes: { keystone: "Conqueror", primaryRuneTree: "Precision", secondaryRuneTree: "Resolve" }
},
{
    summonerName: "COSSI COSSACK",
    championName: "Lee Sin",
    team: "ORDER",
    position: "JUNGLE",
    scores: { kills: getRandomValue(), deaths: getRandomValue(), assists: getRandomValue(), creepScore: 0, visionScore: 0 },
    items: [ { itemID: 1001, name: "Boots", count: 1, price: 300 } ],
    level: 1,
    gold: 500,
    summonerSpells: { summonerSpellOne: initialSpell("Smite"), summonerSpellTwo: initialSpell("Flash") },
    runes: { keystone: "Conqueror", primaryRuneTree: "Precision", secondaryRuneTree: "Resolve" }
},
{
    summonerName: "Hide on Bush",
    championName: "Ahri",
    team: "ORDER",
    position: "MID",
    scores: { kills: 5, deaths: 2, assists: 10, creepScore: 9, visionScore: 0 },
    items: [ { itemID: 1056, name: "Doran's Ring", count: 1, price: 400 } ],
    level: 5,
    health: 911,
    maxHealth: 911,
    gold: 500,
    summonerSpells: { summonerSpellOne: initialSpell("Flash"), summonerSpellTwo: initialSpell("Ignite") },
    runes: { keystone: "Electrocute", primaryRuneTree: "Domination", secondaryRuneTree: "Sorcery" }
},
{
    summonerName: "BlueADC",
    championName: "Ashe",
    team: "ORDER",
    position: "BOTTOM",
    scores: { kills: 0, deaths: 0, assists: 0, creepScore: 0, visionScore: 0 },
    items: [ { itemID: 1055, name: "Doran's Blade", count: 1, price: 450 } ],
    level: 1,
    gold: 500,
    summonerSpells: { summonerSpellOne: initialSpell("Flash"), summonerSpellTwo: initialSpell("Heal") },
    runes: { keystone: "Lethal Tempo", primaryRuneTree: "Precision", secondaryRuneTree: "Inspiration" }
},
{
    summonerName: "BlueSupport",
    championName: "Thresh",
    team: "ORDER",
    position: "UTILITY",
    scores: { kills: 0, deaths: 0, assists: 0, creepScore: 0, visionScore: 0 },
    items: [ { itemID: 3855, name: "Relic Shield", count: 1, price: 400 } ],
    level: 1,
    gold: 500,
    summonerSpells: { summonerSpellOne: initialSpell("Flash"), summonerSpellTwo: initialSpell("Exhaust") },
    runes: { keystone: "Aftershock", primaryRuneTree: "Resolve", secondaryRuneTree: "Inspiration" }
}
];

export const staticPlayersChaosMock: LivePlayer[] = [
{
    summonerName: "RedTop",
    championName: "Darius",
    team: "CHAOS",
    position: "TOP",
    scores: { kills: 0, deaths: 0, assists: 0, creepScore: 0, visionScore: 0 },
    items: [ { itemID: 1036, name: "Long Sword", count: 1, price: 350 } ],
    level: 1,
    gold: 500,
    summonerSpells: { summonerSpellOne: initialSpell("Flash"), summonerSpellTwo: initialSpell("Teleport") },
    runes: { keystone: "Conqueror", primaryRuneTree: "Precision", secondaryRuneTree: "Resolve" }
},
{
    summonerName: "RedJungle",
    championName: "Nidalee",
    team: "CHAOS",
    position: "JUNGLE",
    scores: { kills: 0, deaths: 0, assists: 0, creepScore: 0, visionScore: 0 },
    items: [ { itemID: 1039, name: "Hunter's Talisman", count: 1, price: 350 } ],
    level: 1,
    gold: 500,
    summonerSpells: { summonerSpellOne: initialSpell("Smite"), summonerSpellTwo: initialSpell("Flash") },
    runes: { keystone: "Electrocute", primaryRuneTree: "Domination", secondaryRuneTree: "Sorcery" }
},
{
    summonerName: "RedMid",
    championName: "Zed",
    team: "CHAOS",
    position: "MID",
    scores: { kills: 0, deaths: 0, assists: 0, creepScore: 0, visionScore: 0 },
    items: [ { itemID: 1036, name: "Long Sword", count: 1, price: 350 } ],
    level: 1,
    gold: 500,
    summonerSpells: { summonerSpellOne: initialSpell("Flash"), summonerSpellTwo: initialSpell("Ignite") },
    runes: { keystone: "Electrocute", primaryRuneTree: "Domination", secondaryRuneTree: "Precision" }
},
{
    summonerName: "RedADC",
    championName: "Caitlyn",
    team: "CHAOS",
    position: "BOTTOM",
    scores: { kills: 0, deaths: 0, assists: 0, creepScore: 0, visionScore: 0 },
    items: [ { itemID: 1055, name: "Doran's Blade", count: 1, price: 450 } ],
    level: 1,
    gold: 500,
    summonerSpells: { summonerSpellOne: initialSpell("Flash"), summonerSpellTwo: initialSpell("Heal") },
    runes: { keystone: "Fleet Footwork", primaryRuneTree: "Precision", secondaryRuneTree: "Inspiration" }
},
{
    summonerName: "RedSupport",
    championName: "Leona",
    team: "CHAOS",
    position: "UTILITY",
    scores: { kills: 0, deaths: 0, assists: 0, creepScore: 0, visionScore: 0 },
    items: [ { itemID: 3859, name: "Steel Shoulderguards", count: 1, price: 400 } ],
    level: 1,
    gold: 500,
    summonerSpells: { summonerSpellOne: initialSpell("Flash"), summonerSpellTwo: initialSpell("Exhaust") },
    runes: { keystone: "Aftershock", primaryRuneTree: "Resolve", secondaryRuneTree: "Inspiration" }
}
];

export const MockedEvents: GameEvent[] = [
  { EventName: "KILL", EventTime: 10, KillerName: "Get In The Ring", KillerTeam: "ORDER", VictimName: "RedTop", VictimTeam: "CHAOS", Position: { x: 100, y: 100 } },
  { EventName: "KILL", EventTime: 10, KillerName: "Get In The Ring", KillerTeam: "ORDER", VictimName: "RedJungle", VictimTeam: "CHAOS", Position: { x: 100, y: 100 } },
  { EventName: "KILL", EventTime: 10, KillerName: "Get In The Ring", KillerTeam: "ORDER", VictimName: "RedMid", VictimTeam: "CHAOS", Position: { x: 100, y: 100 } },
];