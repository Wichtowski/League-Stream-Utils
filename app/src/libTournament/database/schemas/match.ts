import { Schema } from "mongoose";

export const MatchSchema = new Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["tournament", "standalone"],
      required: true
    },

    // Tournament context (only for tournament matches)
    tournamentId: { type: String, required: false },
    bracketNodeId: { type: String, required: false },
    roundName: { type: String, required: false },
    matchNumber: { type: Number, required: false },

    // Teams
    blueTeamId: { type: String, required: true },
    redTeamId: { type: String, required: true },

    // Match configuration
    format: {
      type: String,
      enum: ["BO1", "BO3", "BO5"],
      required: true
    },
    // Fearless behavior is derived from championsPlayed; explicit flag removed
    patchName: { type: String, required: true },

    // Scheduling
    scheduledTime: { type: Date, required: false },
    startTime: { type: Date, required: false },
    endTime: { type: Date, required: false },

    // Status and results
    status: {
      type: String,
      enum: ["scheduled", "in-progress", "completed", "cancelled"],
      required: true,
      default: "scheduled"
    },
    winner: {
      type: String,
      enum: ["blue", "red"],
      required: false
    },

    // Game results (for BO3/BO5)
    games: [
      {
        _id: { type: String, required: true },
        gameNumber: { type: Number, required: true },
        winner: {
          type: String,
          enum: ["blue", "red", "ongoing"],
          required: true
        },
        duration: { type: Number, required: false },
        blueScore: { type: Number, required: true },
        redScore: { type: Number, required: true },
        blueTeam: { type: String, required: true },
        redTeam: { type: String, required: true },
        championsPlayed: { type: Object, required: false },
        startTime: { type: Date, required: false },
        endTime: { type: Date, required: false },
        completedAt: { type: Date, required: false }
      }
    ],

    // Commentators assigned to this match
    commentators: [
      {
        _id: { type: String, required: true },
        name: { type: String, required: true },
        xHandle: { type: String, required: false },
        instagramHandle: { type: String, required: false },
        twitchHandle: { type: String, required: false },
        assignedAt: { type: Date, required: true },
        assignedBy: { type: String, required: true }
      }
    ],

    // Predictions
    predictions: [
      {
        userId: { type: String, required: true },
        username: { type: String, required: true },
        prediction: {
          type: String,
          enum: ["blue", "red"],
          required: true
        },
        blueScore: { type: Number, required: false },
        redScore: { type: Number, required: false },
        confidence: { type: Number, required: false },
        submittedAt: { type: Date, required: true }
      }
    ],

    // Metadata
    createdBy: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  {
    timestamps: true
  }
);
