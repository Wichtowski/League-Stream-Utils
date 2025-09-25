import { ImageStorage } from "@lib/types/common";


export interface Sponsorship {
  _id: string;
  name: string;
  logo: ImageStorage;
  website?: string;
  description?: string;
  tier: "platinum" | "gold" | "silver" | "bronze";
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type { SponsorFormData } from "./forms";