import { Schema } from "mongoose";
import { ImageStorageSchema, PlayerSchema } from "./common";
import { ChampionSchema } from "./common";

const MatchTeamSchema = new Schema(
  {
    id: { type: String, required: false },
    name: { type: String, required: false },
    tag: { type: String, required: false },
    logo: { type: ImageStorageSchema, required: false },
    colors: {
      primary: { type: String, required: false },
      secondary: { type: String, required: false },
      accent: { type: String, required: false }
    },
    players: { type: [PlayerSchema], required: false },
    coach: {
      name: { type: String },
      profileImage: { type: String }
    }
  },
  { _id: false }
);

const MatchCommentatorSchema = new Schema(
  {
    id: { type: String, required: false },
    name: { type: String, required: false },
    xHandle: { type: String },
    assignedAt: { type: Date, required: false },
    assignedBy: { type: String, required: false }
  },
  { _id: false }
);

const MatchPredictionSchema = new Schema(
  {
    commentatorId: { type: String, required: false },
    commentatorName: { type: String, required: false },
    prediction: { type: String, required: false },
    timestamp: { type: Date, required: false }
  },
  { _id: false }
);

const GameResultSchema = new Schema(
  {
    id: { type: String, required: false },
    gameNumber: { type: Number, required: false },
    winner: { type: String, enum: ["blue", "red"], required: false },
    duration: { type: Number, required: false }, // in seconds
    blueTeam: {
      kills: { type: Number, default: 0 },
      gold: { type: Number, default: 0 },
      towers: { type: Number, default: 0 },
      dragons: { type: Number, default: 0 },
      barons: { type: Number, default: 0 },
      bans: { type: [ChampionSchema], default: [] },
      picks: { type: [ChampionSchema], default: [] }
    },
    redTeam: {
      kills: { type: Number, default: 0 },
      gold: { type: Number, default: 0 },
      towers: { type: Number, default: 0 },
      dragons: { type: Number, default: 0 },
      barons: { type: Number, default: 0 },
      bans: { type: [ChampionSchema], default: [] },
      picks: { type: [ChampionSchema], default: [] }
    },
    completedAt: { type: Date, required: false }
  },
  { _id: false }
);

export const MatchSchema = new Schema({
  id: { type: String, required: false, unique: true },
  name: { type: String, required: false },
  type: { type: String, enum: ["tournament", "standalone"], required: false },

  // Tournament context (only for tournament matches)
  tournamentId: { type: String },
  tournamentName: { type: String },
  tournamentLogo: { type: ImageStorageSchema },
  bracketNodeId: { type: String },
  roundName: { type: String },
  matchNumber: { type: Number },

  // Teams
  blueTeam: { type: MatchTeamSchema, required: false },
  redTeam: { type: MatchTeamSchema, required: false },

  // Match configuration
  format: { type: String, enum: ["BO1", "BO3", "BO5"], required: false },
  isFearlessDraft: { type: Boolean, default: false },
  patchName: { type: String, required: false },

  // Scheduling
  scheduledTime: { type: Date },
  startTime: { type: Date },
  endTime: { type: Date },

  // Status and results
  status: {
    type: String,
    enum: ["scheduled", "in-progress", "completed", "cancelled"],
    default: "scheduled"
  },
  winner: { type: String, enum: ["blue", "red"] },
  score: {
    blue: { type: Number, default: 0 },
    red: { type: Number, default: 0 }
  },

  // Game results (for BO3/BO5)
  games: { type: [GameResultSchema], default: [] },

  // Commentators assigned to this match
  commentators: { type: [MatchCommentatorSchema], default: [] },

  // Predictions
  predictions: { type: [MatchPredictionSchema], default: [] },

  // Metadata
  createdBy: { type: String, required: false },
  createdAt: { type: Date, required: false, default: Date.now },
  updatedAt: { type: Date, required: false, default: Date.now }
});

// Indexes for better query performance
MatchSchema.index({ tournamentId: 1, status: 1 });
MatchSchema.index({ type: 1, status: 1 });
MatchSchema.index({ scheduledTime: 1 });
MatchSchema.index({ createdBy: 1 });
MatchSchema.index({ "commentators.id": 1 });
