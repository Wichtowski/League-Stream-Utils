"use client";

import { LCUConnector, type ConnectionStatus } from "@lib/services/external/LCU/connector";
import type { ChampSelectSession } from "@lib/types";

export interface ConnectionManager {
  connect(): Promise<void>;
  disconnect(): void;
  reconnect(): Promise<void>;
  getStatus(): ConnectionStatus;
  isConnected(): boolean;
  isConnecting(): boolean;
  getConnectionAttempts(): number;
  onStatusChange(callback: (status: ConnectionStatus) => void): void;
  onChampSelectUpdate(callback: (data: ChampSelectSession | null) => void): void;
  onError(callback: (error: string) => void): void;
}

class ConnectionService implements ConnectionManager {
  private connector: LCUConnector;
  private status: ConnectionStatus = "disconnected";
  private connectionAttempts = 0;

  constructor() {
    this.connector = new LCUConnector({
      autoReconnect: true,
      maxReconnectAttempts: 5,
      pollInterval: 1000,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.connector.setOnStatusChange((status) => {
      this.status = status;
      this.handleStatusChange(status);
    });

    this.connector.setOnError((error) => {
      this.connectionAttempts++;
      this.handleError(error);
    });
  }

  private async handleStatusChange(status: ConnectionStatus): Promise<void> {
    console.log("ConnectionService: Status changed to:", status);

    if (status === "connected") {
      this.connectionAttempts = 0;
      console.log("ConnectionService: Connected successfully");
    } else if (status === "error") {
      this.connectionAttempts++;
    }
  }

  private async handleError(error: string): Promise<void> {
    console.error("Connection error:", error);
  }

  public async connect(): Promise<void> {
    if (this.status === "connecting" || this.status === "connected") {
      return;
    }

    try {
      await this.connector.connect();
    } catch (error) {
      console.error("Failed to connect to LCU:", error);
      throw error;
    }
  }

  public disconnect(): void {
    this.connector.disconnect();
  }

  public async reconnect(): Promise<void> {
    this.disconnect();
    setTimeout(() => this.connect(), 500);
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public isConnected(): boolean {
    return this.status === "connected";
  }

  public isConnecting(): boolean {
    return this.status === "connecting";
  }

  public getConnectionAttempts(): number {
    return this.connectionAttempts;
  }

  public onStatusChange(callback: (status: ConnectionStatus) => void): void {
    this.connector.setOnStatusChange(callback);
  }

  public onChampSelectUpdate(callback: (data: ChampSelectSession | null) => void): void {
    this.connector.setOnChampSelectUpdate(callback);
  }

  public onError(callback: (error: string) => void): void {
    this.connector.setOnError(callback);
  }

  public async testConnection(): Promise<{
    success: boolean;
    message: string;
    summoner?: unknown;
  }> {
    return this.connector.testConnection();
  }

  public async checkStatus(): Promise<{
    success: boolean;
    message: string;
    checks?: unknown;
  }> {
    return this.connector.checkStatus();
  }
}

// Singleton instance
export const connectionService = new ConnectionService();
