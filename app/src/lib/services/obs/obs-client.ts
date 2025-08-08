interface OBSScene {
  sceneIndex: number;
  sceneName: string;
  sceneEnabled: boolean;
}

interface OBSResponse<T = unknown> {
  requestType: string;
  requestId: string;
  responseData: T;
  requestStatus: {
    result: boolean;
    code: number;
    comment: string;
  };
}

interface OBSRequest {
  requestType: string;
  requestId: string;
  [key: string]: unknown;
}

class OBSClient {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private requestIdCounter = 0;
  private pendingRequests = new Map<string, { resolve: (value: unknown) => void; reject: (error: Error) => void }>();
  private eventListeners = new Map<string, ((data: unknown) => void)[]>();

  constructor(
    private host: string = "localhost",
    private port: number = 4455,
    private password?: string
  ) {}

  async connect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const url = `ws://${this.host}:${this.port}`;
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log("OBS WebSocket connected");
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onclose = () => {
          console.log("OBS WebSocket disconnected");
          this.isConnected = false;
          this.handleDisconnect();
        };

        this.ws.onerror = (error) => {
          console.error("OBS WebSocket error:", error);
          this.isConnected = false;
          reject(new Error("Failed to connect to OBS"));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.pendingRequests.clear();
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      if (message.requestId && this.pendingRequests.has(message.requestId)) {
        const { resolve, reject } = this.pendingRequests.get(message.requestId)!;
        this.pendingRequests.delete(message.requestId);

        if (message.requestStatus?.result) {
          resolve(message.responseData);
        } else {
          reject(new Error(message.requestStatus?.comment || "OBS request failed"));
        }
      } else if (message.eventType) {
        this.handleEvent(message.eventType, message.eventData);
      }
    } catch (error) {
      console.error("Failed to parse OBS message:", error);
    }
  }

  private handleEvent(eventType: string, eventData: unknown): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach((listener) => listener(eventData));
    }
  }

  private handleDisconnect(): void {
    this.pendingRequests.forEach(({ reject }) => {
      reject(new Error("OBS connection lost"));
    });
    this.pendingRequests.clear();

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect().catch(() => {
          console.log(`Reconnect attempt ${this.reconnectAttempts} failed`);
        });
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  private async sendRequest(requestType: string, data?: Record<string, unknown>): Promise<unknown> {
    if (!this.isConnected || !this.ws) {
      throw new Error("Not connected to OBS");
    }

    const requestId = (++this.requestIdCounter).toString();
    const request: OBSRequest = {
      requestType,
      requestId,
      ...data
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });
      this.ws!.send(JSON.stringify(request));
    });
  }

  on(eventType: string, callback: (data: unknown) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(callback);
  }

  off(eventType: string, callback: (data: unknown) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Scene Management
  async getSceneList(): Promise<OBSScene[]> {
    const response = (await this.sendRequest("GetSceneList")) as {
      scenes: OBSScene[];
    };
    return response.scenes;
  }

  async setCurrentScene(sceneName: string): Promise<void> {
    await this.sendRequest("SetCurrentProgramScene", { sceneName });
  }

  async getCurrentScene(): Promise<string> {
    const response = (await this.sendRequest("GetCurrentProgramScene")) as {
      currentProgramSceneName: string;
    };
    return response.currentProgramSceneName;
  }

  async createScene(sceneName: string): Promise<void> {
    await this.sendRequest("CreateScene", { sceneName });
  }

  async removeScene(sceneName: string): Promise<void> {
    await this.sendRequest("RemoveScene", { sceneName });
  }

  // Stream Control
  async startStreaming(): Promise<void> {
    await this.sendRequest("StartStreaming");
  }

  async stopStreaming(): Promise<void> {
    await this.sendRequest("StopStreaming");
  }

  async getStreamingStatus(): Promise<{
    isStreaming: boolean;
    isRecording: boolean;
  }> {
    const response = (await this.sendRequest("GetStreamingStatus")) as {
      isStreaming: boolean;
      isRecording: boolean;
    };
    return response;
  }

  // Recording Control
  async startRecording(): Promise<void> {
    await this.sendRequest("StartRecording");
  }

  async stopRecording(): Promise<void> {
    await this.sendRequest("StopRecording");
  }

  // Source Management
  async getSourceList(): Promise<{
    sources: Array<{ sourceName: string; sourceType: string }>;
  }> {
    return (await this.sendRequest("GetSourceList")) as {
      sources: Array<{ sourceName: string; sourceType: string }>;
    };
  }

  async setSourceEnabled(sourceName: string, enabled: boolean): Promise<void> {
    await this.sendRequest("SetSourceEnabled", {
      sourceName,
      sourceEnabled: enabled
    });
  }

  async getSourceEnabled(sourceName: string): Promise<boolean> {
    const response = (await this.sendRequest("GetSourceEnabled", {
      sourceName
    })) as { sourceEnabled: boolean };
    return response.sourceEnabled;
  }
}

export { OBSClient };
export type { OBSScene, OBSResponse, OBSRequest };
