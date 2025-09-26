import type { ImageStorage } from "@lib/types/common";

export interface SponsorFormData {
  name: string;
  logo: ImageStorage | null;
  website: string;
  tier: "platinum" | "gold" | "silver" | "bronze";
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}
