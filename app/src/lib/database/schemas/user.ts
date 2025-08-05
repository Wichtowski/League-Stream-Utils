import { Schema } from "mongoose";

export const UserSchema = new Schema({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  passwordHistory: { type: [String], default: [] },
  email: { type: String, required: true, unique: true },
  isAdmin: { type: Boolean, default: false },
  sessionsCreatedToday: { type: Number, default: 0 },
  lastSessionDate: { type: Date, default: new Date() },
  createdAt: { type: Date, default: Date.now },
});
