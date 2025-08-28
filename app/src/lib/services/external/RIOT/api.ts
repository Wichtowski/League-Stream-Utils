import NodeCache from "node-cache";
import { config } from "@lib/services/system/config";
import { SummonerData, RankedData, ChampionMastery, MatchData, RiotPlayer } from "@lib/types/riot";

class RiotAPIService {
  private cache: NodeCache;
  private rateLimiter: Map<string, number[]> = new Map();
  private readonly RATE_LIMIT_PERSONAL = 100;
  private readonly RATE_LIMIT_WINDOW = 120000;

  constructor() {
    this.cache = new NodeCache({
      stdTTL: 3600,
      checkperiod: 600
    });
  }

  private getRiotAPIKey(): string {
    const apiKey = config.riot.apiKey;
    if (!apiKey) {
      // On client side or when API key is not configured, return empty string
      // This will cause API calls to fail gracefully
      if (typeof window !== "undefined") {
        return "";
      }
      throw new Error("RIOT_API_KEY environment variable is not set");
    }
    return apiKey;
  }

  private async checkRateLimit(region: string): Promise<void> {
    const now = Date.now();
    const key = `rate_limit_${region}`;

    if (!this.rateLimiter.has(key)) {
      this.rateLimiter.set(key, []);
    }

    const requests = this.rateLimiter.get(key)!;

    // Remove requests older than the window
    const validRequests = requests.filter((time) => now - time < this.RATE_LIMIT_WINDOW);

    if (validRequests.length >= this.RATE_LIMIT_PERSONAL) {
      const oldestRequest = Math.min(...validRequests);
      const waitTime = this.RATE_LIMIT_WINDOW - (now - oldestRequest);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return this.checkRateLimit(region);
    }

    validRequests.push(now);
    this.rateLimiter.set(key, validRequests);
  }

  private async makeRequest<T>(url: string, region: string = "europe"): Promise<T> {
    await this.checkRateLimit(region);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "X-Riot-Token": this.getRiotAPIKey()
        }
      });
      return response.json();
    } catch (error: unknown) {
      if (error instanceof Error && "response" in error) {
        const errorWithResponse = error as Error & {
          response?: { status: number; headers: Record<string, string> };
        };
        if (errorWithResponse.response?.status === 429) {
          const retryAfter = parseInt(errorWithResponse.response.headers["retry-after"] || "1");
          await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
          return this.makeRequest<T>(url, region);
        }
      }
      throw error;
    }
  }

  async getLatestGameVersion(): Promise<string> {
    const cacheKey = "game_version";
    const cached = this.cache.get<string>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const versions = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
      const latestVersion = (await versions.json())[0];

      // Cache for 24 hours
      this.cache.set(cacheKey, latestVersion, 86400);
      return latestVersion;
    } catch (error) {
      console.error("Failed to fetch game version:", error);
      return "14.24.1"; // Fallback version
    }
  }

  async getPlayerByRiotId(gameName: string, tagLine: string, region: string = "europe"): Promise<RiotPlayer> {
    const cacheKey = `player_${gameName}_${tagLine}_${region}`;
    const cached = this.cache.get<RiotPlayer>(cacheKey);

    if (cached) {
      return cached;
    }

    const url = `https://${region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    const player = await this.makeRequest<RiotPlayer>(url, region);

    // Cache for 1 hour
    this.cache.set(cacheKey, player, 3600);
    return player;
  }

  async getSummonerByPuuid(puuid: string, region: string = "euw1"): Promise<SummonerData> {
    const cacheKey = `summoner_${puuid}_${region}`;
    const cached = this.cache.get<SummonerData>(cacheKey);

    if (cached) {
      return cached;
    }

    const url = `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
    const summoner = await this.makeRequest<SummonerData>(url, region);

    // Cache for 1 hour
    this.cache.set(cacheKey, summoner, 3600);
    return summoner;
  }

  async getRankedData(summonerId: string, region: string = "euw1"): Promise<RankedData[]> {
    const cacheKey = `ranked_${summonerId}_${region}`;
    const cached = this.cache.get<RankedData[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const url = `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`;
    const rankedData = await this.makeRequest<RankedData[]>(url, region);

    // Cache for 30 minutes
    this.cache.set(cacheKey, rankedData, 1800);
    return rankedData;
  }

  async getChampionMastery(puuid: string, region: string = "euw1"): Promise<ChampionMastery[]> {
    const cacheKey = `mastery_${puuid}_${region}`;
    const cached = this.cache.get<ChampionMastery[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const url = `https://${region}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}`;
    const masteryData = await this.makeRequest<ChampionMastery[]>(url, region);

    // Cache for 2 hours
    this.cache.set(cacheKey, masteryData, 7200);
    return masteryData;
  }

  async getRecentMatches(puuid: string, count: number = 5, region: string = "europe"): Promise<string[]> {
    const cacheKey = `matches_${puuid}_${count}_${region}`;
    const cached = this.cache.get<string[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const url = `https://${region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${count}`;
    const matchIds = await this.makeRequest<string[]>(url, region);

    // Cache for 15 minutes
    this.cache.set(cacheKey, matchIds, 900);
    return matchIds;
  }

  async getMatchDetails(matchId: string, region: string = "europe"): Promise<MatchData> {
    const cacheKey = `match_${matchId}_${region}`;
    const cached = this.cache.get<MatchData>(cacheKey);

    if (cached) {
      return cached;
    }

    const url = `https://${region}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
    const matchData = await this.makeRequest<MatchData>(url, region);

    // Cache for 30 minutes
    this.cache.set(cacheKey, matchData, 1800);
    return matchData;
  }

  async verifyPlayer(
    gameName: string,
    tagLine: string,
    expectedPuuid?: string
  ): Promise<{
    verified: boolean;
    player?: RiotPlayer;
    summoner?: SummonerData;
    rankedData?: RankedData[];
    error?: string;
  }> {
    try {
      const player = await this.getPlayerByRiotId(gameName, tagLine);

      // If expected PUUID is provided, verify it matches
      if (expectedPuuid && player.puuid !== expectedPuuid) {
        return {
          verified: false,
          error: "PUUID mismatch - player identity could not be verified"
        };
      }

      const summoner = await this.getSummonerByPuuid(player.puuid);
      const rankedData = await this.getRankedData(summoner.puuid);

      return {
        verified: true,
        player,
        summoner,
        rankedData
      };
    } catch (error: unknown) {
      console.error("Player verification failed:", error);
      return {
        verified: false,
        error: error instanceof Error ? error.message : "Verification failed"
      };
    }
  }

  async getPlayerStats(puuid: string): Promise<{
    summoner: SummonerData;
    rankedData: RankedData[];
    championMastery: ChampionMastery[];
    recentMatches: MatchData[];
  }> {
    const summoner = await this.getSummonerByPuuid(puuid);
    const rankedData = await this.getRankedData(summoner.puuid);
    const championMastery = await this.getChampionMastery(puuid);

    const matchIds = await this.getRecentMatches(puuid, 3);
    const recentMatches = await Promise.all(matchIds.map((matchId) => this.getMatchDetails(matchId)));

    return {
      summoner,
      rankedData,
      championMastery: championMastery.slice(0, 10),
      recentMatches
    };
  }

  getRankString(rankedData: RankedData[] | undefined): string {
    if (!rankedData || !Array.isArray(rankedData)) {
      return "Unranked";
    }

    const soloQueue = rankedData.find((r) => r.queueType === "RANKED_SOLO_5x5");
    if (!soloQueue) return "Unranked";

    return `${soloQueue.tier} ${soloQueue.rank} (${soloQueue.leaguePoints} LP)`;
  }

  clearCache(): void {
    this.cache.flushAll();
    this.rateLimiter.clear();
  }

  getCacheStats(): { keys: number; hits: number; misses: number } {
    return this.cache.getStats();
  }
}

export const riotAPI = new RiotAPIService();
