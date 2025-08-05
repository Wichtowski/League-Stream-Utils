import { storage } from "./storage";

const LAST_SELECTED_TOURNAMENT_KEY = "last-selected-tournament";

export interface LastSelectedTournament {
  tournamentId: string;
  tournamentName: string;
  timestamp: number;
}

export const tournamentStorage = {
  async getLastSelectedTournament(): Promise<LastSelectedTournament | null> {
    return await storage.get<LastSelectedTournament>(
      LAST_SELECTED_TOURNAMENT_KEY,
    );
  },

  async setLastSelectedTournament(
    tournamentId: string,
    tournamentName: string,
  ): Promise<void> {
    const data: LastSelectedTournament = {
      tournamentId,
      tournamentName,
      timestamp: Date.now(),
    };
    await storage.set(LAST_SELECTED_TOURNAMENT_KEY, data);
  },

  async clearLastSelectedTournament(): Promise<void> {
    await storage.remove(LAST_SELECTED_TOURNAMENT_KEY);
  },

  async isLastSelectedTournamentValid(): Promise<boolean> {
    const lastSelected = await this.getLastSelectedTournament();
    if (!lastSelected) return false;

    // Check if the data is not too old (e.g., 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return lastSelected.timestamp > thirtyDaysAgo;
  },
};
