"use client";

import type { ChampSelectSession } from "@lib/types";

interface LCUCredentials {
  port: string;
  protocol: string;
}

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

interface LCUConnectorOptions {
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  pollInterval?: number;
}

class LCUConnector {
  private credentials: LCUCredentials | null = null;
  private connectionStatus: ConnectionStatus = "disconnected";
  private pollingInterval: NodeJS.Timeout | null = null;
  private retryTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;

  private autoReconnect: boolean;
  private readonly maxReconnectAttempts: number;
  private readonly pollInterval: number;

  // Event handlers
  private onStatusChange?: (status: ConnectionStatus) => void;
  private onChampSelectUpdate?: (data: ChampSelectSession | null) => void;
  private onError?: (error: string) => void;

  constructor(options: LCUConnectorOptions = {}) {
    this.autoReconnect = options.autoReconnect ?? true;
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 5;
    this.pollInterval = options.pollInterval ?? 1000;
  }

  // Event handler setters
  public setOnStatusChange(handler: (status: ConnectionStatus) => void): void {
    this.onStatusChange = handler;
  }

  public setOnChampSelectUpdate(handler: (data: ChampSelectSession | null) => void): void {
    this.onChampSelectUpdate = handler;
  }

  public setOnError(handler: (error: string) => void): void {
    this.onError = handler;
  }

  // Public methods
  public async connect(): Promise<void> {
    this.setConnectionStatus("connecting");
    this.reconnectAttempts = 0;

    try {
      // Get credentials from the working endpoint
      const credentials = await this.findLCUCredentials();

      if (!credentials) {
        this.setConnectionStatus("error");
        this.onError?.("Could not find League Client process. Make sure League of Legends is running.");
        if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
        return;
      }

      // Connection successful
      this.credentials = credentials;
      this.setConnectionStatus("connected");

      // Start polling immediately when connected
      this.startPolling();
    } catch (error) {
      console.warn(error instanceof Error ? error.message : "Failed to connect to League Client");
      this.setConnectionStatus("error");
      const errorMessage = error instanceof Error ? error.message : "Failed to connect to League Client";
      this.onError?.(errorMessage);

      if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    }
  }

  public disconnect(): void {
    this.stopPolling();
    this.clearRetryTimeout();
    this.setConnectionStatus("disconnected");
    this.credentials = null;
    this.reconnectAttempts = 0;
    this.onChampSelectUpdate?.(null);
  }

  private async scheduleReconnect(): Promise<void> {
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);

    this.retryTimeout = setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      this.connect();
    }, delay);
  }

  private clearRetryTimeout(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  }

  // Private methods
  private setConnectionStatus(status: ConnectionStatus): void {
    this.connectionStatus = status;
    this.onStatusChange?.(status);
  }

  private async findLCUCredentials(): Promise<LCUCredentials | null> {
    try {
      const response = await fetch("/api/v1/leagueclient/lcu-credentials");

      if (!response.ok) {
        const errorData = await response.json();
        console.warn(errorData.message || "Failed to get LCU credentials");
        return null;
      }

      const data = await response.json();
      if (!data.credentials) {
        console.warn(data.message || "No credentials found in response");
        return null;
      }
      return {
        port: data.credentials.port,
        protocol: data.credentials.protocol
      };
    } catch (err) {
      console.warn(
        err instanceof Error
          ? err.message
          : "Could not find League Client process. Make sure League of Legends is running."
      );
      return null;
    }
  }

  private async pollChampSelect(): Promise<void> {
    try {
      const response = await fetch("/api/cs");
      const result = await response.json();

      if (result.success) {
        this.onChampSelectUpdate?.(result.data || null);
      } else {
        console.warn("Champion select polling failed:", result.message);
        this.onChampSelectUpdate?.(null);
      }
    } catch (error) {
      console.error("Error polling champ select:", error);
      this.onChampSelectUpdate?.(null);
    }
  }

  private startPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    this.pollingInterval = setInterval(() => {
      this.pollChampSelect();
    }, this.pollInterval);
  }

  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  public async testConnection(): Promise<{
    success: boolean;
    message: string;
    summoner?: unknown;
  }> {
    try {
      const response = await fetch("/api/v1/leagueclient/lcu-test");
      const result = await response.json();

      if (result.success) {
        const summoner = result.summoner;
        return {
          success: true,
          message: `✅ Test successful! Connected to summoner: ${summoner?.gameName || "Unknown"} (Level ${summoner?.summonerLevel || "?"}) via ${result.method}`,
          summoner
        };
      } else {
        return {
          success: false,
          message: `❌ Test failed: ${result.message || result.error}`
        };
      }
    } catch (err) {
      return {
        success: false,
        message: `❌ Test error: ${err instanceof Error ? err.message : "Unknown error"}`
      };
    }
  }

  public async checkStatus(): Promise<{
    success: boolean;
    message: string;
    checks?: unknown;
  }> {
    try {
      const response = await fetch("/api/v1/leagueclient/lcu-test");
      const result = await response.json();

      if (result.success) {
        const summoner = result.summoner;
        const statusMsg = `✅ League Client Connected!\n• Summoner: ${summoner?.displayName || "Unknown"}\n• Level: ${summoner?.summonerLevel || "?"}\n• Port: ${result.credentials?.port}\n• Protocol: ${result.credentials?.protocol}`;

        return {
          success: true,
          message: statusMsg,
          checks: {
            connected: true,
            summoner: summoner,
            credentials: result.credentials
          }
        };
      } else {
        return {
          success: false,
          message: `❌ League Client not found: ${result.message || result.error}`,
          checks: {
            connected: false,
            error: result.error
          }
        };
      }
    } catch (err) {
      return {
        success: false,
        message: `❌ Status check error: ${err instanceof Error ? err.message : "Unknown error"}`
      };
    }
  }

  public destroy(): void {
    this.disconnect();
  }
}

export { LCUConnector, type LCUCredentials, type ConnectionStatus };
