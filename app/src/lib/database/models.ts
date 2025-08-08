import { Schema, models, model } from "mongoose";
import {
  GameSessionSchema,
  UserSchema,
  CameraTeamSchema,
  TeamSchema,
  TournamentSchema,
  BracketSchema,
  CameraSettingsSchema,
  LoginAttemptSchema,
  SecurityEventSchema,
  MatchSchema
} from "./schemas";

export const GameSessionModel = models.GameSession || model("GameSession", GameSessionSchema);

export const UserModel = models.User || model("User", UserSchema);

export const CameraTeamModel = models.CameraTeam || model("CameraTeam", CameraTeamSchema);

export const TeamModel = models.Team || model("Team", TeamSchema);

export const TournamentModel = models.Tournament || model("Tournament", TournamentSchema);

export const BracketModel = models.Bracket || model("Bracket", BracketSchema);

export const CameraSettingsModel = models.CameraSettings || model("CameraSettings", CameraSettingsSchema);

export const ChampionModel =
  models.Champion ||
  model(
    "Champion",
    new Schema({
      id: { type: Number, required: true, unique: true },
      name: { type: String, required: true },
      key: { type: String, required: true },
      image: { type: String, required: true }
    })
  );

export const LoginAttemptModel = models.LoginAttempt || model("LoginAttempt", LoginAttemptSchema);

export const SecurityEventModel = models.SecurityEvent || model("SecurityEvent", SecurityEventSchema);

export const MatchModel = models.Match || model("Match", MatchSchema);
