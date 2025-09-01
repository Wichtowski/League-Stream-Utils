import { Schema } from "mongoose";
import { ImageStorageSchema } from "@lib/database/schemas/common";
import { SponsorSchema } from "@lib/database/schemas/sponsors";

export const TournamentSchema = new Schema({
  name: { type: String, required: true },
  abbreviation: { type: String, required: true },

  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  requireRegistrationDeadline: { type: Boolean, default: false },
  registrationDeadline: {
    type: Date,
    required: false
  },

  matchFormat: { type: String, enum: ["BO1", "BO3", "BO5"], required: true },
  tournamentFormat: {
    type: String,
    enum: ["Ladder", "Swiss into Ladder", "Round Robin into Ladder", "Groups"],
    required: true
  },

  // Phase-specific match formats for advanced tournaments
  phaseMatchFormats: {
    roundRobin: { type: String, enum: ["BO1", "BO3", "BO5"] },
    swiss: { type: String, enum: ["BO1", "BO3", "BO5"] },
    groups: { type: String, enum: ["BO1", "BO3", "BO5"] },
    ladder: { type: String, enum: ["BO1", "BO3", "BO5"] },
    semifinals: { type: String, enum: ["BO1", "BO3", "BO5"] },
    finals: { type: String, enum: ["BO1", "BO3", "BO5"] },
    default: { type: String, enum: ["BO1", "BO3", "BO5"] }
  },

  maxTeams: { type: Number, required: true },
  registrationOpen: { type: Boolean, default: true },
  prizePool: { type: Number },
  fearlessDraft: { type: Boolean, default: false },

  logo: { type: ImageStorageSchema, required: true },

  registeredTeams: [{ type: String }],
  selectedTeams: [{ type: String }],

  status: {
    type: String,
    enum: ["draft", "registration", "ongoing", "completed", "cancelled"],
    default: "draft"
  },

  matches: [{ type: String }],

  allowSubstitutes: { type: Boolean, default: true },
  maxSubstitutes: { type: Number, default: 2 },

  timezone: { type: String, required: true },
  matchDays: [{ type: String }],
  defaultMatchTime: { type: String, required: true },

  streamUrl: { type: String },
  broadcastLanguage: { type: String },
  gameVersion: { type: String },

  // Sponsors
  sponsors: { type: [SponsorSchema], default: [] },

  userId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

TournamentSchema.index({ userId: 1 });
TournamentSchema.index({ status: 1 });
TournamentSchema.index({ startDate: 1 });
TournamentSchema.index({ registrationDeadline: 1 });
