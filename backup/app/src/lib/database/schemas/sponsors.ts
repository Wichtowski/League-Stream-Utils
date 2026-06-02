import { Schema } from "mongoose";
import { ImageStorageSchema } from "./common";

export const SponsorSchema = new Schema({
  name: { type: String, required: true },
  logo: { type: ImageStorageSchema, required: true },
  description: { type: String, required: false },
  timeInSeconds: { type: Number, required: true },
  tier: { type: String, enum: ["platinum", "gold", "silver", "bronze"], required: true },
  variant: { type: String, enum: ["corner", "banner"], required: true },
  fullwidth: { type: Boolean, default: false, required: true },
  showName: { type: Boolean, default: false, required: true },
  namePosition: { type: String, enum: ["top", "bottom", "left", "right"], required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
