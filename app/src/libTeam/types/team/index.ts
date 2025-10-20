import { Champion } from "@lib/types/game";
import { ImageStorage } from "@lib/types/common";
import { Player } from "@lib/types/game";
import { Role } from "@lib/types/permissions";

export interface Team {
  _id: string;
  name: string;
  tag: string;
  logo: ImageStorage;
  flag?: string; // ISO country code explicitly set for the team
  majorityFlag?: string; // ISO code derived from players if 3+ share same country
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
  collaborators?: Array<{
    userId: string;
    role: Role;
  }>;
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

  // Camera settings for streaming
  cameras?: {
    teamStreamUrl?: string;
    players: Array<{
      playerId: string;
      playerName: string;
      role: string;
      url?: string;
      imagePath?: string;
      delayedUrl?: string;
      useDelay?: boolean;
    }>;
    globalTournamentMode?: boolean;
    updatedAt?: Date;
  };
}

export interface TeamColors {
  primary: string;
  secondary: string;
  accent: string;
}

export interface Staff {
  _id: string;
  name: string;
  role: "coach" | "analyst" | "manager";
  contact?: string;
}

export interface Coach {
  name: string;
  _id?: string;
}

export type TeamTier = "amateur" | "semi-pro" | "professional";

export type { CreateTeamRequest } from "./requests";
