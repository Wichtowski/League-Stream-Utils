export interface TournamentForm {
  tournamentName: string;
  tournamentLogo: string;
  seriesType: "BO1" | "BO3" | "BO5";
  patchName: string;
  isFearlessDraft: boolean;
  blueTeamName: string;
  blueTeamPrefix: string;
  blueTeamLogo: string;
  blueCoachName: string;
  redTeamName: string;
  redTeamPrefix: string;
  redTeamLogo: string;
  redCoachName: string;
}

export interface SponsorFormData {
  name: string;
  logo: import("./common").ImageStorage | null;
  website: string;
  tier: "platinum" | "gold" | "silver" | "bronze";
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

export interface CarouselItemFormData {
  text: string;
  backgroundColor: string;
  textColor: string;
  order: number;
}

export interface StreamBannerFormData {
  title: string;
  carouselItems: CarouselItemFormData[];
  displayDuration: number;
  carouselSpeed: number;
  isActive: boolean;
  priority: number;
}

// Utility function to create default form data
export const createDefaultStreamBannerForm = (): StreamBannerFormData => ({
  title: "",
  carouselItems: [],
  displayDuration: 5,
  carouselSpeed: 50,
  isActive: true,
  priority: 0,
});

export const createDefaultCarouselItemForm = (): CarouselItemFormData => ({
  text: "",
  backgroundColor: "#1f2937",
  textColor: "#ffffff",
  order: 0,
});
