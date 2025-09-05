import { Schema } from "mongoose";
import { Role } from "@lib/types/permissions";

export const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  passwordHistory: { type: [String], default: [] },
  email: { type: String, required: true, unique: true },
  isAdmin: { type: Boolean, default: false },
  globalRoles: { type: [String], enum: Object.values(Role), default: [] },
  sessionsCreatedToday: { type: Number, default: 0 },
  lastSessionDate: { type: Date, default: new Date() },
  createdAt: { type: Date, default: Date.now }
});
