import { Champion } from "@lib/types/game";
import { ImageStorage } from "@lib/types/common";
import { Player } from "@lib/types/game";

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

export type { UpdateMatchResultRequest, CreateTeamRequest } from "./requests";