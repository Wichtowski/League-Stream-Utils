import type { PlayerRole } from "./team";

export interface CameraConfig {
  id: string;
  teamId: string;
  userId: string;
  players: {
    role: PlayerRole;
    streamUrl: string;
    playerName?: string;
  }[];
  updatedAt: Date;
}
