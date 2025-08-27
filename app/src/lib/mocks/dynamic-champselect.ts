import type { EnhancedChampSelectSession } from "@lib/types";
import { Team } from "@lib/types";
import { ImageStorage } from "../types/common";
import { fmsLogoInBase64 } from "./fmsLogoInBase64";

const defaultPlayerImage: ImageStorage = {
  type: "url",
  // Mrozku :*
  url: "https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/a/a3/FSK_Mrozku_2025_Split_1.png/revision/latest/scale-to-width-down/1024?cb=20250125122242"
}

export const LosRatones: Team = {
  _id: "1",
  name: "Los Ratones",
  tag: "LR",
  region: "EUW",
  founded: new Date(),
  verified: true,
  tier: "professional",
  logo: {
    type: "url",
    url: "https://liquipedia.net/commons/images/1/13/Los_Ratones_darkmode.png",
  },
  colors: {
    primary: "#000000",
    secondary: "#FFFFFF",
    accent: "#99072b"
  },
  players: {
    main: [
      {
        _id: "1",
        inGameName: "Baus",
        tag: "EUW",
        role: "TOP",
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        profileImage: {
          type: "url",
          url: "/assets/default/player.png"
        }
      },
      {
        _id: "2",
        inGameName: "Velja",
        tag: "EUW",
        role: "JUNGLE",
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        profileImage: {
          type: "url",
          url: "/assets/default/player.png"
        }
      },
      
      {
        _id: "3",
        inGameName: "Nemesis",
        tag: "EUW",
        role: "MID",
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        profileImage: {
          type: "url",
          url: "/assets/default/player.png"
        }
      },
      {
        _id: "4",
        inGameName: "Crownie",
        tag: "EUW",
        role: "BOTTOM",
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        profileImage: {
          type: "url",
          url: "/assets/default/player.png"
        }
      },
      {
        _id: "5",
        inGameName: "Rekkles",
        tag: "EUW",
        role: "SUPPORT",
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        profileImage: {
          type: "url",
          url: "/assets/default/player.png"
        }
      }
    ],
    substitutes: []
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

export const FajnieMiecSklad: Team = {
  _id: "2",
  name: "Fajnie Miec Sklad",
  tag: "FMS",
  region: "EUW",
  founded: new Date(),
  verified: true,
  tier: "professional",
  logo: {
    type: "upload",
    data: fmsLogoInBase64,
    size: 49400,
    format: "png"
  },
  colors: {
    primary: "#000000",
    secondary: "#FFFFFF",
    accent: "#99072b"
  },
  players: {
    main: [
      {
        _id: "6",
        inGameName: "frajgo",
        tag: "EUW",
        role: "TOP",
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        profileImage: defaultPlayerImage
      },
      {
        _id: "7",
        inGameName: "Rybson",
        tag: "EUW",
        role: "JUNGLE",
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        profileImage: defaultPlayerImage
      },
      
      {
        _id: "8",
        inGameName: "Mrozku",
        tag: "EUW",
        role: "MID",
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        profileImage: defaultPlayerImage
      },
      {
        _id: "9",
        inGameName: "Zamulek",
        tag: "EUW",
        role: "BOTTOM",
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        profileImage: defaultPlayerImage
      },
      {
        _id: "10",
        inGameName: "minemaciek",
        tag: "EUW",
        role: "SUPPORT",
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        profileImage: defaultPlayerImage
      }
    ],
    substitutes: []
  },
  createdAt: new Date(),
  updatedAt: new Date()
};
// Pick and ban phase configuration - 21 turns total
const PICK_BAN_ORDER = [
  // Ban phase 1 (6 bans)
  { phase: "BAN_1", team: "blue", type: "ban" },
  { phase: "BAN_1", team: "red", type: "ban" },
  { phase: "BAN_1", team: "blue", type: "ban" },
  { phase: "BAN_1", team: "red", type: "ban" },
  { phase: "BAN_1", team: "blue", type: "ban" },
  { phase: "BAN_1", team: "red", type: "ban" },

  // Pick phase 1 (6 picks)
  { phase: "PICK_1", team: "blue", type: "pick" },
  { phase: "PICK_1", team: "red", type: "pick" },
  { phase: "PICK_1", team: "red", type: "pick" },
  { phase: "PICK_1", team: "blue", type: "pick" },
  { phase: "PICK_1", team: "blue", type: "pick" },
  { phase: "PICK_1", team: "red", type: "pick" },

  // Ban phase 2 (4 bans)
  { phase: "BAN_2", team: "red", type: "ban" },
  { phase: "BAN_2", team: "blue", type: "ban" },
  { phase: "BAN_2", team: "red", type: "ban" },
  { phase: "BAN_2", team: "blue", type: "ban" },

  // Pick phase 2 (4 picks)
  { phase: "PICK_2", team: "red", type: "pick" },
  { phase: "PICK_2", team: "blue", type: "pick" },
  { phase: "PICK_2", team: "blue", type: "pick" },
  { phase: "PICK_2", team: "red", type: "pick" },

  // Finalization phase (1 turn)
  { phase: "FINALIZATION", team: "blue", type: "pick" }
];

const POPULAR_CHAMPIONS = [
  266, // Aatrox
  103, // Ahri
  84, // Akali
  166, // Akshan
  12, // Alistar
  32, // Amumu
  34, // Anivia
  1, // Annie
  523, // Aphelios
  22, // Ashe
  136, // Aurelion Sol
  268, // Azir
  432, // Bard
  200, // Bel'Veth
  53, // Blitzcrank
  63, // Brand
  201, // Braum
  233, // Briar
  51, // Caitlyn
  164, // Camille
  69, // Cassiopeia
  31, // Cho'Gath
  42, // Corki
  122, // Darius
  131, // Diana
  119, // Draven
  36, // Dr. Mundo
  245, // Ekko
  60, // Elise
  28, // Evelynn
  81, // Ezreal
  9, // Fiddlesticks
  114, // Fiora
  105, // Fizz
  3, // Galio
  41, // Gangplank
  86, // Garen
  150, // Gnar
  79, // Gragas
  104, // Graves
  887, // Gwen
  120, // Hecarim
  74, // Heimerdinger
  420, // Illaoi
  39, // Irelia
  427, // Ivern
  40, // Janna
  59, // Jarvan IV
  24, // Jax
  126, // Jayce
  202, // Jhin
  222, // Jinx
  145, // Kai'Sa
  429, // Kalista
  43, // Karma
  30, // Karthus
  38, // Kassadin
  55, // Katarina
  10, // Kayle
  141, // Kayn
  85, // Kennen
  121, // Kha'Zix
  203, // Kindred
  240, // Kled
  96, // Kog'Maw
  897, // K'Sante
  7, // LeBlanc
  64, // Lee Sin
  89, // Leona
  876, // Lillia
  127, // Lissandra
  236, // Lucian
  117, // Lulu
  99, // Lux
  54, // Malphite
  90, // Malzahar
  57, // Maokai
  11, // Master Yi
  902, // Milio
  21, // Miss Fortune
  62, // Wukong
  82, // Mordekaiser
  25, // Morgana
  267, // Nami
  75, // Nasus
  111, // Nautilus
  518, // Neeko
  76, // Nidalee
  895, // Nilah
  56, // Nocturne
  20, // Nunu
  2, // Olaf
  61, // Orianna
  516, // Ornn
  80, // Pantheon
  78, // Poppy
  555, // Pyke
  246, // Qiyana
  133, // Quinn
  497, // Rakan
  33, // Rammus
  421, // Rek'Sai
  526, // Rell
  888, // Renata Glasc
  58, // Renekton
  107, // Rengar
  92, // Riven
  68, // Rumble
  13, // Ryze
  360, // Samira
  113, // Sejuani
  235, // Senna
  147, // Seraphine
  875, // Sett
  35, // Shaco
  98, // Shen
  102, // Shyvana
  27, // Singed
  14, // Sion
  15, // Sivir
  72, // Skarner
  37, // Sona
  16, // Soraka
  50, // Swain
  517, // Sylas
  134, // Syndra
  223, // Tahm Kench
  163, // Taliyah
  91, // Talon
  44, // Taric
  17, // Teemo
  412, // Thresh
  18, // Tristana
  48, // Trundle
  23, // Tryndamere
  4, // Twisted Fate
  29, // Twitch
  77, // Udyr
  6, // Urgot
  110, // Varus
  67, // Vayne
  45, // Veigar
  161, // Vel'Koz
  711, // Vex
  254, // Vi
  112, // Viktor
  8, // Vladimir
  106, // Volibear
  19, // Warwick
  498, // Xayah
  101, // Xerath
  5, // Xin Zhao
  157, // Yasuo
  83, // Yorick
  350, // Yuumi
  154, // Zac
  238, // Zed
  221, // Zeri
  115, // Ziggs
  26, // Zilean
  142, // Zoe
  143 // Zyra
];

export type MockPhase = "BAN_1" | "PICK_1" | "BAN_2" | "PICK_2" | "FINALIZATION";

export interface DynamicMockConfig {
  currentPhase: MockPhase;
  currentTurn: number;
  isHovering: boolean; // Whether we're in hover state
  hoverStartTime?: number; // When hover state started
  blueTeamName?: string;
  redTeamName?: string;
  tournamentName?: string;
  roundName?: string;
  matchNumber?: number;
  bestOf?: number;
  autoAdvance?: boolean;
  autoAdvanceInterval?: number;
  seed?: number; // For deterministic but varied champion selection
  timerStartTime?: number; // When the current phase timer started
  hoveredChampionId?: number | null; // Currently hovered champion
  selectionStartTime?: number; // When champion selection started
}

export class DynamicChampSelectMock {
  private config: DynamicMockConfig;
  private intervalId: NodeJS.Timeout | null = null;
  private prevPhase: MockPhase | null = null;
  private prevTurn: number | null = null;

  constructor(config: Partial<DynamicMockConfig> = {}) {
    this.config = {
      ...config,
      currentPhase: "BAN_1",
      currentTurn: 0,
      isHovering: false,
      blueTeamName: "FMS",
      redTeamName: "LR",
      tournamentName: "Rift Legends",
      bestOf: 3,
      autoAdvance: false,
      autoAdvanceInterval: 5000,
      seed: 42, // Default deterministic seed
      timerStartTime: Date.now(),
      hoveredChampionId: undefined,
      selectionStartTime: undefined,
      ...config
    };

    if (this.config.autoAdvance) {
      this.startAutoAdvance(this.config.autoAdvanceInterval);
    }
  }

  public stopAutoAdvance(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public startAutoAdvance(interval?: number): void {
    this.stopAutoAdvance(); // Stop any existing auto-advance
    this.intervalId = setInterval(() => {
      this.advanceTurn();
    }, interval || this.config.autoAdvanceInterval);
  }

  public advanceTurn(): void {
    if (this.config.currentTurn < PICK_BAN_ORDER.length - 1) {
      // Auto-select champion if hovering
      const selectionState = this.getSelectionState();
      if (selectionState.isHovering && !this.config.hoveredChampionId) {
        this.config.hoveredChampionId = selectionState.hoveredChampionId;
      }

      this.config.currentTurn++;
      this.updatePhase();
      // Reset timer when advancing turn
      this.config.timerStartTime = Date.now();
      this.config.hoveredChampionId = undefined;
    }
  }

  public setTurn(turn: number): void {
    this.config.currentTurn = Math.max(0, Math.min(turn, PICK_BAN_ORDER.length - 1));
    this.updatePhase();
    // Reset timer when turn changes
    this.config.timerStartTime = Date.now();
  }

  public setPhase(phase: MockPhase): void {
    this.config.currentPhase = phase;
    // Find the first turn of this phase
    const phaseStartTurn = PICK_BAN_ORDER.findIndex((action) => action.phase === phase);
    if (phaseStartTurn !== -1) {
      this.config.currentTurn = phaseStartTurn;
    }
    // Reset timer when phase changes
    this.config.timerStartTime = Date.now();
  }

  public setSeed(seed: number): void {
    this.config.seed = seed;
  }

  public getSeed(): number {
    return this.config.seed || 0;
  }

  public getHoveredChampion(): number | null {
    return this.config.hoveredChampionId || null;
  }

  public getSelectionState(): {
    isHovering: boolean;
    isSelecting: boolean;
    hoveredChampionId: number | null;
  } {
    const currentAction = PICK_BAN_ORDER[this.config.currentTurn];
    if (!currentAction || this.config.currentTurn >= PICK_BAN_ORDER.length) {
      return { isHovering: false, isSelecting: false, hoveredChampionId: null };
    }

    const now = Date.now();
    const timerStart = this.config.timerStartTime || now;
    const elapsed = now - timerStart;

    // Use actual phase timer (27 seconds) instead of autoAdvanceInterval
    const phaseTime = 27000; // 27 seconds for ban/pick phases

    // Create 2-second hover periods with 1-second gaps
    const hoverCycleDuration = 3000; // 3 seconds total (2s hover + 1s gap)
    const cycleElapsed = elapsed % hoverCycleDuration;

    // Hover for first 2 seconds of each cycle, then 1 second gap
    const isHovering = cycleElapsed < 2000; // 2 seconds of hovering

    // Start selecting after 80% of phase time
    const selectionStartTime = phaseTime * 0.8; // Start selecting at 80% of phase time (21.6 seconds)
    const isSelecting = elapsed >= selectionStartTime;

    // Change hovered champion every few seconds for variety
    const championChangeInterval = 3000; // Change champion every 3 seconds
    const championCycle = Math.floor(elapsed / championChangeInterval);

    return {
      isHovering,
      isSelecting,
      hoveredChampionId: isHovering ? this.getChampionForCycle(championCycle) : null
    };
  }

  private getChampionForCycle(cycle: number): number {
    // Use different champions based on the cycle for variety
    const index = (cycle + (this.config.seed || 0)) % POPULAR_CHAMPIONS.length;
    return POPULAR_CHAMPIONS[index];
  }

  private updatePhase(): void {
    const currentAction = PICK_BAN_ORDER[this.config.currentTurn];
    if (currentAction) {
      this.config.currentPhase = currentAction.phase as MockPhase;
    }
  }

  private getCompletedActions(): Array<{
    team: "blue" | "red";
    type: "pick" | "ban";
    championId: number;
  }> {
    const actions: Array<{
      team: "blue" | "red";
      type: "pick" | "ban";
      championId: number;
    }> = [];

    for (let i = 0; i < this.config.currentTurn; i++) {
      const action = PICK_BAN_ORDER[i];
      if (action) {
        // Use deterministic champion selection based on turn index and seed
        const index = (i + (this.config.seed || 0)) % POPULAR_CHAMPIONS.length;
        const championId = POPULAR_CHAMPIONS[index];
        actions.push({
          team: action.team as "blue" | "red",
          type: action.type as "pick" | "ban",
          championId
        });
      }
    }

    return actions;
  }

  public generateMockData(): EnhancedChampSelectSession {
    const completedActions = this.getCompletedActions();
    const currentAction = PICK_BAN_ORDER[this.config.currentTurn];
    const selectionState = this.getSelectionState();

    // Reset timerStartTime if phase or turn changed
    if (this.prevPhase !== this.config.currentPhase || this.prevTurn !== this.config.currentTurn) {
      this.config.timerStartTime = Date.now();
    }
    this.prevPhase = this.config.currentPhase;
    this.prevTurn = this.config.currentTurn;

    // Calculate timer - use actual timer start time for proper countdown
    const isInfinite = this.config.currentPhase === "FINALIZATION";
    const baseTime = isInfinite ? 59000 : 27000; // 59 seconds for finalization, 27 seconds for ban/pick phases
    const startTime = this.config.timerStartTime || Date.now();
    let elapsed = Date.now() - startTime;
    let timeLeft = Math.max(0, baseTime - elapsed);

    // Auto-advance turn if timer runs out
    if (timeLeft <= 0 && !isInfinite) {
      this.advanceTurn();
      // After advancing, recalculate timer
      const newBaseTime = this.config.currentPhase === "FINALIZATION" ? 59000 : 27000;
      this.config.timerStartTime = Date.now();
      elapsed = 0;
      timeLeft = newBaseTime;
    }
    // Calculate bans and picks
    const blueBans = completedActions.filter((a) => a.team === "blue" && a.type === "ban").map((a) => a.championId);
    const redBans = completedActions.filter((a) => a.team === "red" && a.type === "ban").map((a) => a.championId);
    const bluePicks = completedActions.filter((a) => a.team === "blue" && a.type === "pick").map((a) => a.championId);
    const redPicks = completedActions.filter((a) => a.team === "red" && a.type === "pick").map((a) => a.championId);

    // Helper function to get the current picking player index
    const getCurrentPickingPlayerIndex = (team: "blue" | "red"): number => {
      if (!currentAction || currentAction.type !== "pick" || currentAction.team !== team) {
        return -1;
      }

      const currentTurn = this.config.currentTurn;

      // Separate mappings for blue and red teams
      const bluePlayerMapping: Record<number, number> = {
        6: 0, // Blue first pick
        9: 1, // Blue second pick
        10: 2, // Blue third pick
        17: 3, // Blue fourth pick
        18: 4 // Blue fifth pick
      };

      const redPlayerMapping: Record<number, number> = {
        7: 0, // Red first pick
        8: 1, // Red second pick
        11: 2, // Red third pick
        16: 3, // Red fourth pick
        19: 4 // Red fifth pick
      };

      const mapping = team === "blue" ? bluePlayerMapping : redPlayerMapping;
      return mapping[currentTurn] ?? -1;
    };

    // Create player data - updated for new pick/ban structure
    const myTeam = [
      {
        cellId: 0,
        championId: bluePicks[0] || 0,
        summonerId: 1,
        summonerName: "Baus",
        puuid: "mock1",
        isBot: false,
        isActingNow: getCurrentPickingPlayerIndex("blue") === 0,
        pickTurn: 1,
        banTurn: 1,
        team: 100,
        playerInfo: {
          id: "1",
          name: "Baus",
          role: "TOP" as const,
          profileImage: "/assets/default/player.png"
        },
        role: "TOP" as const,
        profileImage: "/assets/default/player.png"
      },
      {
        cellId: 1,
        championId: bluePicks[1] || 0,
        summonerId: 2,
        summonerName: "Velja",
        puuid: "mock2",
        isBot: false,
        isActingNow: getCurrentPickingPlayerIndex("blue") === 1,
        pickTurn: 3,
        banTurn: 2,
        team: 100,
        playerInfo: {
          id: "2",
          name: "Velja",
          role: "JUNGLE" as const,
          profileImage: "/assets/default/player.png"
        },
        role: "JUNGLE" as const,
        profileImage: "/assets/default/player.png"
      },
      {
        cellId: 2,
        championId: bluePicks[2] || 0,
        summonerId: 3,
        summonerName: "Nemesis",
        puuid: "mock3",
        isBot: false,
        isActingNow: getCurrentPickingPlayerIndex("blue") === 2,
        pickTurn: 5,
        banTurn: 3,
        team: 100,
        playerInfo: {
          id: "3",
          name: "Nemesis",
          role: "MID" as const,
          profileImage: "/assets/default/player.png"
        },
        role: "MID" as const,
        profileImage: "/assets/default/player.png"
      },
      {
        cellId: 3,
        championId: bluePicks[3] || 0,
        summonerId: 4,
        summonerName: "Crownie",
        puuid: "mock4",
        isBot: false,
        isActingNow: getCurrentPickingPlayerIndex("blue") === 3,
        pickTurn: 7,
        banTurn: 4,
        team: 100,
        playerInfo: {
          id: "4",
          name: "Crownie",
          role: "BOTTOM" as const,
          profileImage: "/assets/default/player.png"
        },
        role: "BOTTOM" as const,
        profileImage: "/assets/default/player.png"
      },
      {
        cellId: 4,
        championId: bluePicks[4] || 0,
        summonerId: 5,
        summonerName: "Rekkles",
        puuid: "mock5",
        isBot: false,
        isActingNow: getCurrentPickingPlayerIndex("blue") === 4,
        pickTurn: 9,
        banTurn: 5,
        team: 100,
        playerInfo: {
          id: "5",
          name: "Rekkles",
          role: "SUPPORT" as const,
          profileImage: "/assets/default/player.png"
        },
        role: "SUPPORT" as const,
        profileImage: "/assets/default/player.png"
      }
    ];

    const theirTeam = [
      {
        cellId: 5,
        championId: redPicks[0] || 0,
        summonerId: 6,
        summonerName: "frajgo",
        puuid: "mock6",
        isBot: false,
        isActingNow: getCurrentPickingPlayerIndex("red") === 0,
        pickTurn: 2,
        banTurn: 6,
        team: 200,
        playerInfo: {
          id: "6",
          name: "frajgo",
          role: "TOP" as const,
          profileImage: "/assets/default/player.png"
        },
        role: "TOP" as const,
        profileImage: "/assets/default/player.png"
      },
      {
        cellId: 6,
        championId: redPicks[1] || 0,
        summonerId: 7,
        summonerName: "Rybson",
        puuid: "mock7",
        isBot: false,
        isActingNow: getCurrentPickingPlayerIndex("red") === 1,
        pickTurn: 4,
        banTurn: 7,
        team: 200,
        playerInfo: {
          id: "7",
          name: "Rybson",
          role: "JUNGLE" as const,
          profileImage: "/assets/default/player.png"
        },
        role: "JUNGLE" as const,
        profileImage: "/assets/default/player.png"
      },
      {
        cellId: 7,
        championId: redPicks[2] || 0,
        summonerId: 8,
        summonerName: "Mrozku",
        puuid: "mock8",
        isBot: false,
        isActingNow: getCurrentPickingPlayerIndex("red") === 2,
        pickTurn: 6,
        banTurn: 8,
        team: 200,
        playerInfo: {
          id: "8",
          name: "Mrozku",
          role: "MID" as const,
          profileImage: "/assets/default/player.png"
        },
        role: "MID" as const,
        profileImage: "/assets/default/player.png"
      },
      {
        cellId: 8,
        championId: redPicks[3] || 0,
        summonerId: 9,
        summonerName: "Zamulek",
        puuid: "mock9",
        isBot: false,
        isActingNow: getCurrentPickingPlayerIndex("red") === 3,
        pickTurn: 8,
        banTurn: 9,
        team: 200,
        playerInfo: {
          id: "9",
          name: "Zamulek",
          role: "BOTTOM" as const,
          profileImage: "/assets/default/player.png"
        },
        role: "BOTTOM" as const,
        profileImage: "/assets/default/player.png"
      },
      {
        cellId: 9,
        championId: redPicks[4] || 0,
        summonerId: 10,
        summonerName: "minemaciek",
        puuid: "mock10",
        isBot: false,
        isActingNow: getCurrentPickingPlayerIndex("red") === 4,
        pickTurn: 10,
        banTurn: 10,
        team: 200,
        playerInfo: {
          id: "10",
          name: "minemaciek",
          role: "SUPPORT" as const,
          profileImage: "/assets/default/player.png"
        },
        role: "SUPPORT" as const,
        profileImage: "/assets/default/player.png"
      }
    ];

    return {
      phase: this.config.currentPhase,
      timer: {
        adjustedTimeLeftInPhase: timeLeft,
        totalTimeInPhase: baseTime,
        phase: this.config.currentPhase,
        isInfinite
      },
      chatDetails: {
        chatRoomName: "mock-chat",
        chatRoomPassword: "mock-password"
      },
      myTeam,
      theirTeam,
      trades: [],
      actions: [],
      bans: {
        myTeamBans: blueBans,
        theirTeamBans: redBans
      },
      localPlayerCellId: 0,
      isSpectating: false,
      // Add hover and selection state
      hoverState: {
        isHovering: selectionState.isHovering,
        isSelecting: selectionState.isSelecting,
        hoveredChampionId: selectionState.hoveredChampionId,
        currentTeam: (currentAction?.team as "blue" | "red") || null,
        currentActionType: (currentAction?.type as "pick" | "ban") || null,
        currentTurn: this.config.currentTurn
      },
      // Series data for Fearless Draft
      isFearlessDraft: true,
      usedChampions: [], // Empty array for now, can be populated with champions from previous games
      fearlessBans: {
        blue: [
          // TOP - 4 bans
          { championId: 266, role: "TOP" }, // Aatrox
          { championId: 122, role: "TOP" }, // Darius
          { championId: 164, role: "TOP" }, // Camille
          { championId: 86, role: "TOP" }, // Garen

          // JUNGLE - 4 bans
          { championId: 103, role: "JUNGLE" }, // Ahri
          { championId: 64, role: "JUNGLE" }, // Lee Sin
          { championId: 121, role: "JUNGLE" }, // Kha'Zix
          { championId: 104, role: "JUNGLE" }, // Graves

          // MID - 4 bans
          { championId: 84, role: "MID" }, // Akali
          { championId: 13, role: "MID" }, // Ryze
          { championId: 157, role: "MID" }, // Yasuo
          { championId: 7, role: "MID" }, // LeBlanc

          // BOTTOM - 4 bans
          { championId: 777, role: "BOTTOM" }, // Yone
          { championId: 51, role: "BOTTOM" }, // Caitlyn
          { championId: 202, role: "BOTTOM" }, // Jhin
          { championId: 222, role: "BOTTOM" }, // Jinx

          // SUPPORT - 4 bans
          { championId: 21, role: "SUPPORT" }, // Miss Fortune
          { championId: 12, role: "SUPPORT" }, // Alistar
          { championId: 201, role: "SUPPORT" }, // Braum
          { championId: 412, role: "SUPPORT" } // Thresh
        ],
        red: [
          // TOP - 4 bans
          { championId: 32, role: "TOP" }, // Amumu
          { championId: 82, role: "TOP" }, // Mordekaiser
          { championId: 58, role: "TOP" }, // Renekton
          { championId: 92, role: "TOP" }, // Riven

          // JUNGLE - 4 bans
          { championId: 34, role: "JUNGLE" }, // Anivia
          { championId: 60, role: "JUNGLE" }, // Elise
          { championId: 203, role: "JUNGLE" }, // Kindred
          { championId: 113, role: "JUNGLE" }, // Sejuani

          // MID - 4 bans
          { championId: 1, role: "MID" }, // Annie
          { championId: 69, role: "MID" }, // Cassiopeia
          { championId: 61, role: "MID" }, // Orianna
          { championId: 134, role: "MID" }, // Syndra

          // BOTTOM - 4 bans
          { championId: 523, role: "BOTTOM" }, // Aphelios
          { championId: 22, role: "BOTTOM" }, // Ashe
          { championId: 145, role: "BOTTOM" }, // Kai'Sa
          { championId: 429, role: "BOTTOM" }, // Kalista

          // SUPPORT - 4 bans
          { championId: 44, role: "SUPPORT" }, // Taric
          { championId: 267, role: "SUPPORT" }, // Nami
          { championId: 117, role: "SUPPORT" }, // Lulu
          { championId: 16, role: "SUPPORT" } // Soraka
        ]
      },
      tournamentData: {
        tournament: {
          id: "c8ca4d50-49e6-4956-9849-a35a83fc737b",
          name: this.config.tournamentName!,
          logo: {
            type: "url",
            url: "http://localhost:2137/assets/default/tournament.png"
          },
          matchInfo: {
            roundName: this.config.roundName!,
            matchNumber: this.config.matchNumber!,
            bestOf: this.config.bestOf!
          }
        },
        blueTeam: LosRatones,
        redTeam: FajnieMiecSklad
      }
    };
  }

  public getCurrentState(): {
    phase: MockPhase;
    turn: number;
    totalTurns: number;
  } {
    return {
      phase: this.config.currentPhase,
      turn: this.config.currentTurn,
      totalTurns: PICK_BAN_ORDER.length
    };
  }

  public forceHoverState(isHovering: boolean): void {
    const phaseTime = 27000; // 27 seconds for ban/pick phases
    const hoverStartTime = phaseTime * 0.6; // Start hovering at 60% of phase time

    if (isHovering) {
      // Force enter hover state by setting timer to hover start time
      this.config.timerStartTime = Date.now() - hoverStartTime;
    } else {
      // Force exit hover state by resetting timer
      this.config.timerStartTime = Date.now() - phaseTime;
    }
  }

  public forceChampionHover(championId: number): void {
    // Force the current turn to hover a specific champion without ending the turn
    this.config.hoveredChampionId = championId;
    this.config.timerStartTime = Date.now() - 1000; // Set timer to 1 second ago to trigger hover state
  }
}

// Create a global instance for easy access
export const dynamicMock = new DynamicChampSelectMock();

// Export a function to get the current mock data
export const getDynamicMockData = (): EnhancedChampSelectSession => {
  return dynamicMock.generateMockData();
};
