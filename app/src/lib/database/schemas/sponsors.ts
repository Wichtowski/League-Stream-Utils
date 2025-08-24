import { Schema } from "mongoose";
import { ImageStorageSchema } from "./common";

export const SponsorSchema = new Schema({
  name: { type: String, required: true },
  logo: { type: ImageStorageSchema, required: true },
  website: { type: String, required: false },
  description: { type: String, required: false },
  tier: {
    type: String,
    enum: ["platinum", "gold", "silver", "bronze"],
    required: true
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
