# Running VML Nexus Cup in Electron

## Quick Start

```bash
cd app
npm run electron-dev
```

This will:
1. Start Next.js on port 3000 (forced)
2. Wait for the server to be ready
3. Launch Electron desktop app

## Troubleshooting

### If port 3000 is busy:
```bash
# Kill processes on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port manually
npm run dev -- --port 3001
# Then in another terminal:
PORT=3001 npm run electron
```

### Manual step-by-step:
```bash
# Terminal 1: Start Next.js
npm run dev

# Terminal 2: Start Electron (after Next.js is ready)
npm run electron
```

### Web-only development:
```bash
npm run dev
# Visit http://localhost:3000 in browser
```

## Desktop Features

When running in Electron, you get:
- **File Menu**: Tournament management shortcuts
- **Native dialogs**: Import/export tournaments and assets
- **Local storage**: Persistent cache and settings
- **System integration**: Notifications and desktop features
- **OBS integration**: WebSocket control for streaming

## Verification

Look for these signs that Electron is working:
1. **Desktop window** opens (not just browser)
2. **Menu bar** with Tournament, Champions, Tools, View menus
3. **Settings page** shows "Desktop App" badge
4. **DevTools** can be toggled with Ctrl+Shift+I
5. **Console log**: "Loading Electron app from: http://localhost:3000"

## Production Build

```bash
npm run dist
```

Creates installers in `dist/` folder:
- Windows: `.exe` installer
- macOS: `.dmg` disk image  
- Linux: `.AppImage` file 