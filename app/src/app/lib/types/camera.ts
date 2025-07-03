export type CameraPlayer = {
    playerId?: string;
    playerName?: string;
    inGameName?: string;
    name?: string;
    url?: string;
    imagePath?: string;
};

export type CameraTeam = {
    teamId: string;
    teamName: string;
    teamLogo?: string;
    players: CameraPlayer[];
};

export type CameraSettings = {
    userId: string;
    teams: CameraTeam[];
    globalTournamentMode?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
};