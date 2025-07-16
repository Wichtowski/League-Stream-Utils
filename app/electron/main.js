const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const isDev = process.env.NODE_ENV === 'development';

// Set environment variable for Next.js to use user data directory
process.env.USE_USER_DATA = 'true';

// Keep a global reference of the window object
let mainWindow;
let nextProcess;

// LCU Data state for overlay communication
let lcuData = {
    isConnected: false,
    isConnecting: false,
    champSelectSession: null,
    connectionError: null
};

let useMockData = false;

// Simple HTTP server for web overlay data
let dataServer;

// Tournament data storage paths
const userDataPath = app.getPath('userData');
const tournamentsPath = path.join(userDataPath, 'tournaments');
const championsPath = path.join(userDataPath, 'champions');
const assetsPath = path.join(userDataPath, 'assets');
const uploadsPath = path.join(userDataPath, 'uploads', 'cameras');
const assetCachePath = path.join(userDataPath, 'assets');

// Ensure directories exist
[tournamentsPath, championsPath, assetsPath, uploadsPath, assetCachePath].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

function createWindow() {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 700,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, '../public/favicon.ico'),
        titleBarStyle: 'default',
        show: false // Don't show until ready
    });

    // Load the Next.js app
    const port = process.env.PORT || 2137;

    // If running on Windows and connecting to WSL, use the WSL network IP
    let hostname = 'localhost';
    if (process.platform === 'win32' && process.env.WSL_HOST) {
        hostname = process.env.WSL_HOST;
    }

    // Always use development server in development mode
    const appUrl = `http://${hostname}:${port}/download/assets`;

    console.log(`Loading Electron app from: ${appUrl}`);
    console.log('Development mode: loading from Next.js development server');
    mainWindow.loadURL(appUrl);

    // Show window when ready to prevent visual flash
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();

        if (isDev) {
            mainWindow.webContents.openDevTools();
        }
    });

    // Add error handling for page load
    mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
        console.error('Failed to load page:', errorCode, errorDescription, validatedURL);
    });

    // Add console logging from renderer
    mainWindow.webContents.on('console-message', (_event, level, message) => {
        console.log(`Renderer [${level}]:`, message);
    });

    // Handle window closed
    mainWindow.on('closed', () => {
        mainWindow = null;
        if (nextProcess && !nextProcess.killed) {
            nextProcess.kill();
        }
    });

    // Handle external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });
}

// Tournament Management Menu
function createMenu() {
    const template = [
        {
            label: 'Tournament',
            submenu: [
                {
                    label: 'New Tournament',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        mainWindow.webContents.send('create-tournament');
                    }
                },
                {
                    label: 'Open Tournament',
                    accelerator: 'CmdOrCtrl+O',
                    click: async () => {
                        const result = await dialog.showOpenDialog(mainWindow, {
                            properties: ['openFile'],
                            filters: [
                                { name: 'Tournament Files', extensions: ['json'] }
                            ],
                            defaultPath: tournamentsPath
                        });

                        if (!result.canceled && result.filePaths.length > 0) {
                            const tournamentData = JSON.parse(fs.readFileSync(result.filePaths[0], 'utf8'));
                            mainWindow.webContents.send('load-tournament', tournamentData);
                        }
                    }
                },
                {
                    label: 'Save Tournament',
                    accelerator: 'CmdOrCtrl+S',
                    click: () => {
                        mainWindow.webContents.send('save-tournament');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Import Team Logos',
                    click: async () => {
                        const result = await dialog.showOpenDialog(mainWindow, {
                            properties: ['openFile', 'multiSelections'],
                            filters: [
                                { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }
                            ]
                        });

                        if (!result.canceled && result.filePaths.length > 0) {
                            mainWindow.webContents.send('import-logos', result.filePaths);
                        }
                    }
                },
                {
                    label: 'Export Tournament Data',
                    click: async () => {
                        const result = await dialog.showSaveDialog(mainWindow, {
                            filters: [
                                { name: 'JSON Files', extensions: ['json'] },
                                { name: 'PDF Files', extensions: ['pdf'] }
                            ],
                            defaultPath: path.join(tournamentsPath, 'tournament-export')
                        });

                        if (!result.canceled) {
                            mainWindow.webContents.send('export-tournament', result.filePath);
                        }
                    }
                }
            ]
        },
        {
            label: 'Champions',
            submenu: [
                {
                    label: 'Update Champions Database',
                    click: () => {
                        mainWindow.webContents.send('update-champions');
                    }
                },
                {
                    label: 'Clear Champions Cache',
                    click: async () => {
                        const response = await dialog.showMessageBox(mainWindow, {
                            type: 'warning',
                            buttons: ['Cancel', 'Clear Cache'],
                            defaultId: 0,
                            message: 'Clear Champions Cache?',
                            detail: 'This will remove all cached champion data and require re-downloading from Riot API.'
                        });

                        if (response.response === 1) {
                            // Clear champions cache
                            const championsFiles = fs.readdirSync(championsPath);
                            championsFiles.forEach(file => {
                                fs.unlinkSync(path.join(championsPath, file));
                            });
                            mainWindow.webContents.send('champions-cache-cleared');
                        }
                    }
                }
            ]
        },
        {
            label: 'Tools',
            submenu: [
                {
                    label: 'OBS Scene Control',
                    enabled: false, // Will be enabled when OBS WebSocket is connected
                    click: () => {
                        mainWindow.webContents.send('open-obs-control');
                    }
                },
                {
                    label: 'Stream Overlay',
                    click: () => {
                        // Create a new window for stream overlay
                        const overlayWindow = new BrowserWindow({
                            width: 1920,
                            height: 1080,
                            frame: false,
                            transparent: true,
                            alwaysOnTop: true,
                            webPreferences: {
                                nodeIntegration: false,
                                contextIsolation: true
                            }
                        });
                        overlayWindow.loadURL(`${appUrl}/overlay`);
                    }
                },
                { type: 'separator' },
                {
                    label: 'Settings',
                    accelerator: 'CmdOrCtrl+,',
                    click: () => {
                        mainWindow.webContents.send('open-settings');
                    }
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                {
                    label: 'Reload',
                    accelerator: 'CmdOrCtrl+R',
                    click: () => {
                        mainWindow.reload();
                    }
                },
                {
                    label: 'Force Reload',
                    accelerator: 'CmdOrCtrl+Shift+R',
                    click: () => {
                        mainWindow.webContents.reloadIgnoringCache();
                    }
                },
                {
                    label: 'Toggle Developer Tools',
                    accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
                    click: () => {
                        mainWindow.webContents.toggleDevTools();
                    }
                },
                { type: 'separator' },
                {
                    label: 'Actual Size',
                    accelerator: 'CmdOrCtrl+0',
                    click: () => {
                        mainWindow.webContents.setZoomLevel(0);
                    }
                },
                {
                    label: 'Zoom In',
                    accelerator: 'CmdOrCtrl+Plus',
                    click: () => {
                        const currentZoom = mainWindow.webContents.getZoomLevel();
                        mainWindow.webContents.setZoomLevel(currentZoom + 1);
                    }
                },
                {
                    label: 'Zoom Out',
                    accelerator: 'CmdOrCtrl+-',
                    click: () => {
                        const currentZoom = mainWindow.webContents.getZoomLevel();
                        mainWindow.webContents.setZoomLevel(currentZoom - 1);
                    }
                }
            ]
        }
    ];

    // macOS specific menu adjustments
    if (process.platform === 'darwin') {
        template.unshift({
            label: app.getName(),
            submenu: [
                {
                    label: 'About ' + app.getName(),
                    role: 'about'
                },
                { type: 'separator' },
                {
                    label: 'Preferences',
                    accelerator: 'Cmd+,',
                    click: () => {
                        mainWindow.webContents.send('open-settings');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Hide ' + app.getName(),
                    accelerator: 'Cmd+H',
                    role: 'hide'
                },
                {
                    label: 'Hide Others',
                    accelerator: 'Cmd+Shift+H',
                    role: 'hideothers'
                },
                {
                    label: 'Show All',
                    role: 'unhide'
                },
                { type: 'separator' },
                {
                    label: 'Quit',
                    accelerator: 'Cmd+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        });
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// IPC Handlers for file operations
ipcMain.handle('save-tournament-file', async (event, tournamentData) => {
    try {
        const result = await dialog.showSaveDialog(mainWindow, {
            filters: [{ name: 'Tournament Files', extensions: ['json'] }],
            defaultPath: path.join(tournamentsPath, `${tournamentData.name || 'tournament'}.json`)
        });

        if (!result.canceled) {
            fs.writeFileSync(result.filePath, JSON.stringify(tournamentData, null, 2));
            return { success: true, filePath: result.filePath };
        }
        return { success: false, cancelled: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('save-champions-cache', async (event, championsData) => {
    try {
        const filePath = path.join(championsPath, 'champions.json');
        fs.writeFileSync(filePath, JSON.stringify(championsData, null, 2));
        return { success: true, filePath };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('load-champions-cache', async () => {
    try {
        const filePath = path.join(championsPath, 'champions.json');
        if (fs.existsSync(filePath)) {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            return { success: true, data };
        }
        return { success: false, error: 'No cache file found' };
    } catch (error) {
        return { success: false, error: error.message };
    }
});


// Enhanced champion caching system IPC handlers
ipcMain.handle('get-champion-cache-path', async () => {
    try {
        const championCachePath = path.join(userDataPath, 'champions');
        if (!fs.existsSync(championCachePath)) {
            fs.mkdirSync(championCachePath, { recursive: true });
        }
        return { success: true, cachePath: championCachePath };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Check if file exists
ipcMain.handle('check-file-exists', async (event, filePath) => {
    try {
        const exists = fs.existsSync(filePath);
        return { success: true, exists };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('load-champion-data', async (event, filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            return { success: true, data };
        }
        return { success: false, error: 'File not found' };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('save-champion-data', async (event, filePath, data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('create-champion-directory', async (event, dirPath) => {
    try {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('download-champion-image', async (event, url, localPath) => {
    try {
        const https = require('https');

        // Check if file already exists
        if (fs.existsSync(localPath)) {
            return { success: true, localPath };
        }

        // Download the file
        return new Promise((resolve) => {
            const file = fs.createWriteStream(localPath);
            https.get(url, (response) => {
                if (response.statusCode === 200) {
                    response.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        resolve({ success: true, localPath });
                    });
                } else {
                    file.close();
                    fs.unlinkSync(localPath);
                    resolve({ success: false, error: `HTTP ${response.statusCode}` });
                }
            }).on('error', (err) => {
                file.close();
                if (fs.existsSync(localPath)) {
                    fs.unlinkSync(localPath);
                }
                resolve({ success: false, error: err.message });
            });
        });
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('clear-champion-cache', async (event, cacheDir) => {
    try {
        if (fs.existsSync(cacheDir)) {
            fs.rmSync(cacheDir, { recursive: true, force: true });
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-champion-cache-stats', async (event, cacheDir) => {
    try {
        if (!fs.existsSync(cacheDir)) {
            return { success: true, totalChampions: 0, cacheSize: 0 };
        }

        let totalChampions = 0;
        let cacheSize = 0;

        function calculateStats(dirPath) {
            const items = fs.readdirSync(dirPath);
            for (const item of items) {
                const itemPath = path.join(dirPath, item);
                const stat = fs.statSync(itemPath);

                if (stat.isDirectory()) {
                    if (item === 'champions') {
                        // Count champion directories
                        const championDirs = fs.readdirSync(itemPath);
                        totalChampions += championDirs.length;
                    }
                    calculateStats(itemPath);
                } else {
                    cacheSize += stat.size;
                }
            }
        }

        calculateStats(cacheDir);

        return {
            success: true,
            totalChampions,
            cacheSize: formatBytes(cacheSize)
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('copy-asset-file', async (event, sourcePath, fileName) => {
    try {
        const destPath = path.join(assetsPath, fileName);

        // Create the directory structure if it doesn't exist
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }

        // Handle the source path - it should be relative to the app directory
        let fullSourcePath = sourcePath;
        if (!path.isAbsolute(sourcePath)) {
            // If it's a relative path, resolve it relative to the app directory
            fullSourcePath = path.join(__dirname, '..', sourcePath);
        }

        fs.copyFileSync(fullSourcePath, destPath);
        return { success: true, localPath: destPath };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('save-camera-upload', async (event, fileBuffer, fileName) => {
    try {
        const camerasPath = path.join(assetsPath, 'cameras');

        // Ensure cameras directory exists
        if (!fs.existsSync(camerasPath)) {
            fs.mkdirSync(camerasPath, { recursive: true });
        }

        const destPath = path.join(camerasPath, fileName);
        fs.writeFileSync(destPath, fileBuffer);

        return { success: true, localPath: destPath, publicPath: `file://${destPath}` };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Get user data path using Electron's built-in method
ipcMain.handle('get-user-data-path', async () => {
    try {
        return app.getPath('userData');
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// LCU Data IPC handlers for overlay communication
ipcMain.handle('get-lcu-data', async () => {
    return {
        ...lcuData,
        useMockData
    };
});

// Function to broadcast LCU data updates to all windows
function broadcastLCUDataUpdate() {
    if (mainWindow) {
        mainWindow.webContents.send('lcu-data-update', lcuData);
    }
    // Also send to any overlay windows
    BrowserWindow.getAllWindows().forEach(window => {
        if (window !== mainWindow) {
            window.webContents.send('lcu-data-update', lcuData);
        }
    });
}

// Function to broadcast mock data toggle
function broadcastMockDataToggle() {
    if (mainWindow) {
        mainWindow.webContents.send('mock-data-toggle', useMockData);
    }
    // Also send to any overlay windows
    BrowserWindow.getAllWindows().forEach(window => {
        if (window !== mainWindow) {
            window.webContents.send('mock-data-toggle', useMockData);
        }
    });
}

// IPC handlers for LCU data updates from renderer
ipcMain.handle('update-lcu-data', async (event, data) => {
    lcuData = { ...lcuData, ...data };
    broadcastLCUDataUpdate();
    return { success: true };
});

ipcMain.handle('set-mock-data', async (event, enabled) => {
    useMockData = enabled;
    broadcastMockDataToggle();
    return { success: true };
});

// Create HTTP server for overlay data
function createDataServer() {
    dataServer = http.createServer((req, res) => {
        // Enable CORS for web overlay
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        if (req.url === '/api/lcu-data' && req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                ...lcuData,
                useMockData
            }));
            return;
        }

        res.writeHead(404);
        res.end('Not Found');
    });

    // Start server on port 2138 (different from Next.js port 2137)
    dataServer.listen(2138, () => {
        console.log('Electron data server running on port 2138');
    });
}

// Asset caching IPC handlers with enhanced performance
ipcMain.handle('download-asset', async (event, url, category, assetKey) => {
    try {
        const https = require('https');
        const categoryPath = path.join(assetCachePath, category);

        // Ensure category directory exists
        if (!fs.existsSync(categoryPath)) {
            fs.mkdirSync(categoryPath, { recursive: true });
        }

        // Handle nested paths in assetKey (e.g., "game/15.13.1/champions/Aatrox/Aatrox.png")
        const assetKeyParts = assetKey.split('/');
        const fileName = assetKeyParts.pop(); // Get the filename
        const subDirectories = assetKeyParts; // Get the subdirectories

        // Create the full directory path
        let fullDirectoryPath = categoryPath;
        if (subDirectories.length > 0) {
            fullDirectoryPath = path.join(categoryPath, ...subDirectories);
            if (!fs.existsSync(fullDirectoryPath)) {
                fs.mkdirSync(fullDirectoryPath, { recursive: true });
            }
        }

        // Determine the file extension from the URL
        const urlExtension = url.split('.').pop();
        const fileNameWithExtension = fileName.includes('.') ? fileName : `${fileName}.${urlExtension}`;
        const localPath = path.join(fullDirectoryPath, fileNameWithExtension);

        // Check if file already exists
        if (fs.existsSync(localPath)) {
            return { success: true, localPath };
        }

        // Enhanced download with better error handling and performance
        return new Promise((resolve) => {
            const file = fs.createWriteStream(localPath);
            let downloadedBytes = 0;
            const startTime = Date.now();

            const request = https.get(url, {
                timeout: 30000, // 30 second timeout
                headers: {
                    'User-Agent': 'League-Stream-Utils/1.0',
                    'Accept': '*/*',
                    'Accept-Encoding': 'gzip, deflate, br'
                }
            }, (response) => {
                if (response.statusCode === 200) {
                    response.on('data', (chunk) => {
                        downloadedBytes += chunk.length;
                    });

                    response.pipe(file);

                    file.on('finish', async () => {
                        file.close();
                        const downloadTime = (Date.now() - startTime) / 1000;
                        const downloadSpeed = downloadedBytes / downloadTime;

                        // Update the asset manifest with version-aware paths
                        try {
                            // Extract version from assetKey (e.g., "game/15.14.1/champions/...")
                            let version = null;
                            let category = 'default';

                            // Check for versioned assets - ALL assets must be versioned now
                            const versionMatch = assetKey.match(/game\/([^\/]+)\//);
                            if (versionMatch) {
                                version = versionMatch[1]; // Extract version like "15.14.1"
                            } else {
                                // Skip manifest update for non-versioned assets
                                console.log(`Skipping manifest update for non-versioned asset: ${assetKey}`);
                                resolve({
                                    success: true,
                                    localPath,
                                    size: downloadedBytes,
                                    downloadSpeed: downloadSpeed,
                                    downloadTime: downloadTime
                                });
                                return;
                            }

                            // Determine category and manifest file
                            if (assetKey.includes('/champions/') || assetKey.includes('champion')) {
                                category = 'champions';
                            } else if (assetKey.includes('/items/') || assetKey.includes('item')) {
                                category = 'items';
                            } else if (assetKey.includes('/runes/') || assetKey.includes('rune')) {
                                category = 'runes';
                            } else if (assetKey.includes('/overlay/') || assetKey.includes('game-ui')) {
                                category = 'game-ui';
                            } else if (assetKey.includes('/spells/') || assetKey.includes('spell')) {
                                category = 'spells';
                            }

                            // Build version-aware manifest path: cache/game/{version}/{category}-manifest.json
                            const manifestFile = `${category}-manifest.json`;
                            const manifestDir = path.join(assetCachePath, 'cache', 'game', version);

                            // Ensure manifest directory exists
                            if (!fs.existsSync(manifestDir)) {
                                fs.mkdirSync(manifestDir, { recursive: true });
                            }

                            const manifestPath = path.join(manifestDir, manifestFile);
                            let manifest = {};

                            if (fs.existsSync(manifestPath)) {
                                manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
                            }

                            // Get file stats
                            const stats = fs.statSync(localPath);

                            // Add to manifest with performance metrics
                            manifest[assetKey] = {
                                path: localPath,
                                url: url,
                                size: stats.size,
                                timestamp: Date.now(),
                                checksum: assetKey,
                                downloadSpeed: downloadSpeed,
                                downloadTime: downloadTime
                            };

                            // Save updated manifest
                            fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
                        } catch (manifestError) {
                            console.error('Failed to update asset manifest:', manifestError);
                        }

                        resolve({
                            success: true,
                            localPath,
                            size: downloadedBytes,
                            downloadSpeed: downloadSpeed,
                            downloadTime: downloadTime
                        });
                    });
                } else {
                    file.close();
                    if (fs.existsSync(localPath)) {
                        fs.unlinkSync(localPath);
                    }
                    resolve({
                        success: false,
                        error: `HTTP ${response.statusCode}`,
                        statusCode: response.statusCode
                    });
                }
            });

            request.on('error', (err) => {
                file.close();
                if (fs.existsSync(localPath)) {
                    fs.unlinkSync(localPath);
                }
                resolve({
                    success: false,
                    error: err.message,
                    code: err.code
                });
            });

            request.on('timeout', () => {
                request.destroy();
                file.close();
                if (fs.existsSync(localPath)) {
                    fs.unlinkSync(localPath);
                }
                resolve({
                    success: false,
                    error: 'Request timeout',
                    code: 'TIMEOUT'
                });
            });
        });
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// New IPC handler for parallel downloads with enhanced performance
ipcMain.handle('download-assets-parallel', async (event, downloadTasks) => {
    try {
        const https = require('https');
        const maxConcurrent = 25; // Increased from 10 to 25 concurrent downloads
        const semaphore = new Array(maxConcurrent).fill(null);

        const downloadTask = async (task) => {
            const { url, category, assetKey } = task;
            const categoryPath = path.join(assetCachePath, category);

            // Ensure category directory exists
            if (!fs.existsSync(categoryPath)) {
                fs.mkdirSync(categoryPath, { recursive: true });
            }

            // Handle nested paths
            const assetKeyParts = assetKey.split('/');
            const fileName = assetKeyParts.pop();
            const subDirectories = assetKeyParts;

            let fullDirectoryPath = categoryPath;
            if (subDirectories.length > 0) {
                fullDirectoryPath = path.join(categoryPath, ...subDirectories);
                if (!fs.existsSync(fullDirectoryPath)) {
                    fs.mkdirSync(fullDirectoryPath, { recursive: true });
                }
            }

            const urlExtension = url.split('.').pop();
            const fileNameWithExtension = fileName.includes('.') ? fileName : `${fileName}.${urlExtension}`;
            const localPath = path.join(fullDirectoryPath, fileNameWithExtension);

            // Check if file already exists
            if (fs.existsSync(localPath)) {
                return {
                    id: task.id,
                    success: true,
                    localPath,
                    cached: true
                };
            }

            // Download with enhanced performance and connection pooling
            return new Promise((resolve) => {
                const file = fs.createWriteStream(localPath);
                let downloadedBytes = 0;
                const startTime = Date.now();

                // Enhanced request options for better performance
                const requestOptions = {
                    timeout: 15000, // Reduced timeout for faster failure detection
                    headers: {
                        'User-Agent': 'League-Stream-Utils/1.0',
                        'Accept': '*/*',
                        'Accept-Encoding': 'gzip, deflate, br',
                        'Connection': 'keep-alive', // Enable connection reuse
                        'Keep-Alive': 'timeout=5, max=1000'
                    },
                    agent: new https.Agent({
                        keepAlive: true,
                        keepAliveMsecs: 1000,
                        maxSockets: 50,
                        maxFreeSockets: 10
                    })
                };

                const request = https.get(url, requestOptions, (response) => {
                    if (response.statusCode === 200) {
                        response.on('data', (chunk) => {
                            downloadedBytes += chunk.length;
                        });

                        response.pipe(file);

                        file.on('finish', async () => {
                            file.close();
                            const downloadTime = (Date.now() - startTime) / 1000;
                            const downloadSpeed = downloadedBytes / downloadTime;

                            // Update manifest with version-aware paths
                            try {
                                // Extract version from assetKey (e.g., "game/15.14.1/champions/...")
                                let version = null;
                                let category = 'default';

                                // Check for versioned assets - ALL assets must be versioned now
                                const versionMatch = assetKey.match(/game\/([^\/]+)\//);
                                if (versionMatch) {
                                    version = versionMatch[1]; // Extract version like "15.14.1"
                                } else {
                                    // Skip manifest update for non-versioned assets
                                    console.log(`Skipping manifest update for non-versioned asset: ${assetKey}`);
                                    resolve({
                                        id: task.id,
                                        success: true,
                                        localPath,
                                        size: downloadedBytes,
                                        downloadSpeed: downloadSpeed,
                                        downloadTime: downloadTime
                                    });
                                    return;
                                }

                                // Determine category and manifest file
                                if (assetKey.includes('/champions/') || assetKey.includes('champion')) {
                                    category = 'champions';
                                } else if (assetKey.includes('/items/') || assetKey.includes('item')) {
                                    category = 'items';
                                } else if (assetKey.includes('/runes/') || assetKey.includes('rune')) {
                                    category = 'runes';
                                } else if (assetKey.includes('/overlay/') || assetKey.includes('game-ui')) {
                                    category = 'game-ui';
                                } else if (assetKey.includes('/spells/') || assetKey.includes('spell')) {
                                    category = 'spells';
                                }

                                // Build version-aware manifest path: cache/game/{version}/{category}-manifest.json
                                const manifestFile = `${category}-manifest.json`;
                                const manifestDir = path.join(assetCachePath, 'cache', 'game', version);

                                // Ensure manifest directory exists
                                if (!fs.existsSync(manifestDir)) {
                                    fs.mkdirSync(manifestDir, { recursive: true });
                                }

                                const manifestPath = path.join(manifestDir, manifestFile);
                                let manifest = {};

                                if (fs.existsSync(manifestPath)) {
                                    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
                                }

                                const stats = fs.statSync(localPath);
                                manifest[assetKey] = {
                                    path: localPath,
                                    url: url,
                                    size: stats.size,
                                    timestamp: Date.now(),
                                    checksum: assetKey,
                                    downloadSpeed: downloadSpeed,
                                    downloadTime: downloadTime
                                };

                                fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
                            } catch (manifestError) {
                                console.error('Failed to update asset manifest:', manifestError);
                            }

                            resolve({
                                id: task.id,
                                success: true,
                                localPath,
                                size: downloadedBytes,
                                downloadSpeed: downloadSpeed,
                                downloadTime: downloadTime
                            });
                        });
                    } else {
                        file.close();
                        if (fs.existsSync(localPath)) {
                            fs.unlinkSync(localPath);
                        }
                        resolve({
                            id: task.id,
                            success: false,
                            error: `HTTP ${response.statusCode}`,
                            statusCode: response.statusCode
                        });
                    }
                });

                request.on('error', (err) => {
                    file.close();
                    if (fs.existsSync(localPath)) {
                        fs.unlinkSync(localPath);
                    }
                    resolve({
                        id: task.id,
                        success: false,
                        error: err.message,
                        code: err.code
                    });
                });

                request.on('timeout', () => {
                    request.destroy();
                    file.close();
                    if (fs.existsSync(localPath)) {
                        fs.unlinkSync(localPath);
                    }
                    resolve({
                        id: task.id,
                        success: false,
                        error: 'Request timeout',
                        code: 'TIMEOUT'
                    });
                });
            });
        };

        // Process downloads with concurrency control
        const processDownloads = async () => {
            const promises = [];

            for (let i = 0; i < downloadTasks.length; i++) {
                const task = downloadTasks[i];

                const promise = new Promise(async (resolve) => {
                    // Wait for available slot
                    while (semaphore.every(slot => slot !== null)) {
                        await new Promise(r => setTimeout(r, 10));
                    }

                    // Find available slot
                    const slotIndex = semaphore.findIndex(slot => slot === null);
                    semaphore[slotIndex] = task.id;

                    try {
                        const result = await downloadTask(task);
                        resolve(result);
                    } finally {
                        semaphore[slotIndex] = null;
                    }
                });

                promises.push(promise);
            }

            return Promise.all(promises);
        };

        const results = await processDownloads();
        return { success: true, results };

    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Add new IPC handler for loading specific category manifest
ipcMain.handle('load-category-manifest', async (event, category) => {
    try {
        // The category parameter now includes the full path (e.g., "15.14.1/champions" or just "champions")
        const manifestFile = `${category}-manifest.json`;
        const manifestPath = path.join(assetCachePath, manifestFile);

        // Ensure the directory exists for versioned manifests
        const manifestDir = path.dirname(manifestPath);
        if (!fs.existsSync(manifestDir)) {
            fs.mkdirSync(manifestDir, { recursive: true });
        }

        if (fs.existsSync(manifestPath)) {
            const data = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            return { success: true, data };
        }

        return { success: true, data: {} };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Add new IPC handler for saving specific category manifest
ipcMain.handle('save-category-manifest', async (event, category, manifestData) => {
    try {
        // The manifestData now contains the full path as the key (e.g., "15.14.1/champions-manifest.json")
        // Extract the actual manifest file path from the keys
        const manifestKeys = Object.keys(manifestData);
        if (manifestKeys.length === 0) {
            return { success: true }; // Nothing to save
        }

        // Use the first key as the manifest file path (there should only be one)
        const manifestFile = manifestKeys[0];
        const manifestPath = path.join(assetCachePath, manifestFile);

        // Ensure the directory exists for versioned manifests
        const manifestDir = path.dirname(manifestPath);
        if (!fs.existsSync(manifestDir)) {
            fs.mkdirSync(manifestDir, { recursive: true });
        }

        // The actual data is in the manifestData[manifestFile].path
        const newData = JSON.parse(manifestData[manifestFile].path);

        // Save the updated manifest (replace entirely since it's a complete manifest)
        fs.writeFileSync(manifestPath, JSON.stringify(newData, null, 2));

        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-file-size', async (event, filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            return { success: true, size: stats.size };
        }
        return { success: false, error: 'File not found' };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('remove-asset', async (event, filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return { success: true };
        }
        return { success: false, error: 'File not found' };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('clear-asset-cache', async () => {
    try {
        if (fs.existsSync(assetCachePath)) {
            fs.rmSync(assetCachePath, { recursive: true, force: true });
            fs.mkdirSync(assetCachePath, { recursive: true });
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-asset-cache-stats', async () => {
    try {
        if (!fs.existsSync(assetCachePath)) {
            return { success: true, stats: { totalSize: 0, fileCount: 0 } };
        }

        let totalSize = 0;
        let fileCount = 0;

        function calculateSize(dirPath) {
            const items = fs.readdirSync(dirPath);
            for (const item of items) {
                const itemPath = path.join(dirPath, item);
                const stats = fs.statSync(itemPath);
                if (stats.isDirectory()) {
                    calculateSize(itemPath);
                } else {
                    totalSize += stats.size;
                    fileCount++;
                }
            }
        }

        calculateSize(assetCachePath);

        return {
            success: true,
            stats: {
                totalSize,
                fileCount,
                formattedSize: formatBytes(totalSize)
            }
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('check-asset-integrity', async () => {
    try {
        const manifestPath = path.join(assetCachePath, 'manifest.json');
        let manifest = {};
        let missingFiles = [];
        let corruptedFiles = [];
        let validFiles = 0;
        let totalFiles = 0;

        // Load manifest if it exists
        if (fs.existsSync(manifestPath)) {
            manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        }

        // Check each file in the manifest
        for (const [assetKey, assetData] of Object.entries(manifest)) {
            totalFiles++;
            const filePath = assetData.path;

            if (!fs.existsSync(filePath)) {
                missingFiles.push(assetKey);
                continue;
            }

            try {
                const stats = fs.statSync(filePath);

                // Check if file size matches expected size
                if (stats.size !== assetData.size) {
                    corruptedFiles.push(assetKey);
                    continue;
                }

                // Check if file is readable (basic integrity check)
                const fileBuffer = fs.readFileSync(filePath);
                if (fileBuffer.length === 0) {
                    corruptedFiles.push(assetKey);
                    continue;
                }

                validFiles++;
            } catch (_error) {
                corruptedFiles.push(assetKey);
            }
        }

        // Check for orphaned files (files in cache but not in manifest)
        if (fs.existsSync(assetCachePath)) {
            function scanForOrphanedFiles(dirPath, relativePath = '') {
                const items = fs.readdirSync(dirPath);
                for (const item of items) {
                    const itemPath = path.join(dirPath, item);
                    const stats = fs.statSync(itemPath);

                    if (stats.isDirectory()) {
                        scanForOrphanedFiles(itemPath, path.join(relativePath, item));
                    } else {
                        const assetKey = path.join(relativePath, item);
                        if (!manifest[assetKey]) {
                            // This is an orphaned file, but we'll count it as valid for now
                            totalFiles++;
                            validFiles++;
                        }
                    }
                }
            }

            scanForOrphanedFiles(assetCachePath);
        }

        const isValid = missingFiles.length === 0 && corruptedFiles.length === 0;
        const message = isValid
            ? `All ${totalFiles} files are valid and accessible.`
            : `Found ${missingFiles.length} missing files and ${corruptedFiles.length} corrupted files.`;

        return {
            success: true,
            integrity: {
                isValid,
                missingFiles,
                corruptedFiles,
                totalFiles,
                validFiles,
                message
            }
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('scan-and-update-manifest', async () => {
    try {
        const manifestPath = path.join(assetCachePath, 'manifest.json');
        let manifest = {};

        if (fs.existsSync(manifestPath)) {
            manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        }

        let updatedCount = 0;

        function scanDirectory(dirPath, relativePath = '') {
            if (!fs.existsSync(dirPath)) return;

            const items = fs.readdirSync(dirPath);
            for (const item of items) {
                const itemPath = path.join(dirPath, item);
                const stats = fs.statSync(itemPath);

                if (stats.isDirectory()) {
                    scanDirectory(itemPath, path.join(relativePath, item));
                } else {
                    // This is a file
                    const assetKey = path.join(relativePath, item);

                    // Only add if not already in manifest
                    if (!manifest[assetKey]) {
                        manifest[assetKey] = {
                            path: itemPath,
                            url: '', // We don't have the original URL
                            size: stats.size,
                            timestamp: stats.mtime.getTime(),
                            checksum: assetKey
                        };
                        updatedCount++;
                    }
                }
            }
        }

        // Scan the cache directory
        scanDirectory(assetCachePath);

        // Save updated manifest
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

        return { success: true, updatedCount };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Utility function to format bytes
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// App event handlers
app.whenReady().then(() => {
    createWindow();
    createMenu();
    createDataServer();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        if (dataServer) {
            dataServer.close();
        }
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.on('before-quit', () => {
    if (dataServer) {
        dataServer.close();
    }
});

// Start Next.js in development
if (isDev) {
    app.whenReady().then(() => {
        // Next.js should already be running via npm run dev
        console.log('Development mode: assuming Next.js is running on port 2137');
    });
} 