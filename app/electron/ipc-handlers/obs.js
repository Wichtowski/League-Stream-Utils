/* eslint-disable @typescript-eslint/no-require-imports */
import { ipcMain } from "electron";
import WebSocket from "ws";
/* eslint-enable @typescript-eslint/no-require-imports */

class OBSClient {
  constructor(host = "localhost", port = 4455, password) {
    this.host = host;
    this.port = port;
    this.password = password;
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.requestIdCounter = 0;
    this.pendingRequests = new Map();
    this.eventListeners = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      try {
        const url = `ws://${this.host}:${this.port}`;
        this.ws = new WebSocket(url);

        this.ws.on("open", () => {
          console.log("OBS WebSocket connected");
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve(true);
        });

        this.ws.on("message", (data) => {
          this.handleMessage(data.toString());
        });

        this.ws.on("close", () => {
          console.log("OBS WebSocket disconnected");
          this.isConnected = false;
          this.handleDisconnect();
        });

        this.ws.on("error", (error) => {
          console.error("OBS WebSocket error:", error);
          this.isConnected = false;
          reject(new Error("Failed to connect to OBS"));
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.pendingRequests.clear();
  }

  getConnectionStatus() {
    return this.isConnected;
  }

  handleMessage(data) {
    try {
      const message = JSON.parse(data);

      if (message.requestId && this.pendingRequests.has(message.requestId)) {
        const { resolve, reject } = this.pendingRequests.get(message.requestId);
        this.pendingRequests.delete(message.requestId);

        if (message.requestStatus?.result) {
          resolve(message.responseData);
        } else {
          reject(
            new Error(message.requestStatus?.comment || "OBS request failed"),
          );
        }
      } else if (message.eventType) {
        this.handleEvent(message.eventType, message.eventData);
      }
    } catch (error) {
      console.error("Failed to parse OBS message:", error);
    }
  }

  handleEvent(eventType, eventData) {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach((listener) => listener(eventData));
    }
  }

  handleDisconnect() {
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

  async sendRequest(requestType, data = {}) {
    if (!this.isConnected || !this.ws) {
      throw new Error("Not connected to OBS");
    }

    const requestId = (++this.requestIdCounter).toString();
    const request = {
      requestType,
      requestId,
      ...data,
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });
      this.ws.send(JSON.stringify(request));
    });
  }

  on(eventType, callback) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType).push(callback);
  }

  off(eventType, callback) {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Scene Management
  async getSceneList() {
    const response = await this.sendRequest("GetSceneList");
    return response.scenes;
  }

  async setCurrentScene(sceneName) {
    await this.sendRequest("SetCurrentProgramScene", { sceneName });
  }

  async getCurrentScene() {
    const response = await this.sendRequest("GetCurrentProgramScene");
    return response.currentProgramSceneName;
  }

  async createScene(sceneName) {
    await this.sendRequest("CreateScene", { sceneName });
  }

  async removeScene(sceneName) {
    await this.sendRequest("RemoveScene", { sceneName });
  }

  // Stream Control
  async startStreaming() {
    await this.sendRequest("StartStreaming");
  }

  async stopStreaming() {
    await this.sendRequest("StopStreaming");
  }

  async getStreamingStatus() {
    const response = await this.sendRequest("GetStreamingStatus");
    return {
      isStreaming: response.isStreaming,
      isRecording: response.isRecording,
    };
  }

  // Recording Control
  async startRecording() {
    await this.sendRequest("StartRecording");
  }

  async stopRecording() {
    await this.sendRequest("StopRecording");
  }

  // Source Management
  async getSourceList() {
    return await this.sendRequest("GetSourceList");
  }

  async setSourceEnabled(sourceName, enabled) {
    await this.sendRequest("SetSourceEnabled", {
      sourceName,
      sourceEnabled: enabled,
    });
  }

  async getSourceEnabled(sourceName) {
    const response = await this.sendRequest("GetSourceEnabled", { sourceName });
    return response.sourceEnabled;
  }
}

let obsClient = null;

function registerOBSHandlers() {
  ipcMain.handle("obs-connect", async (event, config) => {
    try {
      const { host = "localhost", port = 4455, password } = config;

      if (obsClient) {
        obsClient.disconnect();
      }

      obsClient = new OBSClient(host, port, password);
      await obsClient.connect();

      return { success: true, message: "Connected to OBS" };
    } catch (error) {
      console.error("Failed to connect to OBS:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("obs-disconnect", async () => {
    try {
      if (obsClient) {
        obsClient.disconnect();
        obsClient = null;
      }
      return { success: true, message: "Disconnected from OBS" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("obs-get-connection-status", async () => {
    return {
      isConnected: obsClient ? obsClient.getConnectionStatus() : false,
    };
  });

  // Scene Management
  ipcMain.handle("obs-get-scene-list", async () => {
    try {
      if (!obsClient || !obsClient.getConnectionStatus()) {
        throw new Error("Not connected to OBS");
      }
      const scenes = await obsClient.getSceneList();
      return { success: true, scenes };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("obs-set-current-scene", async (event, sceneName) => {
    try {
      if (!obsClient || !obsClient.getConnectionStatus()) {
        throw new Error("Not connected to OBS");
      }
      await obsClient.setCurrentScene(sceneName);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("obs-get-current-scene", async () => {
    try {
      if (!obsClient || !obsClient.getConnectionStatus()) {
        throw new Error("Not connected to OBS");
      }
      const sceneName = await obsClient.getCurrentScene();
      return { success: true, sceneName };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("obs-create-scene", async (event, sceneName) => {
    try {
      if (!obsClient || !obsClient.getConnectionStatus()) {
        throw new Error("Not connected to OBS");
      }
      await obsClient.createScene(sceneName);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("obs-remove-scene", async (event, sceneName) => {
    try {
      if (!obsClient || !obsClient.getConnectionStatus()) {
        throw new Error("Not connected to OBS");
      }
      await obsClient.removeScene(sceneName);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Stream Control
  ipcMain.handle("obs-start-streaming", async () => {
    try {
      if (!obsClient || !obsClient.getConnectionStatus()) {
        throw new Error("Not connected to OBS");
      }
      await obsClient.startStreaming();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("obs-stop-streaming", async () => {
    try {
      if (!obsClient || !obsClient.getConnectionStatus()) {
        throw new Error("Not connected to OBS");
      }
      await obsClient.stopStreaming();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("obs-get-streaming-status", async () => {
    try {
      if (!obsClient || !obsClient.getConnectionStatus()) {
        throw new Error("Not connected to OBS");
      }
      const status = await obsClient.getStreamingStatus();
      return { success: true, ...status };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Recording Control
  ipcMain.handle("obs-start-recording", async () => {
    try {
      if (!obsClient || !obsClient.getConnectionStatus()) {
        throw new Error("Not connected to OBS");
      }
      await obsClient.startRecording();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("obs-stop-recording", async () => {
    try {
      if (!obsClient || !obsClient.getConnectionStatus()) {
        throw new Error("Not connected to OBS");
      }
      await obsClient.stopRecording();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Source Management
  ipcMain.handle("obs-get-source-list", async () => {
    try {
      if (!obsClient || !obsClient.getConnectionStatus()) {
        throw new Error("Not connected to OBS");
      }
      const result = await obsClient.getSourceList();
      return { success: true, sources: result.sources };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(
    "obs-set-source-enabled",
    async (event, { sourceName, enabled }) => {
      try {
        if (!obsClient || !obsClient.getConnectionStatus()) {
          throw new Error("Not connected to OBS");
        }
        await obsClient.setSourceEnabled(sourceName, enabled);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
  );

  ipcMain.handle("obs-get-source-enabled", async (event, sourceName) => {
    try {
      if (!obsClient || !obsClient.getConnectionStatus()) {
        throw new Error("Not connected to OBS");
      }
      const enabled = await obsClient.getSourceEnabled(sourceName);
      return { success: true, enabled };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

export { registerOBSHandlers };
