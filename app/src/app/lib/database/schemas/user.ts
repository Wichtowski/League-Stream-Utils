import mongoose from 'mongoose';
import { ChampionSchema } from './common';

export const UserSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    isAdmin: { type: Boolean, default: false },
    sessionsCreatedToday: { type: Number, default: 0 },
    lastSessionDate: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

export const ChampionsCacheSchema = new mongoose.Schema({
    version: { type: String, required: true, unique: true },
    champions: [ChampionSchema],
    lastUpdated: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) } // 24 hours
});
