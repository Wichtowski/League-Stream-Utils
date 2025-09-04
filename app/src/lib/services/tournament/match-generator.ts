import type { CreateMatchRequest } from "@lib/types/match";
import type { Tournament } from "@lib/types/tournament";

export class MatchGenerator {
  /**
   * Generate matches for a tournament based on its format
   */
  static generateTournamentMatches(tournament: Tournament): CreateMatchRequest[] {
    const teams = tournament.selectedTeams.length > 0 ? tournament.selectedTeams : tournament.registeredTeams;
    
    if (teams.length < 2) {
      throw new Error("Tournament must have at least 2 teams to generate matches");
    }

    switch (tournament.tournamentFormat) {
      case "Ladder":
        return this.generateLadderMatches(tournament, teams);
      case "Swiss into Ladder":
        return this.generateSwissMatches(tournament, teams);
      case "Round Robin into Ladder":
        return this.generateRoundRobinMatches(tournament, teams);
      case "Groups":
        return this.generateGroupMatches(tournament, teams);
      default:
        throw new Error(`Unsupported tournament format: ${tournament.tournamentFormat}`);
    }
  }

  /**
   * Generate ladder matches (single elimination bracket)
   */
  private static generateLadderMatches(tournament: Tournament, teams: string[]): CreateMatchRequest[] {
    const matches: CreateMatchRequest[] = [];
    const bracketSize = this.getNextPowerOfTwo(teams.length);
    
    // Generate first round matches
    for (let i = 0; i < bracketSize / 2; i++) {
      const team1 = i * 2 < teams.length ? teams[i * 2] : undefined;
      const team2 = i * 2 + 1 < teams.length ? teams[i * 2 + 1] : undefined;

      if (team1 && team2) {
        matches.push({
          name: `Round 1 Match ${i + 1}`,
          type: "tournament",
          tournamentId: tournament._id,
          blueTeamId: team1,
          redTeamId: team2,
          format: tournament.matchFormat,
          isFearlessDraft: tournament.fearlessDraft,
          patchName: tournament.patchVersion || tournament.apiVersion || "Latest",
          scheduledTime: this.calculateMatchTime(tournament, i).toISOString(),
          createdBy: tournament.userId
        });
      }
    }

    return matches;
  }

  /**
   * Generate Swiss tournament matches
   */
  private static generateSwissMatches(tournament: Tournament, teams: string[]): CreateMatchRequest[] {
    const matches: CreateMatchRequest[] = [];
    const rounds = Math.ceil(Math.log2(teams.length));
    
    for (let round = 1; round <= rounds; round++) {
      // For Swiss, we'll pair teams based on their current standings
      // This is a simplified version - in practice, you'd need to track standings
      for (let i = 0; i < teams.length; i += 2) {
        if (i + 1 < teams.length) {
          matches.push({
            name: `Swiss Round ${round} Match ${Math.floor(i / 2) + 1}`,
            type: "tournament",
            tournamentId: tournament._id,
            blueTeamId: teams[i],
            redTeamId: teams[i + 1],
            format: tournament.phaseMatchFormats?.swiss || tournament.matchFormat,
            isFearlessDraft: tournament.fearlessDraft,
            patchName: tournament.patchVersion || tournament.apiVersion || "Latest",
            scheduledTime: this.calculateMatchTime(tournament, matches.length).toISOString(),
            createdBy: tournament.userId
          });
        }
      }
    }

    return matches;
  }

  /**
   * Generate Round Robin matches
   */
  private static generateRoundRobinMatches(tournament: Tournament, teams: string[]): CreateMatchRequest[] {
    const matches: CreateMatchRequest[] = [];
    
    // Generate all possible team pairings
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        matches.push({
          name: `Round Robin: ${teams[i]} vs ${teams[j]}`,
          type: "tournament",
          tournamentId: tournament._id,
          blueTeamId: teams[i],
          redTeamId: teams[j],
          format: tournament.phaseMatchFormats?.roundRobin || tournament.matchFormat,
          isFearlessDraft: tournament.fearlessDraft,
          patchName: tournament.patchVersion || tournament.apiVersion || "Latest",
          scheduledTime: this.calculateMatchTime(tournament, matches.length).toISOString(),
          createdBy: tournament.userId
        });
      }
    }

    return matches;
  }

  /**
   * Generate group stage matches
   */
  private static generateGroupMatches(tournament: Tournament, teams: string[]): CreateMatchRequest[] {
    const matches: CreateMatchRequest[] = [];
    const groupSize = Math.ceil(Math.sqrt(teams.length));
    const numGroups = Math.ceil(teams.length / groupSize);
    
    // Split teams into groups
    const groups: string[][] = [];
    for (let i = 0; i < numGroups; i++) {
      groups.push([]);
    }
    
    teams.forEach((team, index) => {
      const groupIndex = index % numGroups;
      groups[groupIndex].push(team);
    });

    // Generate matches within each group (round robin)
    groups.forEach((group, groupIndex) => {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          matches.push({
            name: `Group ${groupIndex + 1}: ${group[i]} vs ${group[j]}`,
            type: "tournament",
            tournamentId: tournament._id,
            blueTeamId: group[i],
            redTeamId: group[j],
            format: tournament.phaseMatchFormats?.groups || tournament.matchFormat,
            isFearlessDraft: tournament.fearlessDraft,
            patchName: tournament.patchVersion || tournament.apiVersion || "Latest",
            scheduledTime: this.calculateMatchTime(tournament, matches.length).toISOString(),
            createdBy: tournament.userId
          });
        }
      }
    });

    return matches;
  }

  /**
   * Get the next power of 2 for bracket sizing
   */
  private static getNextPowerOfTwo(n: number): number {
    let power = 1;
    while (power < n) {
      power *= 2;
    }
    return power;
  }

  /**
   * Calculate match time based on tournament schedule
   */
  private static calculateMatchTime(tournament: Tournament, matchIndex: number): Date {
    const baseDate = new Date(tournament.startDate);
    const matchDay = tournament.matchDays[matchIndex % tournament.matchDays.length];
    const [hours, minutes] = tournament.defaultMatchTime.split(':').map(Number);
    
    // Find the next occurrence of the match day
    const targetDay = this.getDayOfWeek(matchDay);
    const currentDay = baseDate.getDay();
    let daysToAdd = (targetDay - currentDay + 7) % 7;
    if (daysToAdd === 0) daysToAdd = 7;
    
    const matchDate = new Date(baseDate);
    matchDate.setDate(baseDate.getDate() + daysToAdd + Math.floor(matchIndex / tournament.matchDays.length) * 7);
    matchDate.setHours(hours, minutes, 0, 0);
    
    return matchDate;
  }

  /**
   * Convert day name to day of week number
   */
  private static getDayOfWeek(dayName: string): number {
    const days: Record<string, number> = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
      'thursday': 4, 'friday': 5, 'saturday': 6
    };
    return days[dayName.toLowerCase()] || 0;
  }
}
