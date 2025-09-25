export interface GroupSettings {
  groupCount: number;
  teamsPerGroup: number;
  roundRobin: boolean;
  advancePerGroup: number; // Teams advancing from each group
  playoffFormat: "single-elimination" | "double-elimination";
  groupNaming: "letters" | "numbers" | "custom";
  customGroupNames?: string[];
}