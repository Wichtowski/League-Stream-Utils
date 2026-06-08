import OBSWebSocket from "obs-websocket-js";

export type OBSConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export class OBSClient {
  private obs = new OBSWebSocket();
  private _status: OBSConnectionStatus = "disconnected";
  private onStatusChange?: (status: OBSConnectionStatus) => void;

  get status() {
    return this._status;
  }

  constructor(onChange?: (status: OBSConnectionStatus) => void) {
    this.onStatusChange = onChange;

    this.obs.on("ConnectionClosed", () => {
      this.setStatus("disconnected");
    });

    this.obs.on("ConnectionError", () => {
      this.setStatus("error");
    });
  }

  private setStatus(status: OBSConnectionStatus) {
    this._status = status;
    this.onStatusChange?.(status);
  }

  async connect(url = "ws://localhost:4455", password?: string) {
    this.setStatus("connecting");
    try {
      await this.obs.connect(url, password);
      this.setStatus("connected");
    } catch {
      this.setStatus("error");
      throw new Error("Failed to connect to OBS");
    }
  }

  async disconnect() {
    await this.obs.disconnect();
    this.setStatus("disconnected");
  }

  async getScenes() {
    const { scenes, currentProgramSceneName } = await this.obs.call("GetSceneList");

    return { scenes, currentScene: currentProgramSceneName };
  }

  async setCurrentScene(sceneName: string) {
    await this.obs.call("SetCurrentProgramScene", { sceneName });
  }

  async getSceneItems(sceneName: string) {
    const { sceneItems } = await this.obs.call("GetSceneItemList", { sceneName });

    return sceneItems;
  }

  async setSceneItemEnabled(sceneName: string, sceneItemId: number, enabled: boolean) {
    await this.obs.call("SetSceneItemEnabled", {
      sceneName,
      sceneItemId,
      sceneItemEnabled: enabled,
    });
  }

  async setInputSettings(inputName: string, settings: Record<string, unknown>) {
    await this.obs.call("SetInputSettings", {
      inputName,
      inputSettings: settings as Record<string, never>,
    });
  }

  async getStreamStatus() {
    return this.obs.call("GetStreamStatus");
  }

  async startStream() {
    await this.obs.call("StartStream");
  }

  async stopStream() {
    await this.obs.call("StopStream");
  }

  async getRecordStatus() {
    return this.obs.call("GetRecordStatus");
  }

  async startRecord() {
    await this.obs.call("StartRecord");
  }

  async stopRecord() {
    return this.obs.call("StopRecord");
  }
}
