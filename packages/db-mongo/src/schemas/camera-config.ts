import mongoose from "mongoose";

const { Schema, model, models } = mongoose;
type Document = mongoose.Document;

interface CameraPlayerDoc {
  role: "TOP" | "JUNGLE" | "MID" | "BOTTOM" | "SUPPORT";
  streamUrl: string;
  playerName?: string;
}

export interface CameraConfigDoc extends Document {
  teamId: string;
  userId: string;
  players: CameraPlayerDoc[];
  updatedAt: Date;
}

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

const cameraConfigSchema = new Schema<CameraConfigDoc>(
  {
    teamId: { type: String, required: true },
    userId: { type: String, required: true },
    players: { type: [cameraPlayerSchema], default: [] },
  },
  { timestamps: true },
);

cameraConfigSchema.index({ teamId: 1, userId: 1 }, { unique: true });

export const CameraConfigModel =
  (models["CameraConfig"] as ReturnType<typeof model<CameraConfigDoc>>) ??
  model<CameraConfigDoc>("CameraConfig", cameraConfigSchema, "camera_configs");
