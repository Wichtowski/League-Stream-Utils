import { MatchFormat, Tournament } from "@lib/types/tournament";
import { TournamentData } from "@lib/types/electron";

interface TournamentTemplate {
  id: string;
  name: string;
  description: string;
  version: string;
  lastModified: Date;

  // Tournament settings
  format: "BO1" | "BO3" | "BO5";
  tournamentStructure:
    | "Ladder"
    | "Swiss into Ladder"
    | "Round Robin into Ladder"
    | "Groups";
  maxTeams: number;
  fearlessDraft: boolean;
  allowSubstitutes: boolean;
  maxSubstitutes: number;

  // Visual settings
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundImage?: string;
  };

  // Streaming settings
  obs: {
    scenes: Array<{
      name: string;
      sources: Array<{
        name: string;
        type: string;
        settings: Record<string, string | number | boolean>;
      }>;
    }>;
    transitions: Array<{
      name: string;
      duration: number;
      type: string;
    }>;
  };

  // Champion select timing
  pickBanTiming: {
    ban1: number; // seconds
    pick1: number;
    ban2: number;
    pick2: number;
    reserve: number;
  };

  // Overlay templates
  overlays: {
    pickBan: {
      layout: string;
      animations: boolean;
      showPlayerCams: boolean;
      showCoachCams: boolean;
    };
    inGame: {
      scoreboard: boolean;
      itemTracker: boolean;
      goldDifference: boolean;
    };
  };

  // Asset paths (local to user data)
  assets: {
    logos: string[];
    backgrounds: string[];
    sounds: string[];
    fonts: string[];
  };
}

interface TournamentSettings {
  templateId?: string;
  name: string;
  startDate: Date;
  endDate: Date;
  registrationDeadline: Date;
  maxTeams: number;
  prizePool?: number;

  format?: MatchFormat;
  fearlessDraft?: boolean;
  customTheme?: Partial<TournamentTemplate["theme"]>;
  customOBSSettings?: Partial<TournamentTemplate["obs"]>;
}

class TournamentTemplateService {
  private templates: Map<string, TournamentTemplate> = new Map();
  private isElectron: boolean = false;

  constructor() {
    this.isElectron =
      typeof window !== "undefined" && !!window.electronAPI?.isElectron;
    this.loadDefaultTemplates();
  }

  private loadDefaultTemplates(): void {
    const leagueStandard: TournamentTemplate = {
      id: "league-standard",
      name: "League Standard Tournament",
      description:
        "Standard League tournament format with BO3 matches and professional overlay design",
      version: "1.0.0",
      lastModified: new Date(),

      format: "BO3",
      tournamentStructure: "Ladder",
      maxTeams: 16,
      fearlessDraft: false,
      allowSubstitutes: true,
      maxSubstitutes: 2,

      theme: {
        primaryColor: "#1e40af",
        secondaryColor: "#dc2626",
        accentColor: "#f59e0b",
        backgroundImage: "/assets/league-background.jpg",
      },

      obs: {
        scenes: [
          {
            name: "Champion Select",
            sources: [
              {
                name: "Pick/Ban Overlay",
                type: "browser_source",
                settings: {
                  url: "http://localhost:3000/pickban/obs",
                  width: 1920,
                  height: 1080,
                },
              },
              {
                name: "Blue Team Camera",
                type: "browser_source",
                settings: {
                  url: "http://localhost:3000/cameras/blue",
                  width: 400,
                  height: 225,
                },
              },
              {
                name: "Red Team Camera",
                type: "browser_source",
                settings: {
                  url: "http://localhost:3000/cameras/red",
                  width: 400,
                  height: 225,
                },
              },
            ],
          },
          {
            name: "In Game",
            sources: [
              {
                name: "Game Capture",
                type: "game_capture",
                settings: {
                  mode: "any_fullscreen",
                },
              },
              {
                name: "In-Game Overlay",
                type: "browser_source",
                settings: {
                  url: "http://localhost:3000/stream/overlay",
                  width: 1920,
                  height: 1080,
                },
              },
            ],
          },
        ],
        transitions: [
          {
            name: "Fade",
            duration: 500,
            type: "fade_transition",
          },
          {
            name: "Slide",
            duration: 300,
            type: "slide_transition",
          },
        ],
      },

      pickBanTiming: {
        ban1: 30,
        pick1: 30,
        ban2: 30,
        pick2: 30,
        reserve: 5,
      },

      overlays: {
        pickBan: {
          layout: "horizontal-split",
          animations: true,
          showPlayerCams: true,
          showCoachCams: true,
        },
        inGame: {
          scoreboard: true,
          itemTracker: false,
          goldDifference: true,
        },
      },

      assets: {
        logos: [],
        backgrounds: ["/assets/league-background.jpg"],
        sounds: ["/assets/champion-select-sound.mp3"],
        fonts: ["/assets/fonts/league-font.ttf"],
      },
    };

    // Casual Tournament Template
    const casualTemplate: TournamentTemplate = {
      id: "casual-tournament",
      name: "Casual Tournament",
      description: "Simple BO1 format for casual tournaments",
      version: "1.0.0",
      lastModified: new Date(),

      format: "BO1",
      tournamentStructure: "Round Robin into Ladder",
      maxTeams: 8,
      fearlessDraft: false,
      allowSubstitutes: false,
      maxSubstitutes: 0,

      theme: {
        primaryColor: "#059669", // Green
        secondaryColor: "#dc2626", // Red
        accentColor: "#8b5cf6", // Purple
      },

      obs: {
        scenes: [
          {
            name: "Champion Select",
            sources: [
              {
                name: "Simple Pick/Ban",
                type: "browser_source",
                settings: {
                  url: "http://localhost:3000/pickban/obs",
                  width: 1920,
                  height: 1080,
                },
              },
            ],
          },
        ],
        transitions: [
          {
            name: "Cut",
            duration: 0,
            type: "cut_transition",
          },
        ],
      },

      pickBanTiming: {
        ban1: 20,
        pick1: 25,
        ban2: 20,
        pick2: 25,
        reserve: 3,
      },

      overlays: {
        pickBan: {
          layout: "vertical-stack",
          animations: false,
          showPlayerCams: false,
          showCoachCams: false,
        },
        inGame: {
          scoreboard: true,
          itemTracker: false,
          goldDifference: false,
        },
      },

      assets: {
        logos: [],
        backgrounds: [],
        sounds: [],
        fonts: [],
      },
    };

    this.templates.set(leagueStandard.id, leagueStandard);
    this.templates.set(casualTemplate.id, casualTemplate);
  }

  async getAllTemplates(): Promise<TournamentTemplate[]> {
    return Array.from(this.templates.values());
  }

  async getTemplate(id: string): Promise<TournamentTemplate | null> {
    return this.templates.get(id) || null;
  }

  async saveTemplate(template: TournamentTemplate): Promise<void> {
    template.lastModified = new Date();
    this.templates.set(template.id, template);
    // Note: Templates are stored in memory only, not persisted to Electron storage
  }

  async deleteTemplate(id: string): Promise<boolean> {
    return this.templates.delete(id);
  }

  async createTournamentFromTemplate(
    templateId: string,
    settings: TournamentSettings,
  ): Promise<TournamentData> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Create tournament data structure
    const tournamentData: TournamentData = {
      tournament: {
        ...settings,
        id: `tournament_${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Tournament, // TODO: Implement proper Tournament type conversion
      teams: [],
      settings: {
        templateId: template.id,
        format: settings.format || template.format,
        fearlessDraft: settings.fearlessDraft ?? template.fearlessDraft,
      },
    };

    return tournamentData;
  }

  async exportTemplate(id: string): Promise<Blob | null> {
    const template = await this.getTemplate(id);
    if (!template) return null;

    const data = JSON.stringify(template, null, 2);
    return new Blob([data], { type: "application/json" });
  }

  async importTemplate(file: File): Promise<TournamentTemplate> {
    const text = await file.text();
    const template: TournamentTemplate = JSON.parse(text);

    // Validate template structure
    if (!template.id || !template.name || !template.version) {
      throw new Error("Invalid template format");
    }

    // Generate new ID to avoid conflicts
    template.id = `imported_${Date.now()}`;
    template.lastModified = new Date();

    await this.saveTemplate(template);
    return template;
  }

  // Utility methods for asset management
  async validateAssets(_template: TournamentTemplate): Promise<{
    valid: boolean;
    missingAssets: string[];
  }> {
    const missingAssets: string[] = [];

    // Check if assets exist (in Electron context)
    if (this.isElectron) {
      // TODO: Check asset files existence
      // for (const asset of [...template.assets.logos, ...template.assets.backgrounds]) {
      //   const exists = await window.electronAPI.fileExists(asset);
      //   if (!exists) missingAssets.push(asset);
      // }
    }

    return {
      valid: missingAssets.length === 0,
      missingAssets,
    };
  }

  async copyAssetsToUserData(_template: TournamentTemplate): Promise<void> {
    if (!this.isElectron) return;

    // TODO: Copy template assets to user data directory
    // for (const assetPath of [...template.assets.logos, ...template.assets.backgrounds]) {
    //   await window.electronAPI.copyAssetFile(assetPath, path.basename(assetPath));
    // }
  }
}

export type { TournamentTemplate, TournamentSettings };

// Export singleton instance
export const tournamentTemplates = new TournamentTemplateService();
