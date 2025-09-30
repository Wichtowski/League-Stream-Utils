import type { ImageStorage } from "@lib/types/common";

export interface SponsorFormData {
  name: string;
  logo: ImageStorage | null;
  tier: "platinum" | "gold" | "silver" | "bronze";
  timeInSeconds?: number;
  variant?: "corner" | "banner";
  fullwidth?: boolean;
  showName?: boolean;
  namePosition?: "top" | "bottom" | "left" | "right";
}
