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

export interface TickerFormData {
  title: string;
  titleBackgroundColor: string;
  titleTextColor: string;
  carouselItems: CarouselItemFormData[];
  carouselSpeed: number;
  carouselBackgroundColor: string;
}

// Utility function to create default form data
export const createDefaultTickerForm = (): TickerFormData => ({
  title: "",
  titleBackgroundColor: "#1f2937",
  titleTextColor: "#ffffff",
  carouselItems: [],
  carouselSpeed: 50,
  carouselBackgroundColor: "#1f2937",
});

export const createDefaultCarouselItemForm = (): CarouselItemFormData => ({
  text: "",
  backgroundColor: "#1f2937",
  textColor: "#ffffff",
  order: 0,
});
