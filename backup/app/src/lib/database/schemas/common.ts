import { Schema } from "mongoose";

export const ImageStorageSchema = new Schema({
  type: { type: String, enum: ["upload", "url"], required: false }, // Temporarily optional

  // Fields for upload type
  data: { type: String, required: false }, // base64 string
  size: { type: String, required: false }, // size in bytes
  format: { type: String, enum: ["png", "jpg", "webp"], required: false },

  // Fields for url type
  url: { type: String, required: false }, // external or CDN url

  // Legacy fields for backward compatibility
  filename: { type: String, required: false },
  originalName: { type: String, required: false },
  mimeType: { type: String, required: false },
  uploadedAt: { type: Date, default: Date.now }
});

export const PlayerSchema = new Schema({
  inGameName: { type: String, required: true },
  tag: { type: String, required: true },
  role: {
    type: String,
    enum: ["TOP", "JUNGLE", "MID", "BOTTOM", "SUPPORT"],
    required: true
  },
  profileImage: { type: String, required: false },
  puuid: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  country: { type: String },
  summonerLevel: { type: Number },
  rank: { type: String },
  lastGameAt: { type: Date },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const StaffSchema = new Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  email: { type: String, required: false },
  phone: { type: String, required: false },
  profileImage: { type: String, required: false },
  bio: { type: String, required: false },
  socialMedia: {
    twitter: { type: String },
    discord: { type: String },
    linkedin: { type: String }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const ChampionSchema = new Schema({
  name: { type: String, required: true },
  key: { type: String, required: true },
  image: { type: String, required: true }
});

export const CoachSchema = new Schema({
  name: { type: String, required: true }
});

export const PlayerLiveInfoSchema = new Schema({
  riotId: { type: String, required: true },
  riotIdGameName: { type: String, required: false },
  riotIdTagLine: { type: String, required: false },
  summonerName: { type: String, required: false },
  currentGold: { type: Number, required: false },
  championStats: {
    resourceType: { type: String, required: false },
    resourceValue: { type: Number, required: false },
    maxHealth: { type: Number, required: false },
    currentHealth: { type: Number, required: false }
  },
  timestamp: { type: Number, required: true },
  matchId: { type: String, required: true, index: true }
}, {
  timestamps: true
});
