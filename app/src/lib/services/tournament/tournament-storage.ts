import { storage } from "@lib/services/common";

const LAST_SELECTED_TOURNAMENT_KEY = "last-selected-tournament";

export interface LastSelectedTournament {
  tournamentId: string;
}

export const tournamentStorage = {
  async getLastSelectedTournament(): Promise<LastSelectedTournament | null> {
    return await storage.get<LastSelectedTournament>(LAST_SELECTED_TOURNAMENT_KEY);
  },

  async setLastSelectedTournament(tournamentId: string): Promise<void> {
    const data: LastSelectedTournament = {
      tournamentId,
    };
    await storage.set(LAST_SELECTED_TOURNAMENT_KEY, data);
  },

  async clearLastSelectedTournament(): Promise<void> {
    await storage.remove(LAST_SELECTED_TOURNAMENT_KEY);
  },
};
