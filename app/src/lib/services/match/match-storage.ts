import { storage } from "@lib/services/common";

const LAST_SELECTED_MATCH_KEY = "last-selected-match";

export interface LastSelectedMatch {
  matchId: string;
}

export const matchStorage = {
  async getLastSelectedMatch(): Promise<LastSelectedMatch | null> {
    return await storage.get<LastSelectedMatch>(LAST_SELECTED_MATCH_KEY);
  },

  async setLastSelectedMatch(matchId: string): Promise<void> {
    const data: LastSelectedMatch = {
      matchId,
    };
    await storage.set(LAST_SELECTED_MATCH_KEY, data);
  },

  async clearLastSelectedMatch(): Promise<void> {
    await storage.remove(LAST_SELECTED_MATCH_KEY);
  },

};
