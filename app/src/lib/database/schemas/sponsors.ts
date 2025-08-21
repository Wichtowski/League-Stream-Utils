import { Schema } from "mongoose";
import { ImageStorageSchema } from "./common";

export const SponsorSchema = new Schema(
{
    id: { type: String, required: true },
    name: { type: String, required: true },
    logo: { type: ImageStorageSchema, required: true },
    website: { type: String },
    tier: {
        type: String,
        enum: ["title", "presenting", "official", "partner"],
        required: true
    },
    displayPriority: { type: Number, default: 0 },
    showName: { type: Boolean, default: true },
    namePosition: { type: String, enum: ["left", "right"], default: "right" },
    fillContainer: { type: Boolean, default: false }
    },
    { _id: false }
);
