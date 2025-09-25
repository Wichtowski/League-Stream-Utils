export interface CameraPlayer {
  playerId?: string;
  playerName?: string;
  inGameName?: string;
  name?: string;
  url?: string;
  imagePath?: string;
  role?: string;
  teamName?: string;
  teamLogo?: string;
}

export interface CameraTeam {
  teamId: string;
  teamName: string;
  teamLogo?: string;
  players: CameraPlayer[];
  teamStreamUrl?: string;
}

export interface CameraSettings {
  userId: string;
  teams: CameraTeam[];
  globalTournamentMode?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
