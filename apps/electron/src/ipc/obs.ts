import { ipcMain } from 'electron';
import OBSWebSocket from 'obs-websocket-js';

let obs: OBSWebSocket | null = null;

export function registerOBSHandlers() {
  ipcMain.handle('obs:connect', async (_e, url: string, password?: string) => {
    obs = new OBSWebSocket();
    await obs.connect(url, password);
    return { success: true };
  });

  ipcMain.handle('obs:disconnect', async () => {
    if (obs) {
      await obs.disconnect();
      obs = null;
    }
    return { success: true };
  });

  ipcMain.handle('obs:get-scenes', async () => {
    if (!obs) throw new Error('OBS not connected');
    const { scenes, currentProgramSceneName } = await obs.call('GetSceneList');
    return { scenes, currentScene: currentProgramSceneName };
  });

  ipcMain.handle('obs:switch-scene', async (_e, sceneName: string) => {
    if (!obs) throw new Error('OBS not connected');
    await obs.call('SetCurrentProgramScene', { sceneName });
    return { success: true };
  });

  ipcMain.handle('obs:stream-status', async () => {
    if (!obs) throw new Error('OBS not connected');
    return obs.call('GetStreamStatus');
  });

  ipcMain.handle('obs:start-stream', async () => {
    if (!obs) throw new Error('OBS not connected');
    await obs.call('StartStream');
    return { success: true };
  });

  ipcMain.handle('obs:stop-stream', async () => {
    if (!obs) throw new Error('OBS not connected');
    await obs.call('StopStream');
    return { success: true };
  });
}
