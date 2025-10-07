import { Schema } from "mongoose";
import { ImageStorageSchema, PlayerSchema, StaffSchema } from "@lib/database/schemas/common";

export const TeamSchema = new Schema({
  name: { type: String, required: true },
  tag: { type: String, required: true },
  logo: { type: ImageStorageSchema, required: false }, // Temporarily optional for migration
  flag: { type: String, required: false }, // team-selected ISO country code
  majorityFlag: { type: String, required: false },

  colors: {
    primary: { type: String, required: true },
    secondary: { type: String, required: true },
    accent: { type: String, required: true }
  },

  players: {
    main: {
      type: [PlayerSchema],
      required: true,
      default: []
    },
    substitutes: { type: [PlayerSchema], default: [] }
  },

  staff: {
    coach: { type: StaffSchema },
    analyst: { type: StaffSchema },
    manager: { type: StaffSchema }
  },

  region: { type: String, required: false },
  tier: {
    type: String,
    enum: ["amateur", "semi-pro", "professional"],
    required: false
  },
  founded: { type: Date, required: false, default: Date.now },

  socialMedia: {
    twitter: { type: String },
    discord: { type: String },
    website: { type: String }
  },

  collaborators: [
    {
      userId: { type: String, required: true },
      role: { type: String, required: true }
    }
  ],

  teamOwnerId: { type: String, required: false },
  createdAt: { type: Date, required: false, default: Date.now },
  updatedAt: { type: Date, required: false, default: Date.now },

  // Standalone team fields
  isStandalone: { type: Boolean, default: false },
  tournamentId: { type: String, required: false }
});

TeamSchema.index({ teamOwnerId: 1 });
TeamSchema.index({ name: 1 });
TeamSchema.index({ "players.main.puuid": 1 });
