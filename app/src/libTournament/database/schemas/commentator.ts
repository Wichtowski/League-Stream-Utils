import { Schema } from "mongoose";

export const CommentatorSchema = new Schema({
  name: { type: String, required: true },
  xHandle: { type: String, required: false },
  instagramHandle: { type: String, required: false },
  twitchHandle: { type: String, required: false },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

