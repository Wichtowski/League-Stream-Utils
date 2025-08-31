import { Champion, Coach, Player } from "./game";
import { ImageStorage } from "./common";
import { Staff, TeamTier } from "./tournament";

export interface Team {
  _id: string;
  name: string;
  tag: string;
  logo: ImageStorage;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  players: {
    main: Player[];
    substitutes: Player[];
  };
  staff?: {
    coach?: Staff;
    analyst?: Staff;
    manager?: Staff;
  };
  region: string;
  tier: TeamTier;
  founded: Date;

  socialMedia?: {
    twitter?: string;
    discord?: string;
    website?: string;
  };
  teamOwnerId?: string;
  createdAt: Date;
  updatedAt: Date;

  // Standalone team fields
  isStandalone?: boolean;
  tournamentId?: string;

  // In-game draft fields (optional so tournament objects remain valid)
  side?: "blue" | "red";
  bans?: Champion[];
  picks?: Champion[];
  isReady?: boolean;
  usedChampions?: Champion[];
  coach?: Coach;
}
