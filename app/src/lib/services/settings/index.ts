"use client";

export interface AppSettings {
  lcu: LCUSettings;
  theme: "light" | "dark" | "auto";
  language: string;
  notifications: boolean;
}

export interface LCUSettings {
  autoReconnect: boolean;
  lastConnectedAt?: Date;
  connectionAttempts: number;
  wasConnected: boolean;
}

export interface SettingsManager {
  loadSettings(): Promise<AppSettings>;
  saveSettings(settings: Partial<AppSettings>): Promise<void>;
  getLCUSettings(): Promise<LCUSettings>;
  updateLCUSettings(settings: Partial<LCUSettings>): Promise<void>;
  resetSettings(): Promise<void>;
}

class SettingsService implements SettingsManager {
  private readonly STORAGE_KEY = "web-app-settings";
  private readonly DEFAULT_SETTINGS: AppSettings = {
    lcu: {
      autoReconnect: true,
      connectionAttempts: 0,
      wasConnected: false
    },
    theme: "dark",
    language: "en",
    notifications: true
  };

  public async loadSettings(): Promise<AppSettings> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...this.DEFAULT_SETTINGS,
          ...parsed,
          lcu: {
            ...this.DEFAULT_SETTINGS.lcu,
            ...parsed.lcu,
            lastConnectedAt: parsed.lcu?.lastConnectedAt ? new Date(parsed.lcu.lastConnectedAt) : undefined
          }
        };
      }
    } catch (error) {
      console.warn("Failed to load app settings:", error);
    }

    return this.DEFAULT_SETTINGS;
  }

  public async saveSettings(settings: Partial<AppSettings>): Promise<void> {
    try {
      const current = await this.loadSettings();
      const updated = { ...current, ...settings };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.warn("Failed to save app settings:", error);
    }
  }

  public async getLCUSettings(): Promise<LCUSettings> {
    const settings = await this.loadSettings();
    return settings.lcu;
  }

  public async updateLCUSettings(lcuSettings: Partial<LCUSettings>): Promise<void> {
    const current = await this.loadSettings();
    await this.saveSettings({
      ...current,
      lcu: { ...current.lcu, ...lcuSettings }
    });
  }

  public async resetSettings(): Promise<void> {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn("Failed to reset settings:", error);
    }
  }

  public async getTheme(): Promise<"light" | "dark" | "auto"> {
    const settings = await this.loadSettings();
    return settings.theme;
  }

  public async setTheme(theme: "light" | "dark" | "auto"): Promise<void> {
    await this.saveSettings({ theme });
  }

  public async getNotifications(): Promise<boolean> {
    const settings = await this.loadSettings();
    return settings.notifications;
  }

  public async setNotifications(enabled: boolean): Promise<void> {
    await this.saveSettings({ notifications: enabled });
  }
}

// Singleton instance
export const settingsService = new SettingsService();
