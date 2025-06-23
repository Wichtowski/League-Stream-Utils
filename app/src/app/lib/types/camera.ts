export type CameraPlayer = {
    playerId?: string;
    playerName?: string;
    inGameName?: string;
    name?: string;
    url?: string;
    imagePath?: string;
    delayedUrl?: string;
    teamId?: string;
    teamName?: string;
    teamLogo?: string;
    role?: string;
    useDelay?: boolean;
};

export type CameraTeam = {
    teamId: string;
    teamName: string;
    teamLogo?: string;
    players: CameraPlayer[];
    globalDelayEnabled?: boolean;
    delayMinutes?: number;
};

export type CameraSettings = {
    userId: string;
    teams: CameraTeam[];
    globalTournamentMode?: boolean;
    defaultDelayMinutes?: number;
    createdAt?: Date;
    updatedAt?: Date;
};