import mongoose from 'mongoose';
import {
  GameSessionSchema,
  UserSchema,
  CameraTeamSchema,
  ChampionsCacheSchema,
  TeamSchema,
  TournamentSchema,
  BracketSchema,
  // BracketNodeSchema,
  // TimerSchema,
  // TeamSchema,
  // GameConfigSchema,
  // CameraPlayerSchema,
  CameraSettingsSchema
} from './schemas';

export const GameSession = mongoose.models.GameSession ||
  mongoose.model('GameSession', GameSessionSchema);

export const User = mongoose.models.User ||
  mongoose.model('User', UserSchema);

export const CameraTeam = mongoose.models.CameraTeam ||
  mongoose.model('CameraTeam', CameraTeamSchema);

export const ChampionsCache = mongoose.models.ChampionsCache ||
  mongoose.model('ChampionsCache', ChampionsCacheSchema);

export const Team = mongoose.models.Team ||
  mongoose.model('Team', TeamSchema);

export const Tournament = mongoose.models.Tournament ||
  mongoose.model('Tournament', TournamentSchema);

export const Bracket = mongoose.models.Bracket ||
  mongoose.model('Bracket', BracketSchema);

export const CameraSettings = mongoose.models.CameraSettings ||
  mongoose.model('CameraSettings', CameraSettingsSchema);

// Simple Champion model for caching
export const Champion = mongoose.models.Champion ||
  mongoose.model('Champion', new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    key: { type: String, required: true },
    image: { type: String, required: true }
  })); 