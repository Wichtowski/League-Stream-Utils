import { v4 as uuidv4 } from "uuid";
import type {
  BracketStructure,
  BracketNode,
  BracketSettings,
} from "@lib/types/tournament";

export class BracketGenerator {
  /**
   * Generate a complete bracket structure for a tournament
   */
  static generateBracket(
    tournamentId: string,
    teams: string[],
    settings: BracketSettings,
  ): BracketStructure {
    const teamsCount = teams.length;

    // Ensure we have a power of 2 for proper bracket structure
    const bracketSize = this.getNextPowerOfTwo(teamsCount);
    const seededTeams = this.seedTeams(teams, settings.seeding);

    if (settings.type === "single") {
      return this.generateSingleElimination(
        tournamentId,
        seededTeams,
        bracketSize,
        settings,
      );
    } else {
      return this.generateDoubleElimination(
        tournamentId,
        seededTeams,
        bracketSize,
        settings,
      );
    }
  }

  /**
   * Generate single elimination bracket
   */
  private static generateSingleElimination(
    tournamentId: string,
    teams: string[],
    bracketSize: number,
    _settings: BracketSettings,
  ): BracketStructure {
    const nodes: BracketNode[] = [];
    const totalRounds = Math.log2(bracketSize);

    // Generate first round matches
    for (let i = 0; i < bracketSize / 2; i++) {
      const team1 = i * 2 < teams.length ? teams[i * 2] : undefined;
      const team2 = i * 2 + 1 < teams.length ? teams[i * 2 + 1] : undefined;

      const node: BracketNode = {
        id: uuidv4(),
        round: 1,
        position: i,
        team1,
        team2,
        status: team1 && team2 ? "pending" : "completed",
        bracketType: "winner",
      };

      // Auto-advance if only one team
      if (team1 && !team2) {
        node.winner = team1;
        node.status = "completed";
      }

      nodes.push(node);
    }

    // Generate subsequent rounds
    for (let round = 2; round <= totalRounds; round++) {
      const matchesInRound = Math.pow(2, totalRounds - round);

      for (let i = 0; i < matchesInRound; i++) {
        const node: BracketNode = {
          id: uuidv4(),
          round,
          position: i,
          status: "pending",
          bracketType: round === totalRounds ? "grand-final" : "winner",
        };
        nodes.push(node);
      }
    }

    // Set up advancement paths
    this.setupSingleEliminationPaths(nodes, totalRounds);

    return {
      id: uuidv4(),
      tournamentId,
      format: "single-elimination",
      nodes,
      metadata: {
        totalRounds,
        teamsCount: teams.length,
        currentRound: 1,
        status: "setup",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Generate double elimination bracket
   */
  private static generateDoubleElimination(
    tournamentId: string,
    teams: string[],
    bracketSize: number,
    settings: BracketSettings,
  ): BracketStructure {
    const nodes: BracketNode[] = [];
    const winnerBracketRounds = Math.log2(bracketSize);

    // Generate winner bracket
    const winnerNodes = this.generateWinnerBracket(teams, bracketSize);
    nodes.push(...winnerNodes);

    // Generate loser bracket
    const loserNodes = this.generateLoserBracket(bracketSize);
    nodes.push(...loserNodes);

    // Generate grand finals
    const grandFinals: BracketNode = {
      id: uuidv4(),
      round: winnerBracketRounds + 1,
      position: 0,
      status: "pending",
      bracketType: "grand-final",
    };
    nodes.push(grandFinals);

    // Generate grand finals reset match if enabled
    if (settings.grandFinalReset) {
      const grandFinalsReset: BracketNode = {
        id: uuidv4(),
        round: winnerBracketRounds + 2,
        position: 0,
        status: "pending",
        bracketType: "grand-final",
      };
      nodes.push(grandFinalsReset);
    }

    return {
      id: uuidv4(),
      tournamentId,
      format: "double-elimination",
      nodes,
      metadata: {
        totalRounds: winnerBracketRounds + (settings.grandFinalReset ? 2 : 1),
        teamsCount: teams.length,
        currentRound: 1,
        status: "setup",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Generate winner bracket nodes
   */
  private static generateWinnerBracket(
    teams: string[],
    bracketSize: number,
  ): BracketNode[] {
    const nodes: BracketNode[] = [];
    const totalRounds = Math.log2(bracketSize);

    // First round
    for (let i = 0; i < bracketSize / 2; i++) {
      const team1 = i * 2 < teams.length ? teams[i * 2] : undefined;
      const team2 = i * 2 + 1 < teams.length ? teams[i * 2 + 1] : undefined;

      const node: BracketNode = {
        id: uuidv4(),
        round: 1,
        position: i,
        team1,
        team2,
        status: team1 && team2 ? "pending" : "completed",
        bracketType: "winner",
      };

      if (team1 && !team2) {
        node.winner = team1;
        node.status = "completed";
      }

      nodes.push(node);
    }

    // Subsequent rounds
    for (let round = 2; round <= totalRounds; round++) {
      const matchesInRound = Math.pow(2, totalRounds - round);

      for (let i = 0; i < matchesInRound; i++) {
        const node: BracketNode = {
          id: uuidv4(),
          round,
          position: i,
          status: "pending",
          bracketType: "winner",
        };
        nodes.push(node);
      }
    }

    return nodes;
  }

  /**
   * Generate loser bracket nodes
   */
  private static generateLoserBracket(bracketSize: number): BracketNode[] {
    const nodes: BracketNode[] = [];
    const loserRounds = Math.log2(bracketSize) * 2 - 1;

    for (let round = 1; round <= loserRounds; round++) {
      let matchesInRound: number;

      if (round % 2 === 1) {
        // Odd rounds: teams from winner bracket drop in
        matchesInRound = bracketSize / Math.pow(2, Math.ceil(round / 2) + 1);
      } else {
        // Even rounds: continuation matches
        matchesInRound = bracketSize / Math.pow(2, round / 2 + 2);
      }

      for (let i = 0; i < matchesInRound; i++) {
        const node: BracketNode = {
          id: uuidv4(),
          round,
          position: i,
          status: "pending",
          bracketType: "loser",
        };
        nodes.push(node);
      }
    }

    return nodes;
  }

  /**
   * Setup advancement paths for single elimination
   */
  private static setupSingleEliminationPaths(
    nodes: BracketNode[],
    totalRounds: number,
  ): void {
    for (let round = 1; round < totalRounds; round++) {
      const currentRoundNodes = nodes.filter(
        (n) => n.round === round && n.bracketType === "winner",
      );
      const nextRoundNodes = nodes.filter(
        (n) => n.round === round + 1 && n.bracketType === "winner",
      );

      currentRoundNodes.forEach((node, index) => {
        const nextMatchIndex = Math.floor(index / 2);
        if (nextRoundNodes[nextMatchIndex]) {
          node.nextMatchId = nextRoundNodes[nextMatchIndex].id;
        }
      });
    }
  }

  /**
   * Seed teams based on seeding method
   */
  private static seedTeams(
    teams: string[],
    seedingMethod: BracketSettings["seeding"],
  ): string[] {
    switch (seedingMethod) {
      case "random":
        return [...teams].sort(() => Math.random() - 0.5);
      case "ranked":
        // TODO: Implement ranking-based seeding when team rankings are available
        return teams;
      case "manual":
      default:
        return teams;
    }
  }

  /**
   * Get the next power of 2 that accommodates all teams
   */
  private static getNextPowerOfTwo(n: number): number {
    return Math.pow(2, Math.ceil(Math.log2(n)));
  }

  /**
   * Advance a team in the bracket after a match result
   */
  static advanceTeam(
    bracket: BracketStructure,
    matchId: string,
    winner: string,
    _loser?: string,
  ): BracketStructure {
    const updatedNodes = [...bracket.nodes];
    const matchNode = updatedNodes.find((n) => n.id === matchId);

    if (!matchNode) {
      throw new Error("Match not found");
    }

    // Update the completed match
    matchNode.winner = winner;
    matchNode.status = "completed";
    matchNode.completedAt = new Date();

    // Advance winner to next match
    if (matchNode.nextMatchId) {
      const nextMatch = updatedNodes.find(
        (n) => n.id === matchNode.nextMatchId,
      );
      if (nextMatch) {
        if (!nextMatch.team1) {
          nextMatch.team1 = winner;
        } else if (!nextMatch.team2) {
          nextMatch.team2 = winner;
        }
      }
    }

    return {
      ...bracket,
      nodes: updatedNodes,
      updatedAt: new Date(),
    };
  }

  /**
   * Get matches ready to be played
   */
  static getReadyMatches(bracket: BracketStructure): BracketNode[] {
    return bracket.nodes.filter(
      (node) => node.status === "pending" && node.team1 && node.team2,
    );
  }

  /**
   * Check if bracket is complete
   */
  static isBracketComplete(bracket: BracketStructure): boolean {
    const finalMatch = bracket.nodes.find(
      (node) => node.bracketType === "grand-final",
    );

    return finalMatch?.status === "completed" && !!finalMatch.winner;
  }
}
