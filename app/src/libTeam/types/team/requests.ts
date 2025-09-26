import { Player } from "@lib/types/game";
import { ImageStorage } from "@lib/types/common";
import { Staff, TeamColors, TeamTier } from "./";

export interface CreateTeamRequest {
  name: string;
  tag: string;
  logo: ImageStorage;
  colors: TeamColors;
  players: {
    main: Omit<Player, "_id" | "createdAt" | "updatedAt">[];
    substitutes: Omit<Player, "_id" | "createdAt" | "updatedAt">[];
  };
  staff?: {
    coach?: Omit<Staff, "_id">;
    analyst?: Omit<Staff, "_id">;
    manager?: Omit<Staff, "_id">;
  };
  region: string;
  tier: TeamTier;
  socialMedia?: {
    twitter?: string;
    discord?: string;
    website?: string;
  };
  // Standalone team fields
  isStandalone?: boolean;
  tournamentId?: string;
}
