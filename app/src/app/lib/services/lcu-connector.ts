interface LCUCredentials {
  port: string;
  password: string;
  protocol: string;
}

interface ChampSelectPlayer {
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
}

interface ChampSelectAction {
  id: number;
  actorCellId: number;
  championId: number;
  completed: boolean;
  type: 'pick' | 'ban';
  isInProgress: boolean;
}

interface ChampSelectTimer {
  adjustedTimeLeftInPhase: number;
  totalTimeInPhase: number;
  phase: string;
  isInfinite: boolean;
}

interface ChampSelectSession {
  phase: string;
  timer: ChampSelectTimer;
  chatDetails: {
    chatRoomName: string;
    chatRoomPassword: string;
  };
  myTeam: ChampSelectPlayer[];
  theirTeam: ChampSelectPlayer[];
  trades: unknown[];
  actions: ChampSelectAction[][];
  bans: {
    myTeamBans: number[];
    theirTeamBans: number[];
  };
  localPlayerCellId: number;
  isSpectating: boolean;
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface LCUConnectorOptions {
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  pollInterval?: number;
}

class LCUConnector {
  private credentials: LCUCredentials | null = null;
  private connectionStatus: ConnectionStatus = 'disconnected';
  private pollingInterval: NodeJS.Timeout | null = null;
  private retryTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  
  private readonly autoReconnect: boolean;
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

  // Getters
  public getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  public getCredentials(): LCUCredentials | null {
    return this.credentials;
  }

  public isConnected(): boolean {
    return this.connectionStatus === 'connected';
  }

  // Private methods
  private setConnectionStatus(status: ConnectionStatus): void {
    this.connectionStatus = status;
    this.onStatusChange?.(status);
  }

  private async findLCUCredentials(): Promise<LCUCredentials> {
    try {
      const response = await fetch('/api/v1/cameras/lcu-credentials');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get LCU credentials');
      }
      
      const data = await response.json();
      return {
        port: data.credentials.port,
        password: data.credentials.password,
        protocol: data.credentials.protocol
      };
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Could not find League Client process. Make sure League of Legends is running.');
    }
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PATCH' = 'GET', body?: unknown): Promise<unknown> {
    if (!this.credentials) {
      throw new Error('No LCU credentials available');
    }

    const url = `${this.credentials.protocol}://127.0.0.1:${this.credentials.port}${endpoint}`;
    const auth = btoa(`riot:${this.credentials.password}`);

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`LCU request failed: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  }

  private async pollChampSelect(): Promise<void> {
    try {
      const response = await fetch('/api/v1/cameras/lcu-champselect');
      const result = await response.json();
      
      if (result.success) {
        this.onChampSelectUpdate?.(result.data || null);
      } else {
        console.error('Champion select polling failed:', result.message);
        this.onChampSelectUpdate?.(null);
      }
    } catch (error) {
      console.error('Error polling champ select:', error);
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

  private clearRetryTimeout(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  }

  // Public methods
  public async connect(): Promise<void> {
    this.setConnectionStatus('connecting');
    this.reconnectAttempts = 0;

    try {
      // Use the working direct test endpoint to verify LCU connection
      const testResponse = await fetch('/api/v1/cameras/lcu-test-direct');
      const testResult = await testResponse.json();
      
      if (!testResult.success) {
        throw new Error(testResult.message || testResult.error || 'LCU test failed');
      }

      // Get credentials from the working endpoint
      const credentials = await this.findLCUCredentials();
      
      // Connection successful
      this.credentials = credentials;
      this.setConnectionStatus('connected');
      
      // Start polling for champion select data
      this.startPolling();
      
    } catch (error) {
      this.setConnectionStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to League Client';
      this.onError?.(errorMessage);
      
      if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
    
    this.retryTimeout = setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      this.connect();
    }, delay);
  }

  public disconnect(): void {
    this.stopPolling();
    this.clearRetryTimeout();
    
    this.setConnectionStatus('disconnected');
    this.credentials = null;
    this.reconnectAttempts = 0;
    this.onChampSelectUpdate?.(null);
  }

  public async testConnection(): Promise<{ success: boolean; message: string; summoner?: unknown }> {
    try {
      const response = await fetch('/api/v1/cameras/lcu-test-direct');
      const result = await response.json();
      
      if (result.success) {
        const summoner = result.summoner;
        return {
          success: true,
          message: `✅ Test successful! Connected to summoner: ${summoner?.gameName || 'Unknown'} (Level ${summoner?.summonerLevel || '?'}) via ${result.method}`,
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
        message: `❌ Test error: ${err instanceof Error ? err.message : 'Unknown error'}`
      };
    }
  }

  public async checkStatus(): Promise<{ success: boolean; message: string; checks?: unknown }> {
    try {
      const response = await fetch('/api/v1/cameras/lcu-status');
      const result = await response.json();
      
      const checks = result.checks;
      let statusMsg = `📊 League Status:\n`;
      statusMsg += `• Platform: ${checks.platform}\n`;
      statusMsg += `• Installed: ${checks.leagueInstalled ? '✅' : '❌'}\n`;
      statusMsg += `• Running: ${checks.leagueRunning ? '✅' : '❌'}\n`;
      statusMsg += `• Lockfile: ${checks.lockfileExists ? '✅' : '❌'}\n`;
      
      if (checks.lockfileDetails) {
        statusMsg += `• Port: ${checks.lockfileDetails.port}\n`;
        statusMsg += `• Protocol: ${checks.lockfileDetails.protocol}`;
      }
      
      const success = checks.leagueInstalled && checks.leagueRunning && checks.lockfileExists;
      
      return {
        success,
        message: statusMsg,
        checks
      };
    } catch (err) {
      return {
        success: false,
        message: `❌ Status check error: ${err instanceof Error ? err.message : 'Unknown error'}`
      };
    }
  }

  public destroy(): void {
    this.disconnect();
  }
}

export { LCUConnector, type LCUCredentials, type ChampSelectSession, type ConnectionStatus }; 