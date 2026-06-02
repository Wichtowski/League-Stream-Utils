#!/usr/bin/env bun
/**
 * League of Legends In-Game Data Explorer
 *
 * Discovers & connects to all local League APIs:
 *   1. LCU REST API   – dynamic port from lockfile / process list
 *   2. LCU WebSocket  – real-time events (champ select, gameflow, chat, etc.)
 *   3. Live Client Data API – port 2999, available only during active game
 *
 * Run:  bun scripts/league-game-data-explorer.ts
 *
 * Flags:
 *   --poll-interval <ms>    Live Client polling interval (default: 1000)
 *   --log-file <path>       Write JSON event log to a file
 *   --no-websocket          Skip LCU WebSocket connection
 *   --no-liveclient         Skip Live Client Data polling
 *   --dump-endpoints        Dump all discoverable LCU endpoints and exit
 */

import { execSync } from 'node:child_process';
import { readFileSync, existsSync, appendFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// ─────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────

interface LCUCredentials {
  port: number;
  password: string;
  protocol: string;
  pid: number;
}

interface LiveClientGameData {
  activePlayer: ActivePlayer;
  allPlayers: PlayerData[];
  events: { Events: GameEvent[] };
  gameData: GameStats;
}

interface ActivePlayer {
  abilities: Record<string, AbilityInfo>;
  championStats: Record<string, number>;
  currentGold: number;
  fullRunes: RuneData;
  level: number;
  summonerName: string;
  riotId?: string;
  riotIdGameName?: string;
  riotIdTagLine?: string;
  teamRelativeColors?: boolean;
}

interface AbilityInfo {
  abilityLevel: number;
  displayName: string;
  id: string;
  rawDescription: string;
  rawDisplayName: string;
}

interface RuneData {
  generalRunes: RuneInfo[];
  keystone: RuneInfo;
  primaryRuneTree: RuneInfo;
  secondaryRuneTree: RuneInfo;
  statRunes: Array<{ id: number; rawDescription: string }>;
}

interface RuneInfo {
  displayName: string;
  id: number;
  rawDescription: string;
  rawDisplayName: string;
}

interface PlayerData {
  championName: string;
  isBot: boolean;
  isDead: boolean;
  items: ItemData[];
  level: number;
  position: string;
  rawChampionName: string;
  respawnTimer: number;
  runes: {
    keystone: RuneInfo;
    primaryRuneTree: RuneInfo;
    secondaryRuneTree: RuneInfo;
  };
  scores: {
    assists: number;
    creepScore: number;
    deaths: number;
    kills: number;
    wardScore: number;
  };
  skinID: number;
  summonerName: string;
  riotId?: string;
  riotIdGameName?: string;
  riotIdTagLine?: string;
  summonerSpells: {
    summonerSpellOne: SpellInfo;
    summonerSpellTwo: SpellInfo;
  };
  team: 'ORDER' | 'CHAOS';
}

interface ItemData {
  canUse: boolean;
  consumable: boolean;
  count: number;
  displayName: string;
  itemID: number;
  price: number;
  rawDescription: string;
  rawDisplayName: string;
  slot: number;
}

interface SpellInfo {
  displayName: string;
  rawDescription: string;
  rawDisplayName: string;
}

interface GameEvent {
  EventID: number;
  EventName: string;
  EventTime: number;
  KillerName?: string;
  VictimName?: string;
  Assisters?: string[];
  DragonType?: string;
  TurretKilled?: string;
  InhibKilled?: string;
  Stolen?: string;
  KillStreak?: number;
  Acer?: string;
  AcingTeam?: string;
}

interface GameStats {
  gameMode: string;
  gameTime: number;
  mapName: string;
  mapNumber: number;
  mapTerrain: string;
}

// ─────────────────────────────────────────────────────────
//  CLI Parsing
// ─────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const flags = {
    pollInterval: 1000,
    logFile: '',
    noWebsocket: false,
    noLiveclient: false,
    dumpEndpoints: false,
  };
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--poll-interval':
        flags.pollInterval = parseInt(args[++i], 10) || 1000;
        break;
      case '--log-file':
        flags.logFile = args[++i] || '';
        break;
      case '--no-websocket':
        flags.noWebsocket = true;
        break;
      case '--no-liveclient':
        flags.noLiveclient = true;
        break;
      case '--dump-endpoints':
        flags.dumpEndpoints = true;
        break;
    }
  }
  return flags;
}

// ─────────────────────────────────────────────────────────
//  Logging helpers
// ─────────────────────────────────────────────────────────

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RED = '\x1b[31m';
const DIM = '\x1b[2m';
const MAGENTA = '\x1b[35m';

function log(tag: string, msg: string, color = CYAN) {
  const ts = new Date().toISOString().slice(11, 23);
  console.log(`${DIM}${ts}${RESET} ${color}[${tag}]${RESET} ${msg}`);
}

function logJson(tag: string, label: string, data: unknown) {
  log(tag, `${BOLD}${label}${RESET}`);
  console.log(JSON.stringify(data, null, 2));
}

let logFilePath = '';
function appendToLog(entry: Record<string, unknown>) {
  if (!logFilePath) return;
  appendFileSync(logFilePath, JSON.stringify({ ts: Date.now(), ...entry }) + '\n');
}

// ─────────────────────────────────────────────────────────
//  1. LCU Credential Discovery
// ─────────────────────────────────────────────────────────

/** Parse the lockfile written by LeagueClient */
function parseLockfile(content: string): LCUCredentials | null {
  const parts = content.trim().split(':');
  if (parts.length < 5) return null;
  return {
    pid: parseInt(parts[1], 10),
    port: parseInt(parts[2], 10),
    password: parts[3],
    protocol: parts[4],
  };
}

/** Try common lockfile locations */
function findLockfile(): LCUCredentials | null {
  const candidates = [
    // Linux (Wine / Lutris / Snap)
    join(
      process.env.HOME || '~',
      '.local/share/lutris/runtime/wine/league-of-legends/lockfile',
    ),
    // macOS
    '/Applications/League of Legends.app/Contents/LoL/lockfile',
    // Windows-style paths (WSL / mapped drives)
    'C:/Riot Games/League of Legends/lockfile',
    'D:/Riot Games/League of Legends/lockfile',
    // Custom env var
    process.env.LOL_LOCKFILE || '',
  ].filter(Boolean);

  for (const path of candidates) {
    try {
      if (existsSync(path)) {
        const content = readFileSync(path, 'utf-8');
        const creds = parseLockfile(content);
        if (creds) {
          log('LCU', `Found lockfile at ${path}`, GREEN);
          return creds;
        }
      }
    } catch {
      /* skip */
    }
  }
  return null;
}

/** Extract credentials from the running process command line */
function findFromProcess(): LCUCredentials | null {
  try {
    const platform = process.platform;
    let output = '';

    if (platform === 'win32') {
      output = execSync(
        "wmic PROCESS WHERE \"name='LeagueClientUx.exe'\" GET commandline",
        { encoding: 'utf-8', timeout: 5000 },
      );
    } else if (platform === 'darwin') {
      output = execSync('ps -A | grep LeagueClientUx', {
        encoding: 'utf-8',
        timeout: 5000,
      });
    } else {
      // Linux – might be running under Wine
      output = execSync('ps aux | grep -i LeagueClientUx', {
        encoding: 'utf-8',
        timeout: 5000,
      });
    }

    const portMatch = output.match(/--app-port=(\d+)/);
    const tokenMatch = output.match(/--remoting-auth-token=([\w-]+)/);
    const pidMatch = output.match(/--app-pid=(\d+)/);

    if (portMatch && tokenMatch) {
      log('LCU', 'Found credentials from process list', GREEN);
      return {
        port: parseInt(portMatch[1], 10),
        password: tokenMatch[1],
        protocol: 'https',
        pid: pidMatch ? parseInt(pidMatch[1], 10) : 0,
      };
    }
  } catch {
    /* process not found */
  }
  return null;
}

/** Discover LCU credentials by any means */
function discoverLCU(): LCUCredentials | null {
  return findLockfile() || findFromProcess();
}

// ─────────────────────────────────────────────────────────
//  2. LCU REST Client
// ─────────────────────────────────────────────────────────

function basicAuth(password: string) {
  return 'Basic ' + Buffer.from(`riot:${password}`).toString('base64');
}

async function lcuFetch<T = unknown>(
  creds: LCUCredentials,
  endpoint: string,
  method = 'GET',
  body?: unknown,
): Promise<T> {
  const url = `${creds.protocol}://127.0.0.1:${creds.port}${endpoint}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: basicAuth(creds.password),
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    // @ts-expect-error – Node/Bun flag to accept self-signed certs
    tls: { rejectUnauthorized: false },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`LCU ${method} ${endpoint} → ${res.status}: ${text}`);
  }
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('json')) return res.json();
  return (await res.text()) as unknown as T;
}

// ── Comprehensive LCU endpoint catalog ──

const LCU_ENDPOINTS = {
  // ─── Summoner ───
  currentSummoner: '/lol-summoner/v1/current-summoner',
  summonerProfile: '/lol-summoner/v1/current-summoner/summoner-profile',

  // ─── Gameflow (game state machine) ───
  gameflowPhase: '/lol-gameflow/v1/gameflow-phase',
  gameflowSession: '/lol-gameflow/v1/session',
  gameflowAvailability: '/lol-gameflow/v1/availability',

  // ─── Champion Select ───
  champSelectSession: '/lol-champ-select/v1/session',
  champSelectPickableChampions: '/lol-champ-select/v1/pickable-champion-ids',
  champSelectBannableChampions: '/lol-champ-select/v1/bannable-champion-ids',
  champSelectCurrentChampion: '/lol-champ-select/v1/current-champion',
  champSelectTeamBoost: '/lol-champ-select/v1/team-boost',

  // ─── Lobby ───
  lobby: '/lol-lobby/v2/lobby',
  lobbyMembers: '/lol-lobby/v2/lobby/members',
  lobbyMatchmakingSearch: '/lol-lobby/v2/lobby/matchmaking/search-state',
  lobbyComms: '/lol-lobby/v2/comms',

  // ─── Matchmaking ───
  matchmakingSearch: '/lol-matchmaking/v1/search',
  matchmakingReadyCheck: '/lol-matchmaking/v1/ready-check',

  // ─── Ranked ───
  rankedStats: '/lol-ranked/v1/current-ranked-stats',
  rankedEos: '/lol-ranked/v1/eos-notifications',

  // ─── Match History ───
  matchHistory: '/lol-match-history/v1/products/lol/current-summoner/matches',

  // ─── Champions ───
  champions: '/lol-champions/v1/inventories/{summonerId}/champions',
  championMastery: '/lol-champion-mastery/v1/local-player/champion-mastery',

  // ─── Runes (Perks) ───
  perksCurrentPage: '/lol-perks/v1/currentpage',
  perksPages: '/lol-perks/v1/pages',
  perksInventory: '/lol-perks/v1/inventory',

  // ─── Collections ───
  collections: '/lol-collections/v1/inventories/{summonerId}/backdrop',

  // ─── Loot ───
  lootMap: '/lol-loot/v1/player-loot-map',

  // ─── End of Game ───
  endOfGameStats: '/lol-end-of-game/v1/eog-stats-block',

  // ─── Chat ───
  chatMe: '/lol-chat/v1/me',
  chatFriends: '/lol-chat/v1/friends',

  // ─── Settings ───
  gameSettings: '/lol-game-settings/v1/game-settings',
  inputSettings: '/lol-game-settings/v1/input-settings',

  // ─── Challenges ───
  challengesSummary: '/lol-challenges/v1/summary-player-data/local-player',

  // ─── Clash ───
  clashTournaments: '/lol-clash/v1/tournaments',
  clashPlayer: '/lol-clash/v1/player',

  // ─── Service Status ───
  serviceStatus: '/lol-service-status/v1/lcu-status',

  // ─── Client System ───
  systemInfo: '/system/v1/builds',
  help: '/help',
  swaggerV2: '/swagger/v2/swagger.json',
  swaggerV3: '/swagger/v3/openapi.json',
} as const;

/** Probe all safe LCU endpoints and return results */
async function probeAllLCUEndpoints(creds: LCUCredentials) {
  const results: Record<string, unknown> = {};
  const safeEndpoints = Object.entries(LCU_ENDPOINTS).filter(
    ([key]) => !key.includes('swagger') && !key.includes('help'),
  );

  const settled = await Promise.allSettled(
    safeEndpoints.map(async ([key, endpoint]) => {
      // Skip endpoints with path params for now
      if (endpoint.includes('{')) return { key, data: null, skipped: true };
      const data = await lcuFetch(creds, endpoint);
      return { key, data, skipped: false };
    }),
  );

  for (const result of settled) {
    if (result.status === 'fulfilled' && !result.value.skipped) {
      results[result.value.key] = result.value.data;
    }
  }

  return results;
}

// ─────────────────────────────────────────────────────────
//  3. LCU WebSocket – real-time event stream
// ─────────────────────────────────────────────────────────

/**
 * The LCU WebSocket uses the WAMP (v1) sub-protocol.
 *
 * Message types:
 *   [5, topic]                          – subscribe
 *   [6, topic]                          – unsubscribe
 *   [8, topic, { data, eventType, uri }] – event
 *
 * Subscribing to "OnJsonApiEvent" gives ALL events.
 * You can also subscribe to specific paths:
 *   "OnJsonApiEvent_lol-gameflow_v1_gameflow-phase"
 *   "OnJsonApiEvent_lol-champ-select_v1_session"
 */

const WAMP_SUBSCRIBE = 5;
const WAMP_EVENT = 8;

/** WebSocket event topics worth monitoring */
const WS_TOPICS = [
  'OnJsonApiEvent',                                         // catch-all: every LCU event
  // Targeted subscriptions (uncomment to use instead of catch-all):
  // 'OnJsonApiEvent_lol-gameflow_v1_gameflow-phase',
  // 'OnJsonApiEvent_lol-gameflow_v1_session',
  // 'OnJsonApiEvent_lol-champ-select_v1_session',
  // 'OnJsonApiEvent_lol-lobby_v2_lobby',
  // 'OnJsonApiEvent_lol-matchmaking_v1_search',
  // 'OnJsonApiEvent_lol-matchmaking_v1_ready-check',
  // 'OnJsonApiEvent_lol-perks_v1_currentpage',
  // 'OnJsonApiEvent_lol-end-of-game_v1_eog-stats-block',
  // 'OnJsonApiEvent_lol-ranked_v1_current-ranked-stats',
  // 'OnJsonApiEvent_lol-chat_v1_me',
  // 'OnJsonApiEvent_lol-honor-v2',
] as const;

/** Event filter – which URI prefixes to log (empty = all) */
const EVENT_FILTERS: string[] = [
  // Add prefixes to filter, e.g.:
  // '/lol-gameflow/',
  // '/lol-champ-select/',
  // '/lol-lobby/',
  // '/lol-end-of-game/',
];

function connectLCUWebSocket(
  creds: LCUCredentials,
  onEvent: (topic: string, data: { eventType: string; uri: string; data: unknown }) => void,
): WebSocket {
  // Embed auth in URL – works with Bun's native WebSocket (no custom headers needed)
  const url = `wss://riot:${encodeURIComponent(creds.password)}@127.0.0.1:${creds.port}/`;

  const ws = new WebSocket(url, ['wamp']);

  ws.addEventListener('open', () => {
    log('WS', `Connected to LCU WebSocket on port ${creds.port}`, GREEN);
    for (const topic of WS_TOPICS) {
      ws.send(JSON.stringify([WAMP_SUBSCRIBE, topic]));
      log('WS', `Subscribed to ${BOLD}${topic}${RESET}`, CYAN);
    }
  });

  ws.addEventListener('message', (event: MessageEvent) => {
    try {
      const raw = typeof event.data === 'string' ? event.data : event.data.toString();
      const msg = JSON.parse(raw);
      if (!Array.isArray(msg) || msg[0] !== WAMP_EVENT) return;

      const [, topic, payload] = msg as [number, string, { eventType: string; uri: string; data: unknown }];

      // Apply filters
      if (EVENT_FILTERS.length > 0) {
        const matchesFilter = EVENT_FILTERS.some((f) => payload.uri.startsWith(f));
        if (!matchesFilter) return;
      }

      onEvent(topic, payload);
    } catch {
      /* ignore malformed */
    }
  });

  ws.addEventListener('error', (event: Event) => {
    log('WS', `Error: ${(event as ErrorEvent).message || 'connection error'}`, RED);
  });

  ws.addEventListener('close', (event: CloseEvent) => {
    log('WS', `Disconnected (${event.code} ${event.reason})`, YELLOW);
  });

  return ws;
}

// ─────────────────────────────────────────────────────────
//  4. Live Client Data API – port 2999 (active game only)
// ─────────────────────────────────────────────────────────

const LIVE_CLIENT_BASE = 'https://127.0.0.1:2999';

const LIVE_CLIENT_ENDPOINTS = {
  allGameData: '/liveclientdata/allgamedata',
  activePlayer: '/liveclientdata/activeplayer',
  activePlayerName: '/liveclientdata/activeplayername',
  activePlayerAbilities: '/liveclientdata/activeplayerabilities',
  activePlayerRunes: '/liveclientdata/activeplayerrunes',
  playerList: '/liveclientdata/playerlist',
  eventData: '/liveclientdata/eventdata',
  gameStats: '/liveclientdata/gamestats',
  // Per-player endpoints (require ?riotId= query param)
  playerScores: '/liveclientdata/playerscores',
  playerSummonerSpells: '/liveclientdata/playersummonerspells',
  playerMainRunes: '/liveclientdata/playermainrunes',
  playerItems: '/liveclientdata/playeritems',
} as const;

async function liveClientFetch<T = unknown>(endpoint: string, query = ''): Promise<T | null> {
  try {
    const url = `${LIVE_CLIENT_BASE}${endpoint}${query ? `?${query}` : ''}`;
    const res = await fetch(url, {
      // @ts-expect-error – self-signed cert
      tls: { rejectUnauthorized: false },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/** Check if the game is currently running (Live Client API is up) */
async function isGameRunning(): Promise<boolean> {
  const data = await liveClientFetch(LIVE_CLIENT_ENDPOINTS.gameStats);
  return data !== null;
}

/** Fetch everything from the Live Client Data API */
async function fetchAllLiveData(): Promise<LiveClientGameData | null> {
  return liveClientFetch<LiveClientGameData>(LIVE_CLIENT_ENDPOINTS.allGameData);
}

/** Fetch individual player details for all players */
async function fetchDetailedPlayerData(players: PlayerData[]) {
  const details = await Promise.allSettled(
    players.map(async (p) => {
      const riotId = p.riotId || p.summonerName;
      const query = `riotId=${encodeURIComponent(riotId)}`;
      const [scores, items, spells, runes] = await Promise.all([
        liveClientFetch(LIVE_CLIENT_ENDPOINTS.playerScores, query),
        liveClientFetch(LIVE_CLIENT_ENDPOINTS.playerItems, query),
        liveClientFetch(LIVE_CLIENT_ENDPOINTS.playerSummonerSpells, query),
        liveClientFetch(LIVE_CLIENT_ENDPOINTS.playerMainRunes, query),
      ]);
      return { riotId, scores, items, spells, runes };
    }),
  );
  return details
    .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
    .map((r) => r.value);
}

// ─────────────────────────────────────────────────────────
//  5. Event Tracking & Delta Detection
// ─────────────────────────────────────────────────────────

class GameStateTracker {
  private lastEventId = -1;
  private lastGameTime = 0;
  private playerStates = new Map<string, { kills: number; deaths: number; assists: number; cs: number; level: number; items: number[] }>();

  processUpdate(data: LiveClientGameData) {
    const newEvents = data.events.Events.filter((e) => e.EventID > this.lastEventId);
    if (newEvents.length > 0) {
      this.lastEventId = Math.max(...newEvents.map((e) => e.EventID));
      for (const ev of newEvents) {
        this.logGameEvent(ev);
      }
    }

    // Track player state changes
    for (const player of data.allPlayers) {
      const id = player.riotId || player.summonerName;
      const prev = this.playerStates.get(id);
      const curr = {
        kills: player.scores.kills,
        deaths: player.scores.deaths,
        assists: player.scores.assists,
        cs: player.scores.creepScore,
        level: player.level,
        items: player.items.map((i) => i.itemID),
      };

      if (prev) {
        if (curr.level > prev.level) {
          log('GAME', `${BOLD}${id}${RESET} leveled up to ${MAGENTA}${curr.level}${RESET}`);
        }
        const newItems = curr.items.filter((i) => !prev.items.includes(i));
        if (newItems.length > 0) {
          const names = player.items
            .filter((i) => newItems.includes(i.itemID))
            .map((i) => i.displayName);
          log('GAME', `${BOLD}${id}${RESET} purchased: ${GREEN}${names.join(', ')}${RESET}`);
        }
        if (curr.kills > prev.kills || curr.deaths > prev.deaths || curr.assists > prev.assists) {
          log(
            'GAME',
            `${BOLD}${id}${RESET} KDA: ${curr.kills}/${curr.deaths}/${curr.assists}`,
          );
        }
      }

      this.playerStates.set(id, curr);
    }

    // Periodic game state summary
    const gameMinutes = Math.floor(data.gameData.gameTime / 60);
    const gameSeconds = Math.floor(data.gameData.gameTime % 60);
    if (Math.floor(data.gameData.gameTime) % 30 === 0 && data.gameData.gameTime !== this.lastGameTime) {
      this.lastGameTime = Math.floor(data.gameData.gameTime);
      log(
        'GAME',
        `${DIM}${gameMinutes}:${String(gameSeconds).padStart(2, '0')} | ` +
          `Gold: ${Math.floor(data.activePlayer.currentGold)} | ` +
          `Level: ${data.activePlayer.level} | ` +
          `Mode: ${data.gameData.gameMode} | ` +
          `Terrain: ${data.gameData.mapTerrain}${RESET}`,
      );
    }
  }

  private logGameEvent(ev: GameEvent) {
    const time = `${Math.floor(ev.EventTime / 60)}:${String(Math.floor(ev.EventTime % 60)).padStart(2, '0')}`;
    switch (ev.EventName) {
      case 'GameStart':
        log('EVENT', `${GREEN}${BOLD}Game Started!${RESET}`, GREEN);
        break;
      case 'MinionsSpawning':
        log('EVENT', `${time} Minions spawning`, YELLOW);
        break;
      case 'ChampionKill':
        log('EVENT', `${time} ${RED}KILL${RESET} ${ev.KillerName} → ${ev.VictimName} (assists: ${ev.Assisters?.join(', ') || 'none'})`, RED);
        break;
      case 'Multikill':
        log('EVENT', `${time} ${RED}${BOLD}MULTIKILL (${ev.KillStreak})${RESET} by ${ev.KillerName}`, RED);
        break;
      case 'Ace':
        log('EVENT', `${time} ${RED}${BOLD}ACE${RESET} by ${ev.Acer} (${ev.AcingTeam})`, RED);
        break;
      case 'TurretKilled':
        log('EVENT', `${time} ${MAGENTA}Turret destroyed${RESET}: ${ev.TurretKilled} by ${ev.KillerName}`, MAGENTA);
        break;
      case 'InhibKilled':
        log('EVENT', `${time} ${MAGENTA}${BOLD}Inhibitor destroyed${RESET}: ${ev.InhibKilled} by ${ev.KillerName}`, MAGENTA);
        break;
      case 'DragonKill':
        log('EVENT', `${time} ${CYAN}${BOLD}Dragon (${ev.DragonType})${RESET} slain by ${ev.KillerName}${ev.Stolen === 'True' ? ` ${RED}STOLEN${RESET}` : ''}`, CYAN);
        break;
      case 'HeraldKill':
        log('EVENT', `${time} ${CYAN}Herald${RESET} slain by ${ev.KillerName}${ev.Stolen === 'True' ? ` ${RED}STOLEN${RESET}` : ''}`, CYAN);
        break;
      case 'BaronKill':
        log('EVENT', `${time} ${YELLOW}${BOLD}BARON${RESET} slain by ${ev.KillerName}${ev.Stolen === 'True' ? ` ${RED}STOLEN${RESET}` : ''}`, YELLOW);
        break;
      case 'FirstBrick':
        log('EVENT', `${time} ${MAGENTA}First Blood Tower${RESET} by ${ev.KillerName}`, MAGENTA);
        break;
      default:
        log('EVENT', `${time} ${ev.EventName} ${JSON.stringify(ev)}`, DIM);
    }
    appendToLog({ source: 'live_event', event: ev });
  }
}

// ─────────────────────────────────────────────────────────
//  6. Dump all discoverable LCU endpoints (via /help)
// ─────────────────────────────────────────────────────────

async function dumpLCUEndpoints(creds: LCUCredentials) {
  log('LCU', 'Fetching /help to discover all endpoints...', CYAN);
  try {
    const help = await lcuFetch<Record<string, unknown>>(creds, '/help');
    const outputPath = join(process.cwd(), 'lcu-endpoints-dump.json');
    writeFileSync(outputPath, JSON.stringify(help, null, 2));
    log('LCU', `Wrote all endpoints to ${GREEN}${outputPath}${RESET}`, GREEN);
  } catch (err: unknown) {
    log('LCU', `Failed to fetch /help: ${(err as Error).message}`, RED);

    // Fallback: try swagger
    try {
      const swagger = await lcuFetch<Record<string, unknown>>(creds, '/swagger/v3/openapi.json');
      const outputPath = join(process.cwd(), 'lcu-openapi-dump.json');
      writeFileSync(outputPath, JSON.stringify(swagger, null, 2));
      log('LCU', `Wrote OpenAPI spec to ${GREEN}${outputPath}${RESET}`, GREEN);
    } catch (err2: unknown) {
      log('LCU', `Also failed swagger: ${(err2 as Error).message}`, RED);
    }
  }
}

// ─────────────────────────────────────────────────────────
//  7. Main Orchestrator
// ─────────────────────────────────────────────────────────

async function main() {
  const flags = parseArgs();
  logFilePath = flags.logFile;

  console.log(`
${BOLD}${CYAN}╔══════════════════════════════════════════════════════╗
║       League of Legends – Game Data Explorer         ║
╚══════════════════════════════════════════════════════╝${RESET}

  ${DIM}APIs being monitored:${RESET}
    ${GREEN}•${RESET} LCU REST API     (dynamic port, from lockfile/process)
    ${GREEN}•${RESET} LCU WebSocket    (WAMP v1, real-time events)
    ${GREEN}•${RESET} Live Client Data (port 2999, active game only)
`);

  // ── Step 1: Discover LCU ──
  log('INIT', 'Discovering League Client...', YELLOW);
  const creds = discoverLCU();

  if (creds) {
    log('INIT', `LCU found → port ${BOLD}${creds.port}${RESET}, pid ${creds.pid}`, GREEN);

    // ── Dump endpoints if requested ──
    if (flags.dumpEndpoints) {
      await dumpLCUEndpoints(creds);
      process.exit(0);
    }

    // ── Probe LCU REST endpoints ──
    log('LCU', 'Probing all safe REST endpoints...', CYAN);
    try {
      const allData = await probeAllLCUEndpoints(creds);
      const availableEndpoints = Object.keys(allData);
      log('LCU', `${GREEN}${availableEndpoints.length}${RESET} endpoints responded successfully`, GREEN);

      // Show key data
      if (allData.currentSummoner) {
        logJson('LCU', 'Current Summoner', allData.currentSummoner);
      }
      if (allData.gameflowPhase) {
        log('LCU', `Gameflow phase: ${BOLD}${allData.gameflowPhase}${RESET}`, MAGENTA);
      }
      if (allData.rankedStats) {
        logJson('LCU', 'Ranked Stats', allData.rankedStats);
      }

      appendToLog({ source: 'lcu_probe', endpoints: availableEndpoints, data: allData });
    } catch (err: unknown) {
      log('LCU', `Probe error: ${(err as Error).message}`, RED);
    }

    // ── Connect LCU WebSocket ──
    if (!flags.noWebsocket) {
      log('WS', 'Connecting to LCU WebSocket...', CYAN);
      const ws = connectLCUWebSocket(creds, (topic, payload) => {
        const eventType = payload.eventType; // Create | Update | Delete
        const uri = payload.uri;

        // Color-code by event type
        const color = eventType === 'Create' ? GREEN : eventType === 'Delete' ? RED : YELLOW;
        log('WS', `${color}${eventType}${RESET} ${DIM}${uri}${RESET}`);

        // Log interesting payloads fully
        const importantPrefixes = [
          '/lol-gameflow/',
          '/lol-champ-select/',
          '/lol-lobby/',
          '/lol-end-of-game/',
          '/lol-matchmaking/',
          '/lol-perks/',
        ];
        if (importantPrefixes.some((p) => uri.startsWith(p))) {
          console.log(JSON.stringify(payload.data, null, 2));
        }

        appendToLog({ source: 'lcu_ws', topic, eventType, uri, data: payload.data });
      });

      // Cleanup on exit
      process.on('SIGINT', () => {
        log('WS', 'Closing WebSocket...', YELLOW);
        ws.close();
        process.exit(0);
      });
    }
  } else {
    log(
      'INIT',
      `${YELLOW}League Client not found.${RESET} Will monitor Live Client API only.\n` +
        `  ${DIM}Tip: Set LOL_LOCKFILE env var to your lockfile path${RESET}`,
      YELLOW,
    );
  }

  // ── Step 2: Poll Live Client Data API ──
  if (!flags.noLiveclient) {
    log('LIVE', 'Starting Live Client Data API polling...', CYAN);
    const tracker = new GameStateTracker();
    let wasInGame = false;
    let initialDump = false;

    const poll = async () => {
      const inGame = await isGameRunning();

      if (inGame && !wasInGame) {
        log('LIVE', `${GREEN}${BOLD}Game detected! Streaming live data...${RESET}`, GREEN);
        wasInGame = true;
        initialDump = false;
      }

      if (!inGame && wasInGame) {
        log('LIVE', `${YELLOW}Game ended.${RESET}`, YELLOW);
        wasInGame = false;
        initialDump = false;

        // Try to get end-of-game stats from LCU
        if (creds) {
          try {
            const eog = await lcuFetch(creds, LCU_ENDPOINTS.endOfGameStats);
            logJson('LCU', 'End of Game Stats', eog);
            appendToLog({ source: 'end_of_game', data: eog });
          } catch {
            /* not available yet */
          }
        }
      }

      if (inGame) {
        const data = await fetchAllLiveData();
        if (data) {
          // First time in game: dump full state
          if (!initialDump) {
            initialDump = true;
            log('LIVE', `${BOLD}Game Info:${RESET} ${data.gameData.gameMode} on ${data.gameData.mapName} (${data.gameData.mapTerrain})`, GREEN);

            // Team rosters
            const orderTeam = data.allPlayers.filter((p) => p.team === 'ORDER');
            const chaosTeam = data.allPlayers.filter((p) => p.team === 'CHAOS');

            log('LIVE', `${BOLD}${CYAN}── Blue Side (ORDER) ──${RESET}`, CYAN);
            for (const p of orderTeam) {
              log(
                'LIVE',
                `  ${p.championName} (${p.riotId || p.summonerName}) ${DIM}${p.position || 'N/A'} | ${p.summonerSpells.summonerSpellOne.displayName}/${p.summonerSpells.summonerSpellTwo.displayName}${RESET}`,
              );
            }
            log('LIVE', `${BOLD}${RED}── Red Side (CHAOS) ──${RESET}`, RED);
            for (const p of chaosTeam) {
              log(
                'LIVE',
                `  ${p.championName} (${p.riotId || p.summonerName}) ${DIM}${p.position || 'N/A'} | ${p.summonerSpells.summonerSpellOne.displayName}/${p.summonerSpells.summonerSpellTwo.displayName}${RESET}`,
              );
            }

            // Active player details
            logJson('LIVE', 'Active Player Stats', data.activePlayer.championStats);
            logJson('LIVE', 'Active Player Runes', data.activePlayer.fullRunes);

            appendToLog({ source: 'game_start', data });
          }

          // Process deltas
          tracker.processUpdate(data);
        }
      }

      if (!inGame) {
        // Waiting – check less frequently
        setTimeout(poll, 3000);
      } else {
        setTimeout(poll, flags.pollInterval);
      }
    };

    poll();
  }

  // Keep process alive
  log('INIT', `${GREEN}Explorer running. Press Ctrl+C to stop.${RESET}`, GREEN);
  if (logFilePath) {
    log('INIT', `Logging events to ${BOLD}${logFilePath}${RESET}`, CYAN);
  }
}

main().catch((err) => {
  console.error(`${RED}Fatal error:${RESET}`, err);
  process.exit(1);
});
