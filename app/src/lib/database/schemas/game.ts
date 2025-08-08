import mongoose from "mongoose";
import { ChampionSchema, CoachSchema } from "./common";

// Team Schema for pickban
const TeamSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  side: { type: String, enum: ["blue", "red"], required: true },
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
  patchName: { type: String, required: true },
  blueTeamName: String,
  redTeamName: String,
  blueTeamPrefix: String,
  redTeamPrefix: String,
  blueCoach: CoachSchema,
  redCoach: CoachSchema,
  blueTeamLogo: String,
  redTeamLogo: String,
  tournamentName: String,
  tournamentLogo: String
});

const TimerSchema = new mongoose.Schema({
  remaining: { type: Number, default: 0 },
  totalTime: { type: Number, default: 0 },
  isActive: { type: Boolean, default: false },
  startedAt: Date
});

export const GameSessionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    type: {
      type: String,
      enum: ["static", "lcu", "tournament", "web"],
      default: "web"
    },
    teams: {
      blue: { type: TeamSchema, required: true },
      red: { type: TeamSchema, required: true }
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
    config: { type: GameConfigSchema, required: true },
    gameHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: "GameSession" }],
    seriesScore: {
      blue: { type: Number, default: 0 },
      red: { type: Number, default: 0 }
    }
  },
  {
    timestamps: true
  }
);
