import { Schema } from "mongoose";

export const LoginAttemptSchema = new Schema(
  {
    identifier: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true, index: true },
    success: { type: Boolean, required: true },
    userAgent: String,
    ip: String
  },
  { timestamps: true }
);

export const SecurityEventSchema = new Schema(
  {
    timestamp: { type: Date, required: true, index: true },
    event: { type: String, required: true, index: true },
    userId: { type: String, index: true },
    ip: String,
    userAgent: String,
    details: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);
