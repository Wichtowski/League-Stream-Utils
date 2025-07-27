import { Schema } from 'mongoose';
import { ImageStorageSchema, PlayerSchema } from './common';
import { ChampionSchema } from './common';

const MatchTeamSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  tag: { type: String, required: true },
  logo: { type: ImageStorageSchema, required: true },
  colors: {
    primary: { type: String, required: true },
    secondary: { type: String, required: true },
    accent: { type: String, required: true }
  },
  players: { type: [PlayerSchema], required: true },
  coach: {
    name: { type: String },
    profileImage: { type: String }
  }
}, { _id: false });

const MatchCommentatorSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  xHandle: { type: String },
  assignedAt: { type: Date, required: true },
  assignedBy: { type: String, required: true }
}, { _id: false });

const MatchPredictionSchema = new Schema({
  commentatorId: { type: String, required: true },
  commentatorName: { type: String, required: true },
  prediction: { type: String, required: true },
  timestamp: { type: Date, required: true }
}, { _id: false });

const GameResultSchema = new Schema({
  id: { type: String, required: true },
  gameNumber: { type: Number, required: true },
  winner: { type: String, enum: ['blue', 'red'], required: true },
  duration: { type: Number, required: true }, // in seconds
  blueTeam: {
    kills: { type: Number, default: 0 },
    gold: { type: Number, default: 0 },
    towers: { type: Number, default: 0 },
    dragons: { type: Number, default: 0 },
    barons: { type: Number, default: 0 },
    bans: { type: [ChampionSchema], default: [] },
    picks: { type: [ChampionSchema], default: [] }
  },
  redTeam: {
    kills: { type: Number, default: 0 },
    gold: { type: Number, default: 0 },
    towers: { type: Number, default: 0 },
    dragons: { type: Number, default: 0 },
    barons: { type: Number, default: 0 },
    bans: { type: [ChampionSchema], default: [] },
    picks: { type: [ChampionSchema], default: [] }
  },
  completedAt: { type: Date, required: true }
}, { _id: false });

export const MatchSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['tournament', 'standalone'], required: true },
  
  // Tournament context (only for tournament matches)
  tournamentId: { type: String },
  tournamentName: { type: String },
  tournamentLogo: { type: ImageStorageSchema },
  bracketNodeId: { type: String },
  roundName: { type: String },
  matchNumber: { type: Number },
  
  // Teams
  blueTeam: { type: MatchTeamSchema, required: true },
  redTeam: { type: MatchTeamSchema, required: true },
  
  // Match configuration
  format: { type: String, enum: ['BO1', 'BO3', 'BO5'], required: true },
  isFearlessDraft: { type: Boolean, default: false },
  patchName: { type: String, required: true },
  
  // Scheduling
  scheduledTime: { type: Date },
  startTime: { type: Date },
  endTime: { type: Date },
  
  // Status and results
  status: { type: String, enum: ['scheduled', 'in-progress', 'completed', 'cancelled'], default: 'scheduled' },
  winner: { type: String, enum: ['blue', 'red'] },
  score: {
    blue: { type: Number, default: 0 },
    red: { type: Number, default: 0 }
  },
  
  // Game results (for BO3/BO5)
  games: { type: [GameResultSchema], default: [] },
  
  // Commentators assigned to this match
  commentators: { type: [MatchCommentatorSchema], default: [] },
  
  // Predictions
  predictions: { type: [MatchPredictionSchema], default: [] },
  
  // Metadata
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for better query performance
MatchSchema.index({ tournamentId: 1, status: 1 });
MatchSchema.index({ type: 1, status: 1 });
MatchSchema.index({ scheduledTime: 1 });
MatchSchema.index({ createdBy: 1 });
MatchSchema.index({ 'commentators.id': 1 }); 