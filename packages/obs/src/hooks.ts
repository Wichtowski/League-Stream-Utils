import { useRef, useCallback } from 'react';
import { create } from 'zustand';
import { OBSClient, type OBSConnectionStatus } from './client';

interface OBSState {
  status: OBSConnectionStatus;
  currentScene: string | null;
  scenes: unknown[];
  setStatus: (status: OBSConnectionStatus) => void;
  setScenes: (scenes: unknown[], current: string) => void;
}

export const useOBSStore = create<OBSState>((set) => ({
  status: 'disconnected',
  currentScene: null,
  scenes: [],
  setStatus: (status) => set({ status }),
  setScenes: (scenes, current) => set({ scenes, currentScene: current }),
}));

export function useOBS() {
  const clientRef = useRef<OBSClient | null>(null);
  const store = useOBSStore;

  const getClient = useCallback(() => {
    if (!clientRef.current) {
      clientRef.current = new OBSClient((status) => {
        store.getState().setStatus(status);
      });
    }
    return clientRef.current;
  }, []);

  const connect = useCallback(async (url?: string, password?: string) => {
    const client = getClient();
    await client.connect(url, password);
    const { scenes, currentScene } = await client.getScenes();
    store.getState().setScenes(scenes, currentScene);
  }, [getClient]);

  const disconnect = useCallback(async () => {
    await clientRef.current?.disconnect();
  }, []);

  const switchScene = useCallback(async (sceneName: string) => {
    const client = getClient();
    await client.setCurrentScene(sceneName);
    store.getState().setScenes(store.getState().scenes, sceneName);
  }, [getClient]);

  return { connect, disconnect, switchScene, getClient };
}
