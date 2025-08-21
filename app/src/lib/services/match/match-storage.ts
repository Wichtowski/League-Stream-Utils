import { storage } from "@lib/services/common";

const LAST_SELECTED_MATCH_KEY = "last-selected-match";

export interface LastSelectedMatch {
  matchId: string;
  matchName: string;
  timestamp: number;
}

export const matchStorage = {
  async getLastSelectedMatch(): Promise<LastSelectedMatch | null> {
    return await storage.get<LastSelectedMatch>(LAST_SELECTED_MATCH_KEY);
  },

  async setLastSelectedMatch(matchId: string, matchName: string): Promise<void> {
    const data: LastSelectedMatch = {
      matchId,
      matchName,
      timestamp: Date.now()
    };
    await storage.set(LAST_SELECTED_MATCH_KEY, data);
  },

  async clearLastSelectedMatch(): Promise<void> {
    await storage.remove(LAST_SELECTED_MATCH_KEY);
  },

  async isLastSelectedMatchValid(): Promise<boolean> {
    const lastSelected = await this.getLastSelectedMatch();
    if (!lastSelected) return false;

    // Check if the data is not too old (e.g., 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return lastSelected.timestamp > thirtyDaysAgo;
  }
};
