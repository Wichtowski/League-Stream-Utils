import { SponsorFormData } from "@/libTournament/types";

export const createDefaultSponsorForm = (): SponsorFormData => ({
  name: "",
  logo: null,
  website: "",
  tier: "bronze",
  startDate: new Date(),
  endDate: new Date(),
  isActive: true
});
