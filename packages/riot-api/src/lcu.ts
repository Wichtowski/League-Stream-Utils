const LCU_ENDPOINTS = {
  currentSummoner: '/lol-summoner/v1/current-summoner',
  champSelect: '/lol-champ-select/v1/session',
  gameflowPhase: '/lol-gameflow/v1/gameflow-phase',
} as const;

interface LCUCredentials {
  port: number;
  password: string;
  protocol: string;
}

function authHeader(password: string) {
  return 'Basic ' + btoa(`riot:${password}`);
}

export async function lcuFetch<T>(
  credentials: LCUCredentials,
  endpoint: string,
): Promise<T> {
  const url = `${credentials.protocol}://127.0.0.1:${credentials.port}${endpoint}`;
  const res = await fetch(url, {
    headers: { Authorization: authHeader(credentials.password) },
    // @ts-expect-error -- Node.js fetch accepts this for self-signed certs
    agent: undefined,
  });
  if (!res.ok) throw new Error(`LCU ${res.status}: ${endpoint}`);
  return res.json();
}

export async function getCurrentSummoner(credentials: LCUCredentials) {
  return lcuFetch<{
    displayName: string;
    puuid: string;
    summonerId: number;
    summonerLevel: number;
    profileIconId: number;
  }>(credentials, LCU_ENDPOINTS.currentSummoner);
}

export async function getChampSelectSession(credentials: LCUCredentials) {
  return lcuFetch<{
    actions: Array<Array<{
      id: number;
      type: 'ban' | 'pick';
      championId: number;
      completed: boolean;
      actorCellId: number;
    }>>;
    myTeam: Array<{ cellId: number; championId: number; summonerId: number }>;
    theirTeam: Array<{ cellId: number; championId: number; summonerId: number }>;
    timer: { phase: string; adjustedTimeLeftInPhase: number };
  }>(credentials, LCU_ENDPOINTS.champSelect);
}

export async function getGameflowPhase(credentials: LCUCredentials): Promise<string> {
  return lcuFetch<string>(credentials, LCU_ENDPOINTS.gameflowPhase);
}

export function parseLockfile(content: string): LCUCredentials | null {
  const parts = content.trim().split(':');
  if (parts.length < 5) return null;
  return {
    port: parseInt(parts[2], 10),
    password: parts[3],
    protocol: parts[4],
  };
}

export function extractBans(session: Awaited<ReturnType<typeof getChampSelectSession>>) {
  const myTeamCellIds = new Set(session.myTeam.map((p) => p.cellId));
  const myTeamBans: number[] = [];
  const theirTeamBans: number[] = [];

  for (const actionGroup of session.actions) {
    for (const action of actionGroup) {
      if (action.type === 'ban' && action.completed && action.championId > 0) {
        if (myTeamCellIds.has(action.actorCellId)) {
          myTeamBans.push(action.championId);
        } else {
          theirTeamBans.push(action.championId);
        }
      }
    }
  }

  return { myTeamBans, theirTeamBans };
}
