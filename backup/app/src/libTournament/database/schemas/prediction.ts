import { Schema } from "mongoose";

export const MatchPredictionSchema = new Schema({
  commentatorId: { type: String, required: true },
  commentatorUsername: { type: String, required: true },
  prediction: { type: String, enum: ["blue", "red"], required: true },
  confidence: { type: Number, min: 1, max: 10, required: false },
  submittedAt: { type: Date, default: Date.now }
});

export const MatchCommentatorSchema = new Schema({
  name: { type: String, required: true },
  role: { type: String, enum: ["play-by-play", "color", "analyst"], required: true },
  email: { type: String, required: false },
  phone: { type: String, required: false },
  assignedAt: { type: Date, default: Date.now }
});
