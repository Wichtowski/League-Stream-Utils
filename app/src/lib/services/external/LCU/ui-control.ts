import { LCUClient } from "./client";

export interface RenderSettings {
  interfaceAll?: boolean;
  interfaceAnnounce?: boolean;
  interfaceChat?: boolean;
  interfaceFrames?: boolean;
  interfaceKillCallouts?: boolean;
  interfaceMinimap?: boolean;
  interfaceNeutralTimers?: boolean;
  interfaceQuests?: boolean;
  interfaceReplay?: boolean;
  interfaceScore?: boolean;
  interfaceScoreboard?: boolean;
  interfaceTarget?: boolean;
  interfaceTimeline?: boolean;
  fieldOfView?: number;
  banners?: boolean;
}

export class LCUUIControl {
  constructor(private lcuClient: LCUClient) {}

  /**
   * Hide all UI elements
   */
  async hideAllUI(): Promise<void> {
    const renderSettings: RenderSettings = {
      interfaceAll: false,
      interfaceAnnounce: false,
      interfaceChat: false,
      interfaceFrames: false,
      interfaceKillCallouts: false,
      interfaceMinimap: false,
      interfaceNeutralTimers: false,
      interfaceQuests: false,
      interfaceReplay: false,
      interfaceScore: false,
      interfaceScoreboard: false,
      interfaceTarget: false,
      interfaceTimeline: false
    };

    await this.lcuClient.post('/replay/render', renderSettings);
  }

  /**
   * Show all UI elements
   */
  async showAllUI(): Promise<void> {
    const renderSettings: RenderSettings = {
      interfaceAll: true,
      interfaceAnnounce: true,
      interfaceChat: true,
      interfaceFrames: true,
      interfaceKillCallouts: true,
      interfaceMinimap: true,
      interfaceNeutralTimers: true,
      interfaceQuests: true,
      interfaceReplay: true,
      interfaceScore: true,
      interfaceScoreboard: true,
      interfaceTarget: true,
      interfaceTimeline: true
    };

    await this.lcuClient.post('/replay/render', renderSettings);
  }

  /**
   * Hide most UI elements but keep essential ones:
   * - Minimap
   * - Kill callouts
   * - Announcements
   * - Neutral timers
   * - Quests
   * Also sets field of view to 50.0 and enables banners
   */
  async hideUIKeepEssentials(): Promise<void> {
    const renderSettings: RenderSettings = {
      interfaceAll: false,
      interfaceAnnounce: true,
      interfaceChat: false,
      interfaceFrames: false,
      interfaceKillCallouts: true,
      interfaceMinimap: true,
      interfaceNeutralTimers: true,
      interfaceQuests: true,
      interfaceReplay: false,
      interfaceScore: false,
      interfaceScoreboard: false,
      interfaceTarget: false,
      interfaceTimeline: false,
      fieldOfView: 50.0,
      banners: true
    };

    await this.lcuClient.post('/replay/render', renderSettings);
  }

  /**
   * Get current render settings
   */
  async getCurrentRenderSettings(): Promise<RenderSettings> {
    return await this.lcuClient.get<RenderSettings>('/replay/render');
  }

  /**
   * Set custom render settings
   */
  async setCustomRenderSettings(settings: RenderSettings): Promise<void> {
    await this.lcuClient.post('/replay/render', settings);
  }
}
