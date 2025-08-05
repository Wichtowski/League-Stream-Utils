"use client";

import { useState, useEffect, useCallback } from "react";
import {
  VideoCameraIcon,
  PlayIcon,
  StopIcon,
  WifiIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/lib/components/common/buttons/Button";
import { useModal } from "@lib/contexts/ModalContext";

interface OBSScene {
  sceneIndex: number;
  sceneName: string;
  sceneEnabled: boolean;
}

interface OBSSource {
  sourceName: string;
  sourceType: string;
}

interface OBSStreamingStatus {
  isStreaming: boolean;
  isRecording: boolean;
}

export const OBSControl = () => {
  const { showAlert } = useModal();
  const [isElectron, setIsElectron] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [scenes, setScenes] = useState<OBSScene[]>([]);
  const [sources, setSources] = useState<OBSSource[]>([]);
  const [currentScene, setCurrentScene] = useState<string>("");
  const [streamingStatus, setStreamingStatus] = useState<OBSStreamingStatus>({
    isStreaming: false,
    isRecording: false,
  });
  const [config, setConfig] = useState({
    host: "localhost",
    port: 4455,
    password: "",
  });

  const loadConfig = useCallback(() => {
    const obsPort = process.env.OBS_PORT;
    const obsPassword = process.env.OBS_PASSWORD;

    if (obsPort) {
      setConfig((prev) => ({ ...prev, port: parseInt(obsPort) }));
    }
    if (obsPassword) {
      setConfig((prev) => ({ ...prev, password: obsPassword }));
    }
  }, []);

  const loadScenes = useCallback(async () => {
    if (!isElectron || !window.electronAPI?.obsGetSceneList) return;

    try {
      const result = await window.electronAPI.obsGetSceneList();
      if (result.success) {
        setScenes(result.scenes || []);
      }
    } catch (error) {
      console.error("Failed to load scenes:", error);
    }
  }, [isElectron]);

  const loadSources = useCallback(async () => {
    if (!isElectron || !window.electronAPI?.obsGetSourceList) return;

    try {
      const result = await window.electronAPI.obsGetSourceList();
      if (result.success) {
        setSources(result.sources || []);
      }
    } catch (error) {
      console.error("Failed to load sources:", error);
    }
  }, [isElectron]);

  const loadCurrentScene = useCallback(async () => {
    if (!isElectron || !window.electronAPI?.obsGetCurrentScene) return;

    try {
      const result = await window.electronAPI.obsGetCurrentScene();
      if (result.success) {
        setCurrentScene(result.sceneName || "");
      }
    } catch (error) {
      console.error("Failed to load current scene:", error);
    }
  }, [isElectron]);

  const loadStreamingStatus = useCallback(async () => {
    if (!isElectron || !window.electronAPI?.obsGetStreamingStatus) return;

    try {
      const result = await window.electronAPI.obsGetStreamingStatus();
      if (result.success) {
        setStreamingStatus({
          isStreaming: result.isStreaming || false,
          isRecording: result.isRecording || false,
        });
      }
    } catch (error) {
      console.error("Failed to load streaming status:", error);
    }
  }, [isElectron]);

  const handleConnect = async () => {
    if (!isElectron || !window.electronAPI?.obsConnect) return;

    setIsConnecting(true);
    try {
      const result = await window.electronAPI.obsConnect(config);
      if (result.success) {
        setIsConnected(true);
        await loadScenes();
        await loadSources();
        await loadCurrentScene();
        await loadStreamingStatus();
        await showAlert({
          type: "success",
          message: "Connected to OBS successfully!",
        });
      } else {
        await showAlert({
          type: "error",
          message: `Failed to connect to OBS: ${result.error}`,
        });
      }
    } catch (error) {
      console.error("Failed to connect to OBS:", error);
      await showAlert({ type: "error", message: "Failed to connect to OBS" });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!isElectron || !window.electronAPI?.obsDisconnect) return;

    try {
      const result = await window.electronAPI.obsDisconnect();
      if (result.success) {
        setIsConnected(false);
        setScenes([]);
        setSources([]);
        setCurrentScene("");
        setStreamingStatus({ isStreaming: false, isRecording: false });
        await showAlert({ type: "success", message: "Disconnected from OBS" });
      }
    } catch (error) {
      console.error("Failed to disconnect from OBS:", error);
    }
  };

  const handleSetScene = async (sceneName: string) => {
    if (!isElectron || !window.electronAPI?.obsSetCurrentScene) return;

    try {
      const result = await window.electronAPI.obsSetCurrentScene(sceneName);
      if (result.success) {
        setCurrentScene(sceneName);
        await showAlert({
          type: "success",
          message: `Switched to scene: ${sceneName}`,
        });
      } else {
        await showAlert({
          type: "error",
          message: `Failed to switch scene: ${result.error}`,
        });
      }
    } catch (error) {
      console.error("Failed to set scene:", error);
      await showAlert({ type: "error", message: "Failed to switch scene" });
    }
  };

  const handleStartStreaming = async () => {
    if (!isElectron || !window.electronAPI?.obsStartStreaming) return;

    try {
      const result = await window.electronAPI.obsStartStreaming();
      if (result.success) {
        setStreamingStatus((prev) => ({ ...prev, isStreaming: true }));
        await showAlert({ type: "success", message: "Streaming started" });
      } else {
        await showAlert({
          type: "error",
          message: `Failed to start streaming: ${result.error}`,
        });
      }
    } catch (error) {
      console.error("Failed to start streaming:", error);
      await showAlert({ type: "error", message: "Failed to start streaming" });
    }
  };

  const handleStopStreaming = async () => {
    if (!isElectron || !window.electronAPI?.obsStopStreaming) return;

    try {
      const result = await window.electronAPI.obsStopStreaming();
      if (result.success) {
        setStreamingStatus((prev) => ({ ...prev, isStreaming: false }));
        await showAlert({ type: "success", message: "Streaming stopped" });
      } else {
        await showAlert({
          type: "error",
          message: `Failed to stop streaming: ${result.error}`,
        });
      }
    } catch (error) {
      console.error("Failed to stop streaming:", error);
      await showAlert({ type: "error", message: "Failed to stop streaming" });
    }
  };

  const handleStartRecording = async () => {
    if (!isElectron || !window.electronAPI?.obsStartRecording) return;

    try {
      const result = await window.electronAPI.obsStartRecording();
      if (result.success) {
        setStreamingStatus((prev) => ({ ...prev, isRecording: true }));
        await showAlert({ type: "success", message: "Recording started" });
      } else {
        await showAlert({
          type: "error",
          message: `Failed to start recording: ${result.error}`,
        });
      }
    } catch (error) {
      console.error("Failed to start recording:", error);
      await showAlert({ type: "error", message: "Failed to start recording" });
    }
  };

  const loadConnectionStatus = useCallback(async () => {
    if (!isElectron || !window.electronAPI?.obsGetConnectionStatus) return;

    try {
      const result = await window.electronAPI.obsGetConnectionStatus();
      setIsConnected(result.isConnected);

      if (result.isConnected) {
        await loadScenes();
        await loadSources();
        await loadCurrentScene();
        await loadStreamingStatus();
      }
    } catch (error) {
      console.error("Failed to load OBS connection status:", error);
    }
  }, [
    isElectron,
    loadScenes,
    loadSources,
    loadCurrentScene,
    loadStreamingStatus,
  ]);

  useEffect(() => {
    setIsElectron(
      typeof window !== "undefined" && !!window.electronAPI?.isElectron,
    );

    if (isElectron) {
      loadConnectionStatus();
      loadConfig();
    }
  }, [isElectron, loadConnectionStatus, loadConfig]);

  const handleStopRecording = async () => {
    if (!isElectron || !window.electronAPI?.obsStopRecording) return;

    try {
      const result = await window.electronAPI.obsStopRecording();
      if (result.success) {
        setStreamingStatus((prev) => ({ ...prev, isRecording: false }));
        await showAlert({ type: "success", message: "Recording stopped" });
      } else {
        await showAlert({
          type: "error",
          message: `Failed to stop recording: ${result.error}`,
        });
      }
    } catch (error) {
      console.error("Failed to stop recording:", error);
      await showAlert({ type: "error", message: "Failed to stop recording" });
    }
  };

  if (!isElectron) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <VideoCameraIcon className="w-6 h-6 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-100">OBS Control</h3>
        </div>
        <p className="text-sm text-gray-300">
          OBS control is only available in the desktop application.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Section */}
      <div className="bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <VideoCameraIcon className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-100">OBS Connection</h3>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <WifiIcon className="w-5 h-5 text-green-500" />
            ) : (
              <WifiIcon className="w-5 h-5 text-red-500" />
            )}
            <span
              className={`text-sm ${isConnected ? "text-green-600" : "text-red-600"}`}
            >
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>

        {!isConnected ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Host
                </label>
                <input
                  type="text"
                  value={config.host}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, host: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="localhost"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Port
                </label>
                <input
                  type="number"
                  value={config.port}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      port: parseInt(e.target.value) || 4455,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="4455"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={config.password}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, password: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="OBS WebSocket password"
                  required={true}
                />
              </div>
            </div>
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full md:w-auto"
            >
              {isConnecting ? "Connecting..." : "Connect to OBS"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-300">
              Connected to OBS at {config.host}:{config.port}
            </p>
            <Button onClick={handleDisconnect} variant="secondary">
              Disconnect
            </Button>
          </div>
        )}
      </div>

      {/* Scene Control */}
      {isConnected && (
        <div className="bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-100 mb-4">
            Scene Control
          </h3>

          <div className="mb-4">
            <p className="text-sm text-gray-300 mb-2">
              Current Scene:{" "}
              <span className="font-medium text-gray-100">
                {currentScene || "None"}
              </span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {scenes.map((scene) => (
              <button
                key={scene.sceneName}
                onClick={() => handleSetScene(scene.sceneName)}
                className={`p-3 border rounded-lg text-left transition-colors ${
                  currentScene === scene.sceneName
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="font-medium">{scene.sceneName}</div>
                <div className="text-sm text-gray-400">
                  Scene {scene.sceneIndex}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stream/Recording Control */}
      {isConnected && (
        <div className="bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-100 mb-4">
            Stream & Recording Control
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Streaming */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-100">Streaming</h4>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className={`w-3 h-3 rounded-full ${streamingStatus.isStreaming ? "bg-red-500" : "bg-gray-300"}`}
                ></div>
                <span className="text-sm text-gray-300">
                  {streamingStatus.isStreaming ? "Live" : "Offline"}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleStartStreaming}
                  disabled={streamingStatus.isStreaming}
                  className="flex-1"
                >
                  <PlayIcon className="w-4 h-4 mr-2" />
                  Start Stream
                </Button>
                <Button
                  onClick={handleStopStreaming}
                  disabled={!streamingStatus.isStreaming}
                  variant="secondary"
                  className="flex-1"
                >
                  <StopIcon className="w-4 h-4 mr-2" />
                  Stop Stream
                </Button>
              </div>
            </div>

            {/* Recording */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-100">Recording</h4>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className={`w-3 h-3 rounded-full ${streamingStatus.isRecording ? "bg-red-500" : "bg-gray-300"}`}
                ></div>
                <span className="text-sm text-gray-300">
                  {streamingStatus.isRecording ? "Recording" : "Stopped"}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleStartRecording}
                  disabled={streamingStatus.isRecording}
                  className="flex-1"
                >
                  <PlayIcon className="w-4 h-4 mr-2" />
                  Start Recording
                </Button>
                <Button
                  onClick={handleStopRecording}
                  disabled={!streamingStatus.isRecording}
                  variant="secondary"
                  className="flex-1"
                >
                  <StopIcon className="w-4 h-4 mr-2" />
                  Stop Recording
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sources List */}
      {isConnected && sources.length > 0 && (
        <div className="bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-100 mb-4">Sources</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sources.map((source) => (
              <div
                key={source.sourceName}
                className="p-3 border border-gray-600 rounded-lg bg-gray-700"
              >
                <div className="font-medium text-sm text-gray-100">
                  {source.sourceName}
                </div>
                <div className="text-xs text-gray-400">{source.sourceType}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
