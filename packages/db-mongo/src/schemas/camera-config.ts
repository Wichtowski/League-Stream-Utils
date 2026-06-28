import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

interface CameraPlayerDoc {
  role: "TOP" | "JUNGLE" | "MID" | "BOTTOM" | "SUPPORT";
  streamUrl: string;
  playerName?: string;
}

interface CameraConfigFields {
  teamId: string;
  userId: string;
  players: CameraPlayerDoc[];
  updatedAt: Date;
}

export type CameraConfigDoc = mongoose.Document & CameraConfigFields;

const cameraPlayerSchema = new Schema<CameraPlayerDoc>(
  {
    role: {
      type: String,
      enum: ["TOP", "JUNGLE", "MID", "BOTTOM", "SUPPORT"],
      required: true,
    },
    streamUrl: { type: String, required: true },
    playerName: String,
  },
  { _id: false },
);

const cameraConfigSchema = new Schema<CameraConfigFields>(
  {
    teamId: { type: String, required: true },
    userId: { type: String, required: true },
    players: { type: [cameraPlayerSchema], default: [] },
  },
  { timestamps: true },
);

cameraConfigSchema.index({ teamId: 1, userId: 1 }, { unique: true });

export const CameraConfigModel =
  (models["CameraConfig"] as mongoose.Model<CameraConfigFields>) ??
  model<CameraConfigFields>("CameraConfig", cameraConfigSchema, "camera_configs");
