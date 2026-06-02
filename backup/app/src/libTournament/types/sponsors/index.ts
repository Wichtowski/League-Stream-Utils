import { ImageStorage } from "@lib/types/common";

export interface Sponsorship {
  _id: string;
  name: string;
  logo: ImageStorage;
  description?: string;
  tier: "platinum" | "gold" | "silver" | "bronze";
  timeInSeconds?: number;
  variant?: "corner" | "banner";
  fullwidth?: boolean;
  showName?: boolean;
  namePosition?: "top" | "bottom" | "left" | "right";
  createdAt: Date;
  updatedAt: Date;
}

export type { SponsorFormData } from "./forms";
