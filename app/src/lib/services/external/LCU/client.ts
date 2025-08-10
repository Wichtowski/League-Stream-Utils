interface LCUCredentials {
  port: string;
  password: string;
  protocol: string;
}

interface LCUError extends Error {
  status?: number;
  code?: string;
}

export class LCUClient {
  private credentials: LCUCredentials | null = null;
  private baseUrl: string | null = null;
  private authHeader: string | null = null;

  constructor(credentials?: LCUCredentials) {
    if (credentials) {
      this.setCredentials(credentials);
    }
  }

  setCredentials(credentials: LCUCredentials): void {
    this.credentials = credentials;
    this.baseUrl = `${credentials.protocol}://127.0.0.1:${credentials.port}`;
    this.authHeader = `Basic ${btoa(`riot:${credentials.password}`)}`;
  }

  async request<T = unknown>(
    endpoint: string,
    method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE" = "GET",
    body?: unknown
  ): Promise<T> {
    if (!this.baseUrl || !this.authHeader) {
      throw new Error("LCU credentials not set. Call setCredentials() first.");
    }

    const url = `${this.baseUrl}${endpoint}`;

    // For Node.js environments, create an agent that ignores SSL certificate errors
    const requestOptions: RequestInit = {
      method,
      headers: {
        Authorization: this.authHeader,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: body ? JSON.stringify(body) : undefined
    };

    // In Node.js environment, handle SSL certificate issues
    if (typeof window === "undefined") {
      try {
        const https = await import("https");
        const agent = new https.Agent({
          rejectUnauthorized: false // Ignore self-signed certificate
        });
        // @ts-expect-error - agent property exists but TypeScript doesn't know about it
        requestOptions.agent = agent;
      } catch {
        // If https import fails, continue without agent (browser environment)
      }
    }

    const response = await fetch(url, requestOptions);

    if (!response.ok) {
      const error: LCUError = new Error(`LCU request failed: ${response.status} ${response.statusText}`);
      error.status = response.status;
      throw error;
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return (await response.json()) as T;
    }

    return (await response.text()) as T;
  }

  // Convenient method wrappers
  async get<T = unknown>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, "GET");
  }

  async post<T = unknown>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, "POST", body);
  }

  async patch<T = unknown>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, "PATCH", body);
  }

  async put<T = unknown>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, "PUT", body);
  }

  async delete<T = unknown>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, "DELETE");
  }

  // Test connection to LCU
  async testConnection(): Promise<boolean> {
    try {
      await this.get("/lol-summoner/v1/current-summoner");
      return true;
    } catch {
      return false;
    }
  }

  // Get current summoner info
  async getCurrentSummoner(): Promise<{
    displayName: string;
    summonerId: number;
    puuid: string;
    summonerLevel: number;
    profileIconId: number;
  }> {
    return this.get("/lol-summoner/v1/current-summoner");
  }

  // Get champion select session
  async getChampSelectSession(): Promise<{
    phase: string;
    timer: {
      adjustedTimeLeftInPhase: number;
      totalTimeInPhase: number;
      phase: string;
      isInfinite: boolean;
    };
    myTeam: Array<{
      cellId: number;
      championId: number;
      summonerId: number;
      summonerName: string;
      puuid: string;
      isBot: boolean;
      isActingNow: boolean;
      pickTurn: number;
      banTurn: number;
      team: number;
    }>;
    theirTeam: Array<{
      cellId: number;
      championId: number;
      summonerId: number;
      summonerName: string;
      puuid: string;
      isBot: boolean;
      isActingNow: boolean;
      pickTurn: number;
      banTurn: number;
      team: number;
    }>;
    trades: unknown[];
    actions: Array<
      Array<{
        id: number;
        actorCellId: number;
        championId: number;
        completed: boolean;
        type: "pick" | "ban";
        isInProgress: boolean;
      }>
    >;
    bans: {
      myTeamBans: number[];
      theirTeamBans: number[];
    };
    localPlayerCellId: number;
    isSpectating: boolean;
  }> {
    return this.get("/lol-champ-select/v1/session");
  }

  // Get gameflow phase
  async getGameflowPhase(): Promise<string> {
    return this.get("/lol-gameflow/v1/gameflow-phase");
  }

  // Get live game stats (if in game)
  async getLiveGameStats(): Promise<{
    gameMode: string;
    gameTime: number;
    mapName: string;
    mapNumber: number;
  }> {
    // Note: This would typically require connecting to the Game Client API
    // which runs on a different port (usually 2999)
    return this.get("/liveclientdata/gamestats");
  }
}

// Utility function to get LCU credentials from our API
export async function getLCUCredentials(): Promise<LCUCredentials> {
  const response = await fetch("/api/v1/pickban/leagueclient/lcu-credentials");

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to get LCU credentials");
  }

  const data = await response.json();
  return {
    port: data.credentials.port,
    password: data.credentials.password,
    protocol: data.credentials.protocol
  };
}

// Create a global LCU client instance
export const lcuClient = new LCUClient();
