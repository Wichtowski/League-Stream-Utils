import { Schema, models, model, Model, InferSchemaType } from "mongoose";
import {
  GameSessionSchema,
  UserSchema,
  CameraTeamSchema,
  BracketSchema,
  LoginAttemptSchema,
  SecurityEventSchema,
  PlayerStatsSchema,
  PlayerLiveInfoSchema
} from "./schemas";
import {
  TournamentPermissionSchema,
  UserPermissionSchema,
  PermissionAuditSchema,
  PermissionRequestSchema
} from "./schemas/permissions";

// Lazy initialization function to ensure models are only created after connection
export const getModel = <T>(name: string, schema: Schema): Model<T> => {
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

export const BracketModel = getModel("Bracket", BracketSchema);

// CameraSettings model removed - camera data now stored in Team.cameras field

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

export type PlayerStatsDoc = InferSchemaType<typeof PlayerStatsSchema>;
export const PlayerStatsModel = getModel<PlayerStatsDoc>("PlayerStats", PlayerStatsSchema);

export type PlayerLiveInfoDoc = InferSchemaType<typeof PlayerLiveInfoSchema>;
export const PlayerLiveInfoModel = getModel<PlayerLiveInfoDoc>("PlayerLiveInfo", PlayerLiveInfoSchema);

// Permission models
export type TournamentPermissionDoc = InferSchemaType<typeof TournamentPermissionSchema>;
export const TournamentPermissionModel = getModel<TournamentPermissionDoc>(
  "TournamentPermission",
  TournamentPermissionSchema
);

export type UserPermissionDoc = InferSchemaType<typeof UserPermissionSchema>;
export const UserPermissionModel = getModel<UserPermissionDoc>("UserPermission", UserPermissionSchema);

export type PermissionAuditDoc = InferSchemaType<typeof PermissionAuditSchema>;
export const PermissionAuditModel = getModel<PermissionAuditDoc>("PermissionAudit", PermissionAuditSchema);

export type PermissionRequestDoc = InferSchemaType<typeof PermissionRequestSchema>;
export const PermissionRequestModel = getModel<PermissionRequestDoc>("PermissionRequest", PermissionRequestSchema);
