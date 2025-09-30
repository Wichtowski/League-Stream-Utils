import { SponsorFormData } from "@/libTournament/types";

export const createDefaultSponsorForm = (): SponsorFormData => ({
  name: "",
  logo: null,
  tier: "bronze",
  timeInSeconds: 3,
  variant: "corner",
  fullwidth: false
});
