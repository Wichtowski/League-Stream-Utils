import mongoose from "mongoose";
import { ChampionSchema, CoachSchema } from "@lib/database/schemas/common";

// Team Schema for pickban
const TeamPickbanSchema = new mongoose.Schema({
  name: { type: String, required: false },
  side: { type: String, enum: ["blue", "red"], required: false },
  bans: [ChampionSchema],
  picks: [ChampionSchema],
  currentPick: ChampionSchema,
  isReady: { type: Boolean, default: false },
  coach: CoachSchema,
  logoUrl: String,
  usedChampions: [ChampionSchema]
});

const GameConfigSchema = new mongoose.Schema({
  seriesType: { type: String, enum: ["BO1", "BO3", "BO5"], default: "BO1" },
  currentGame: { type: Number, default: 1 },
  totalGames: { type: Number, default: 1 },
  isFearlessDraft: { type: Boolean, default: false },
  patchName: { type: String, required: false },
  blueTeam: String,
  redTeamName: String,
  blueTeamPrefix: String,
  redTeamPrefix: String,
  blueCoach: CoachSchema,
  redCoach: CoachSchema,
  // Store IDs instead of logo data to avoid duplication
  blueTeamId: String,
  redTeamId: String,
  tournamentId: String,
  // Keep these for backward compatibility and manual entry
  tournamentName: String
});

const TimerSchema = new mongoose.Schema({
  remaining: { type: Number, default: 0 },
  totalTime: { type: Number, default: 0 },
  isActive: { type: Boolean, default: false },
  startedAt: Date
});

export const GameSessionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["static", "lcu", "tournament", "web"],
      default: "web"
    },
    teams: {
      blue: { type: TeamPickbanSchema, required: false },
      red: { type: TeamPickbanSchema, required: false }
    },
    phase: {
      type: String,
      enum: ["config", "lobby", "ban1", "pick1", "ban2", "pick2", "completed"],
      default: "config"
    },
    currentTeam: { type: String, enum: ["blue", "red"], default: "blue" },
    turnNumber: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    lastActivity: { type: Date, default: Date.now },
    timer: { type: TimerSchema, default: () => ({}) },
    bothTeamsReady: { type: Boolean, default: false },
    config: { type: GameConfigSchema, required: false },
    gameHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: "GameSession" }],
    seriesScore: {
      blue: { type: Number, default: 0 },
      red: { type: Number, default: 0 }
    },
    // Real-time pick/ban fields
    password: { type: String },
    teamReadiness: {
      blue: { type: Boolean, default: false },
      red: { type: Boolean, default: false }
    },
    sessionState: {
      type: String,
      enum: ["waiting", "ready", "in_progress", "finished"],
      default: "waiting"
    },
    connectedTeams: {
      blue: { type: Boolean, default: false },
      red: { type: Boolean, default: false }
    }
  },
  {
    timestamps: true
  }
);
