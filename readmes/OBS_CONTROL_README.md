# OBS Control Module

This module provides integration with OBS Studio through the WebSocket API, allowing you to control scenes, streaming, recording, and sources directly from the League Stream Utils application.

## Features

- **Scene Management**: Switch between scenes, create new scenes, and remove existing scenes
- **Stream Control**: Start and stop streaming with a single click
- **Recording Control**: Start and stop recording sessions
- **Source Management**: View and control individual sources
- **Real-time Status**: Monitor streaming and recording status
- **Connection Management**: Easy connect/disconnect with configurable settings

## Prerequisites

1. **OBS Studio**: Make sure you have OBS Studio installed and running
2. **WebSocket Plugin**: Install the OBS WebSocket plugin (v5.0 or later)
3. **Desktop Application**: This feature is only available in the desktop Electron application

## Setup

### 1. Install OBS WebSocket Plugin

1. Download the OBS WebSocket plugin from the [official repository](https://github.com/obsproject/obs-websocket)
2. Install the plugin following the installation instructions
3. Restart OBS Studio

### 2. Configure OBS WebSocket

1. In OBS Studio, go to **Tools** > **WebSocket Server Settings**
2. Enable the WebSocket server
3. Set the port (default: 4455)
4. Optionally set a password for security
5. Click **OK** to save settings

### 3. Configure Environment Variables (Optional)

You can set the OBS connection details in your environment variables:

```bash
# .env file
OBS_PORT=4455
OBS_PASSWORD=your-obs-websocket-password
```

If not set, the application will use the default values:
- Host: localhost
- Port: 4455
- Password: (empty)

## Usage

### Accessing OBS Control

1. Open the League Stream Utils desktop application
2. Go to **Settings**
3. Click on the **OBS Control** tab

### Connecting to OBS

1. Enter your OBS WebSocket connection details:
   - **Host**: Usually `localhost` (default)
   - **Port**: The port configured in OBS WebSocket settings (default: 4455)
   - **Password**: The password set in OBS WebSocket settings (optional)
2. Click **Connect to OBS**
3. The status indicator will show "Connected" when successful

### Scene Control

Once connected, you can:

- **View Current Scene**: The current active scene is displayed at the top
- **Switch Scenes**: Click on any scene in the list to switch to it
- **Scene List**: All available scenes are displayed with their names and indices

### Stream & Recording Control

- **Start/Stop Streaming**: Use the streaming controls to start or stop your stream
- **Start/Stop Recording**: Use the recording controls to start or stop recording
- **Status Indicators**: Real-time status indicators show if streaming or recording is active

### Source Management

- **View Sources**: All sources in your current scene are listed with their types
- **Source Information**: Each source shows its name and type (e.g., "Game Capture", "Display Capture")

## API Reference

The OBS control module exposes the following methods through the Electron API:

### Connection Management

```typescript
// Connect to OBS
obsConnect(config: { host?: string; port?: number; password?: string })

// Disconnect from OBS
obsDisconnect()

// Get connection status
obsGetConnectionStatus()
```

### Scene Management

```typescript
// Get list of scenes
obsGetSceneList()

// Set current scene
obsSetCurrentScene(sceneName: string)

// Get current scene
obsGetCurrentScene()

// Create new scene
obsCreateScene(sceneName: string)

// Remove scene
obsRemoveScene(sceneName: string)
```

### Stream Control

```typescript
// Start streaming
obsStartStreaming()

// Stop streaming
obsStopStreaming()

// Get streaming status
obsGetStreamingStatus()
```

### Recording Control

```typescript
// Start recording
obsStartRecording()

// Stop recording
obsStopRecording()
```

### Source Management

```typescript
// Get list of sources
obsGetSourceList()

// Enable/disable source
obsSetSourceEnabled(sourceName: string, enabled: boolean)

// Get source enabled status
obsGetSourceEnabled(sourceName: string)
```

## Troubleshooting

### Connection Issues

1. **"Failed to connect to OBS"**
   - Ensure OBS Studio is running
   - Check that the WebSocket server is enabled in OBS
   - Verify the port number matches your OBS WebSocket settings
   - Check if a password is required and enter it correctly

2. **"Not connected to OBS"**
   - The connection may have been lost
   - Try reconnecting using the Connect button
   - Check if OBS is still running

### Scene Switching Issues

1. **Scene not switching**
   - Ensure you're connected to OBS
   - Check if the scene name exists in OBS
   - Verify you have the necessary permissions

### Streaming/Recording Issues

1. **Cannot start streaming/recording**
   - Check your OBS streaming/recording settings
   - Ensure you have proper stream keys or recording paths configured
   - Verify OBS has the necessary permissions

## Security Considerations

- **Password Protection**: Always use a password for the OBS WebSocket server in production environments
- **Network Access**: The WebSocket server should only be accessible from trusted devices
- **Firewall**: Ensure your firewall allows connections on the WebSocket port

## Development

The OBS control module consists of:

- **OBS Client** (`app/src/lib/services/obs/obs-client.ts`): TypeScript client for OBS WebSocket API
- **IPC Handler** (`app/electron/ipc-handlers/obs.js`): Electron main process handler
- **React Component** (`app/src/lib/components/electron/obs-control.tsx`): UI component for OBS control
- **Type Definitions** (`app/src/lib/types/electron.ts`): TypeScript definitions for the API

## Contributing

When adding new OBS features:

1. Add the method to the OBS client class
2. Add the corresponding IPC handler
3. Update the preload.js to expose the method
4. Add TypeScript definitions
5. Update the UI component if needed
6. Update this documentation

## License

This module is part of the League Stream Utils project and follows the same license terms. 