export type CameraPlayer = {
  playerId?: string;
  playerName?: string;
  inGameName?: string;
  name?: string;
  url?: string;
  imagePath?: string;
  role?: string;
  teamName?: string;
  teamLogo?: string;
};

export type CameraTeam = {
  teamId: string;
  teamName: string;
  teamLogo?: string;
  players: CameraPlayer[];
  teamStreamUrl?: string;
};

export type CameraSettings = {
  userId: string;
  teams: CameraTeam[];
  globalTournamentMode?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};
