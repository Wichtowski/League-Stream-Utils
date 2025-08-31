import { Schema, models, model, Model, InferSchemaType } from "mongoose";
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
  MatchSchema,
  PlayerStatsSchema
} from "./schemas";

// Lazy initialization function to ensure models are only created after connection
const getModel = <T>(name: string, schema: Schema): Model<T> => {
  try {
    // Check if we're in a browser environment and models might not be available
    if (typeof window !== "undefined" && !models) {
      return model<T>(name, schema);
    }
    const existingModel = models[name] as Model<T> | undefined;
    if (existingModel) {
      return existingModel;
    }
    return model<T>(name, schema);
  } catch (_error) {
    // Fallback to creating a new model if accessing models fails
    return model<T>(name, schema);
  }
};

export const GameSessionModel = getModel("GameSession", GameSessionSchema);

export const UserModel = getModel("User", UserSchema);

export const CameraTeamModel = getModel("CameraTeam", CameraTeamSchema);

export type TeamDoc = InferSchemaType<typeof TeamSchema>;
export const TeamModel = getModel<TeamDoc>("Team", TeamSchema);

export type TournamentDoc = InferSchemaType<typeof TournamentSchema>;
export const TournamentModel = getModel<TournamentDoc>("Tournament", TournamentSchema);

export const BracketModel = getModel("Bracket", BracketSchema);

export const CameraSettingsModel = getModel("CameraSettings", CameraSettingsSchema);

export const ChampionModel = getModel(
  "Champion",
  new Schema({
    name: { type: String, required: true },
    key: { type: String, required: true },
    image: { type: String, required: true }
  })
);

export const LoginAttemptModel = getModel("LoginAttempt", LoginAttemptSchema);

export const SecurityEventModel = getModel("SecurityEvent", SecurityEventSchema);

export const MatchModel = getModel("Match", MatchSchema);

export type PlayerStatsDoc = InferSchemaType<typeof PlayerStatsSchema>;
export const PlayerStatsModel = getModel<PlayerStatsDoc>("PlayerStats", PlayerStatsSchema);
