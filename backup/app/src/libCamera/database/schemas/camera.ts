import mongoose from "mongoose";

export const CameraTeamSchema = new mongoose.Schema({
  teamId: { type: String, required: true },
  teamName: { type: String, required: true },
  teamStreamUrl: { type: String, default: "" },
  players: [
    {
      playerId: { type: String, required: true },
      playerName: { type: String, required: true },
      role: { type: String, required: true },
      url: { type: String, default: "" },
      imagePath: { type: String, default: "" },
      delayedUrl: { type: String, default: "" },
      useDelay: { type: Boolean, default: false }
    }
  ]
});

export const CameraPlayerSchema = new mongoose.Schema({
  playerId: { type: String, required: true },
  playerName: { type: String, required: true },
  role: { type: String, required: true },
  url: { type: String, default: "" },
  imagePath: { type: String, default: "" },
  delayedUrl: { type: String, default: "" },
  useDelay: { type: Boolean, default: false }
});

// CameraSettingsSchema removed - camera data now stored in Team.cameras field
