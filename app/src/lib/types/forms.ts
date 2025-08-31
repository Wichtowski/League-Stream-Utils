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
