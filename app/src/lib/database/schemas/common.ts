import { Schema } from "mongoose";

export const ImageStorageSchema = new Schema(
  {
    type: { type: String, enum: ["upload", "url"], required: true },
    data: { type: String, required: true },
    size: { type: Number, required: true },
    format: { type: String, enum: ["png", "jpg", "webp"], required: true },
  },
  { _id: false },
);

export const PlayerSchema = new Schema(
  {
    id: { type: String, required: true },
    inGameName: { type: String, required: true },
    tag: { type: String, required: true },
    role: {
      type: String,
      enum: ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"],
      required: true,
    },
    profileImage: { type: String },
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
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

export const StaffSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    role: {
      type: String,
      enum: ["coach", "analyst", "manager"],
      required: true,
    },
    contact: { type: String },
  },
  { _id: false },
);

export const ChampionSchema = new Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  key: { type: String, required: true },
  image: { type: String, required: true },
});

export const CoachSchema = new Schema({
  name: { type: String, required: true },
  id: { type: String },
});
