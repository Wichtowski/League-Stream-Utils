// @ts-ignore - obs-websocket-js doesn't have proper types in some environments
const OBSWebSocket = require('obs-websocket-js').default || require('obs-websocket-js');

interface OBSConnectionConfig {
    address: string;
    port: number;
    password?: string;
}

interface OBSScene {
    sceneName: string;
    sceneIndex: number;
    sources: Array<{
        sourceName: string;
        sourceKind: string;
        sourceType: string;
    }>;
}

interface OBSSource {
    sourceName: string;
    sourceKind: string;
    sourceType: string;
    sourceSettings: Record<string, any>;
}

interface StreamingStats {
    streaming: boolean;
    recording: boolean;
    streamTime: string;
    droppedFrames: number;
    totalFrames: number;
    cpuUsage: number;
    memoryUsage: number;
    fps: number;
}

class OBSIntegrationService {
    private obs: any;
    private isConnected: boolean = false;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private reconnectInterval: number = 5000; // 5 seconds
    private connectionConfig: OBSConnectionConfig | null = null;
    private eventListeners: Map<string, Function[]> = new Map();

    constructor() {
        if (typeof window !== 'undefined') {
            this.obs = new OBSWebSocket();
            this.setupEventListeners();
        }
    }

    private setupEventListeners(): void {
        if (!this.obs) return;

        this.obs.on('ConnectionOpened', () => {
            console.log('✅ OBS WebSocket connected');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.emit('connected');
        });

        this.obs.on('ConnectionClosed', () => {
            console.log('🔌 OBS WebSocket disconnected');
            this.isConnected = false;
            this.emit('disconnected');
            this.attemptReconnect();
        });

        this.obs.on('ConnectionError', (error: any) => {
            console.error('❌ OBS WebSocket connection error:', error);
            this.isConnected = false;
            this.emit('error', error);
        });

        // Scene events
        this.obs.on('CurrentProgramSceneChanged', (data: any) => {
            this.emit('sceneChanged', data.sceneName);
        });

        // Streaming events
        this.obs.on('StreamStateChanged', (data: any) => {
            this.emit('streamStateChanged', data);
        });

        this.obs.on('RecordStateChanged', (data: any) => {
            this.emit('recordStateChanged', data);
        });

        // Source events
        this.obs.on('SourceActiveStateChanged', (data: any) => {
            this.emit('sourceStateChanged', data);
        });
    }

    async connect(config: OBSConnectionConfig): Promise<boolean> {
        if (!this.obs) return false;

        try {
            this.connectionConfig = config;
            const address = `ws://${config.address}:${config.port}`;

            await this.obs.connect(address, config.password);
            return true;
        } catch (error) {
            console.error('Failed to connect to OBS:', error);
            return false;
        }
    }

    async disconnect(): Promise<void> {
        if (this.isConnected && this.obs) {
            await this.obs.disconnect();
        }
    }

    private async attemptReconnect(): Promise<void> {
        if (this.reconnectAttempts >= this.maxReconnectAttempts || !this.connectionConfig) {
            console.log('Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        console.log(`Attempting to reconnect to OBS (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(async () => {
            try {
                await this.connect(this.connectionConfig!);
            } catch (error) {
                console.error('Reconnection failed:', error);
            }
        }, this.reconnectInterval);
    }

    // Event management
    on(event: string, callback: Function): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event)!.push(callback);
    }

    off(event: string, callback: Function): void {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    private emit(event: string, ...args: any[]): void {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.forEach(callback => callback(...args));
        }
    }

    // Scene management
    async getScenes(): Promise<OBSScene[]> {
        if (!this.isConnected || !this.obs) throw new Error('Not connected to OBS');

        try {
            const response = await this.obs.call('GetSceneList');
            return response.scenes.map((scene: any, index: number) => ({
                sceneName: scene.sceneName,
                sceneIndex: index,
                sources: scene.sources || []
            }));
        } catch (error) {
            console.error('Failed to get scenes:', error);
            throw error;
        }
    }

    async getCurrentScene(): Promise<string> {
        if (!this.isConnected || !this.obs) throw new Error('Not connected to OBS');

        try {
            const response = await this.obs.call('GetCurrentProgramScene');
            return response.currentProgramSceneName;
        } catch (error) {
            console.error('Failed to get current scene:', error);
            throw error;
        }
    }

    async setCurrentScene(sceneName: string): Promise<void> {
        if (!this.isConnected || !this.obs) throw new Error('Not connected to OBS');

        try {
            await this.obs.call('SetCurrentProgramScene', { sceneName });
            console.log(`Switched to scene: ${sceneName}`);
        } catch (error) {
            console.error('Failed to set scene:', error);
            throw error;
        }
    }

    // Source management
    async getSourceSettings(sourceName: string): Promise<any> {
        if (!this.isConnected || !this.obs) throw new Error('Not connected to OBS');

        try {
            const response = await this.obs.call('GetSourceSettings', { sourceName });
            return response.sourceSettings;
        } catch (error) {
            console.error('Failed to get source settings:', error);
            throw error;
        }
    }

    async setSourceSettings(sourceName: string, settings: Record<string, any>): Promise<void> {
        if (!this.isConnected || !this.obs) throw new Error('Not connected to OBS');

        try {
            await this.obs.call('SetSourceSettings', {
                sourceName,
                sourceSettings: settings
            });
            console.log(`Updated settings for source: ${sourceName}`);
        } catch (error) {
            console.error('Failed to set source settings:', error);
            throw error;
        }
    }

    async setSourceVisibility(sourceName: string, visible: boolean, sceneName?: string): Promise<void> {
        if (!this.isConnected || !this.obs) throw new Error('Not connected to OBS');

        try {
            await this.obs.call('SetSceneItemEnabled', {
                sceneName: sceneName || await this.getCurrentScene(),
                sceneItemId: await this.getSceneItemId(sourceName, sceneName),
                sceneItemEnabled: visible
            });
            console.log(`Set ${sourceName} visibility to ${visible}`);
        } catch (error) {
            console.error('Failed to set source visibility:', error);
            throw error;
        }
    }

    private async getSceneItemId(sourceName: string, sceneName?: string): Promise<number> {
        const currentScene = sceneName || await this.getCurrentScene();
        const response = await this.obs.call('GetSceneItemList', { sceneName: currentScene });

        const item = response.sceneItems.find((item: any) => item.sourceName === sourceName);
        if (!item) {
            throw new Error(`Source ${sourceName} not found in scene ${currentScene}`);
        }

        return item.sceneItemId;
    }

    // Streaming controls
    async startStreaming(): Promise<void> {
        if (!this.isConnected) throw new Error('Not connected to OBS');

        try {
            await this.obs.call('StartStream');
            console.log('Started streaming');
        } catch (error) {
            console.error('Failed to start streaming:', error);
            throw error;
        }
    }

    async stopStreaming(): Promise<void> {
        if (!this.isConnected) throw new Error('Not connected to OBS');

        try {
            await this.obs.call('StopStream');
            console.log('Stopped streaming');
        } catch (error) {
            console.error('Failed to stop streaming:', error);
            throw error;
        }
    }

    async startRecording(): Promise<void> {
        if (!this.isConnected) throw new Error('Not connected to OBS');

        try {
            await this.obs.call('StartRecord');
            console.log('Started recording');
        } catch (error) {
            console.error('Failed to start recording:', error);
            throw error;
        }
    }

    async stopRecording(): Promise<void> {
        if (!this.isConnected) throw new Error('Not connected to OBS');

        try {
            await this.obs.call('StopRecord');
            console.log('Stopped recording');
        } catch (error) {
            console.error('Failed to stop recording:', error);
            throw error;
        }
    }

    // Statistics
    async getStreamingStats(): Promise<StreamingStats> {
        if (!this.isConnected) throw new Error('Not connected to OBS');

        try {
            const [streamStatus, recordStatus, stats] = await Promise.all([
                this.obs.call('GetStreamStatus'),
                this.obs.call('GetRecordStatus'),
                this.obs.call('GetStats')
            ]);

            return {
                streaming: streamStatus.outputActive,
                recording: recordStatus.outputActive,
                streamTime: streamStatus.outputTimecode || '00:00:00',
                droppedFrames: stats.outputSkippedFrames || 0,
                totalFrames: stats.outputTotalFrames || 0,
                cpuUsage: stats.cpuUsage || 0,
                memoryUsage: stats.memoryUsage || 0,
                fps: stats.activeFps || 0
            };
        } catch (error) {
            console.error('Failed to get streaming stats:', error);
            throw error;
        }
    }

    // Tournament-specific automation
    async setupChampionSelectScene(blueTeamName: string, redTeamName: string): Promise<void> {
        try {
            // Set champion select scene
            await this.setCurrentScene('Champion Select');

            // Update team name sources if they exist
            try {
                await this.setSourceSettings('Blue Team Name', { text: blueTeamName });
                await this.setSourceSettings('Red Team Name', { text: redTeamName });
            } catch (error) {
                console.warn('Team name sources not found, skipping update');
            }

            // Update browser source URL for pick/ban overlay
            const pickBanUrl = `http://localhost:3000/pickban/obs`;
            await this.setSourceSettings('Pick/Ban Overlay', { url: pickBanUrl });

            console.log('Champion select scene configured');
        } catch (error) {
            console.error('Failed to setup champion select scene:', error);
            throw error;
        }
    }

    async setupInGameScene(): Promise<void> {
        try {
            await this.setCurrentScene('In Game');

            // Ensure game capture is visible
            await this.setSourceVisibility('Game Capture', true);

            // Update in-game overlay
            const overlayUrl = `http://localhost:3000/stream/overlay`;
            await this.setSourceSettings('In-Game Overlay', { url: overlayUrl });

            console.log('In-game scene configured');
        } catch (error) {
            console.error('Failed to setup in-game scene:', error);
            throw error;
        }
    }

    async setupBreakScene(message: string = 'Break'): Promise<void> {
        try {
            await this.setCurrentScene('Break');

            // Update break message if source exists
            try {
                await this.setSourceSettings('Break Message', { text: message });
            } catch (error) {
                console.warn('Break message source not found, skipping update');
            }

            console.log('Break scene configured');
        } catch (error) {
            console.error('Failed to setup break scene:', error);
            throw error;
        }
    }

    // Utility methods
    getConnectionStatus(): { connected: boolean; attempts: number } {
        return {
            connected: this.isConnected,
            attempts: this.reconnectAttempts
        };
    }

    async testConnection(): Promise<boolean> {
        if (!this.isConnected) return false;

        try {
            await this.obs.call('GetVersion');
            return true;
        } catch (error) {
            return false;
        }
    }
}

// Export singleton instance
export const obsIntegration = new OBSIntegrationService();
export default obsIntegration;
export type { OBSConnectionConfig, OBSScene, OBSSource, StreamingStats }; 