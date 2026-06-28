import { CameraConfigModel, isMongoConfigured } from "@lsu/db-mongo";

export async function getCameraConfig(teamId: string, userId: string) {
  if (!isMongoConfigured()) return null;

  return CameraConfigModel.findOne({ teamId, userId }).lean();
}

export async function getCameraConfigs(userId: string) {
  if (!isMongoConfigured()) return [];

  return CameraConfigModel.find({ userId }).lean();
}

export async function upsertCameraConfig(data: {
  teamId: string;
  userId: string;
  players: Array<{
    role: "TOP" | "JUNGLE" | "MID" | "BOTTOM" | "SUPPORT";
    streamUrl: string;
    playerName?: string;
  }>;
}) {
  return CameraConfigModel.findOneAndUpdate(
    { teamId: data.teamId, userId: data.userId },
    { $set: { players: data.players } },
    { upsert: true, new: true, lean: true },
  );
}

export async function deleteCameraConfig(teamId: string, userId: string) {
  await CameraConfigModel.deleteOne({ teamId, userId });
}
