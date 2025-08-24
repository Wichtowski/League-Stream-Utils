import { Schema } from "mongoose";

export const ImageStorageSchema = new Schema(
  {
    url: { type: String, required: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now }
  }
);

export const PlayerSchema = new Schema(
  {
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
    verified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }
);

export const StaffSchema = new Schema(
  {
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
  }
);

export const ChampionSchema = new Schema({
  name: { type: String, required: true },
  key: { type: String, required: true },
  image: { type: String, required: true }
});

export const CoachSchema = new Schema({
  name: { type: String, required: true }
});
