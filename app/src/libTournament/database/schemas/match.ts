import { Schema } from "mongoose";
import { ImageStorageSchema } from "@lib/database/schemas/common";
import { MatchPredictionSchema, MatchCommentatorSchema } from "./prediction";


const GameResultSchema = new Schema({
  gameNumber: { type: Number, required: true },
  winner: { type: String, enum: ["blue", "red"], required: true },
  duration: { type: Number, required: false },
  blueScore: { type: Number, default: 0 },
  redScore: { type: Number, default: 0 },
  blueTeamId: { type: String, required: true },
  redTeamId: { type: String, required: true },
  startTime: { type: Date, required: false },
  endTime: { type: Date, required: false },
  completedAt: { type: Date, required: false }
});

export const MatchSchema = new Schema({
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
  blueTeamId: { type: String, required: true },
  redTeamId: { type: String, required: true },

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
MatchSchema.index({ "commentators._id": 1 });
