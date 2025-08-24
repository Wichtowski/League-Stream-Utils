export interface RiotPlayer {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface SummonerData {
  _id: string;
  accountId: string;
  puuid: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
}

export interface RiotAPIResponse {
  success: boolean;
  verified: boolean;
  player?: RiotPlayer;
  summoner?: SummonerData;
  rankedData?: RankedData[];
  rank?: string;
  stats?: {
    championMastery: ChampionMastery[];
    recentMatches: MatchData[];
    rankedData: RankedData[];
  };
  statsError?: string;
}

export interface RankedData {
  leagueId: string;
  queueType: string;
  tier: string;
  rank: string;
  summonerId: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  veteran: boolean;
  inactive: boolean;
  freshBlood: boolean;
  hotStreak: boolean;
}

export interface ChampionMastery {
  championId: number;
  championLevel: number;
  championPoints: number;
  lastPlayTime: number;
  championPointsSinceLastLevel: number;
  championPointsUntilNextLevel: number;
  tokensEarned: number;
}

export interface MatchData {
  metadata: {
    matchId: string;
    dataVersion: string;
    participants: string[];
  };
  info: {
    gameCreation: number;
    gameDuration: number;
    gameEndTimestamp: number;
    gameId: number;
    gameMode: string;
    gameName: string;
    gameStartTimestamp: number;
    gameType: string;
    gameVersion: string;
    mapId: number;
    participants: Array<{
      puuid: string;
      championId: number;
      championName: string;
      teamId: number;
      win: boolean;
      kills: number;
      deaths: number;
      assists: number;
    }>;
    platformId: string;
    queueId: number;
    teams: Array<{
      teamId: number;
      win: boolean;
    }>;
    tournamentCode: string;
  };
}
