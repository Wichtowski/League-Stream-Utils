import { GameEvent, LivePlayer, SummonerSpell } from "@lib/services/game/game-service";
import type { Match } from "../types/match";
import type { Tournament } from "../types/tournament";
import { Player } from "../types";
import { fmsLogoInBase64 } from "@lib/mocks/fmsLogoInBase64";


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
        scores: { kills: getRandomValue(), deaths: getRandomValue(), assists: getRandomValue(), creepScore: getRandomValue(250), visionScore: getRandomValue(30) },
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
        scores: { kills: getRandomValue(), deaths: getRandomValue(), assists: getRandomValue(), creepScore: getRandomValue(250), visionScore: getRandomValue(30) },
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
        scores: { kills: getRandomValue(), deaths: getRandomValue(), assists: getRandomValue(), creepScore: getRandomValue(250), visionScore: getRandomValue(30) },
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
        scores: { kills: getRandomValue(), deaths: getRandomValue(), assists: getRandomValue(), creepScore: getRandomValue(250), visionScore: getRandomValue(30) },
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
        scores: { kills: getRandomValue(), deaths: getRandomValue(), assists: getRandomValue(), creepScore: getRandomValue(250), visionScore: getRandomValue(30) },
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
        scores: { kills: getRandomValue(), deaths: getRandomValue(), assists: getRandomValue(), creepScore: getRandomValue(250), visionScore: getRandomValue(30) },
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
        scores: { kills: getRandomValue(), deaths: getRandomValue(), assists: getRandomValue(), creepScore: getRandomValue(250), visionScore: getRandomValue(30) },
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
        scores: { kills: getRandomValue(), deaths: getRandomValue(), assists: getRandomValue(), creepScore: getRandomValue(250), visionScore: getRandomValue(30) },
        items: [{ itemID: 3072, name: "Bloodthirster", count: 1, price: 350 }, { itemID: 3032, name: "Yun Tal's", count: 1, price: 350 }, { itemID: 3031, name: "Infinity Edge", count: 1, price: 350 }, { itemID: 3006, name: "Berserker's Greaves", count: 1, price: 350 }],
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
        scores: { kills: getRandomValue(), deaths: getRandomValue(), assists: getRandomValue(), creepScore: getRandomValue(250), visionScore: getRandomValue(30) },
        items: [{ itemID: 3072, name: "Bloodthirster", count: 1, price: 3400 }, { itemID: 3032, name: "Yun Tal's", count: 1, price: 3000 }, { itemID: 3031, name: "Infinity Edge", count: 1, price: 3450 }, { itemID: 3006, name: "Berserker's Greaves", count: 1, price: 1100 }],
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
        scores: { kills: getRandomValue(), deaths: getRandomValue(), assists: getRandomValue(), creepScore: getRandomValue(250), visionScore: getRandomValue(30) },
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
    { EventName: "KILL", EventTime: 10, KillerName: "frajgo", KillerTeam: "ORDER", VictimName: "Baus", VictimTeam: "CHAOS", Position: { x: 100, y: 100 } },
    { EventName: "KILL", EventTime: 10, KillerName: "Rybson", KillerTeam: "ORDER", VictimName: "Velja", VictimTeam: "CHAOS", Position: { x: 100, y: 100 } },
    { EventName: "KILL", EventTime: 10, KillerName: "Mrozku", KillerTeam: "ORDER", VictimName: "Nemesis", VictimTeam: "CHAOS", Position: { x: 100, y: 100 } },
    { EventName: "KILL", EventTime: 10, KillerName: "zamulek", KillerTeam: "ORDER", VictimName: "Crownie", VictimTeam: "CHAOS", Position: { x: 100, y: 100 } },
    { EventName: "KILL", EventTime: 10, KillerName: "minemaciek", KillerTeam: "ORDER", VictimName: "Rekkles", VictimTeam: "CHAOS", Position: { x: 100, y: 100 } },
];

export const mockTournament: Tournament = {
    id: "tourn_1",
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

export const mockStaticPlayersBlue: Player[] = [{
    id: "1",
    inGameName: "frajgo",
    tag: "FMS",
    role: "TOP",
    verified: true,
    createdAt: new Date(),
    updatedAt: new Date()
},
{
    id: "2",
    inGameName: "Rybson",
    tag: "FMS",
    role: "JUNGLE",
    verified: true,
    createdAt: new Date(),
    updatedAt: new Date()
},
{
    id: "3",
    inGameName: "Mrozku",
    tag: "FMS",
    role: "MID",
    verified: true,
    createdAt: new Date(),
    updatedAt: new Date()
},
{
    id: "4",
    inGameName: "zamulek",
    tag: "FMS",
    role: "ADC",
    verified: true,
    createdAt: new Date(),
    updatedAt: new Date()
},
{
    id: "5",
    inGameName: "minemaciek",
    tag: "FMS",
    role: "SUPPORT",
    verified: true,
    createdAt: new Date(),
    updatedAt: new Date()
}];

export const mockStaticPlayersRed: Player[] = [
{
    id: "6",
    inGameName: "Bausffs",
    tag: "LR",
    role: "TOP",
    verified: true,
    createdAt: new Date(),
    updatedAt: new Date()
},
{
    id: "7",
    inGameName: "Velja",
    tag: "LR",
    role: "JUNGLE",
    verified: true,
    createdAt: new Date(),
    updatedAt: new Date()
},
{
    id: "8",
    inGameName: "Nemesis",
    tag: "LR",
    role: "MID",
    verified: true,
    createdAt: new Date(),
    updatedAt: new Date()
},
{
    id: "9",
    inGameName: "Crownie",
    tag: "LR",
    role: "ADC",
    verified: true,
    createdAt: new Date(),
    updatedAt: new Date()
},
{
    id: "10",
    inGameName: "Rekkles",
    tag: "LR",
    role: "SUPPORT",
    verified: true,
    createdAt: new Date(),
    updatedAt: new Date()
}];

export const mockMatch: Match = {
    id: "match_1",
    name: "Mock Match",
    type: "tournament",
    tournamentId: mockTournament.id,
    tournamentName: mockTournament.name,
    format: mockTournament.matchFormat,
    isFearlessDraft: mockTournament.fearlessDraft,
    patchName: "25.16",
    blueTeam: {
        id: "team_blue",
        name: "Fajnie Mieć Skład",
        tag: "FMS",
        logo: { 
            type: "upload",
            data: fmsLogoInBase64,
            size: 48230,
            format: "png"
        },
        colors: { primary: "#3B82F6", secondary: "#1E40AF", accent: "#FFFFFF" },
        players: mockStaticPlayersBlue
    },
    redTeam: {
        id: "team_red",
        name: "Los Ratones",
        tag: "LR",
        logo: { type: "url", url: "https://liquipedia.net/commons/images/thumb/1/13/Los_Ratones_darkmode.png/600px-Los_Ratones_darkmode.png" },
        colors: { primary: "#EF4444", secondary: "#7F1D1D", accent: "#FFFFFF" },
        players: mockStaticPlayersRed
    },
    status: "in-progress",
    score: { blue: 0, red: 0 },
    games: [],
    commentators: [],
    predictions: [],
    createdBy: "mock-user",
    createdAt: new Date(),
    updatedAt: new Date()
};