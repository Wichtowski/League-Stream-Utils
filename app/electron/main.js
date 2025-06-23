const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development';

// Set environment variable for Next.js to use user data directory
process.env.USE_USER_DATA = 'true';

// Keep a global reference of the window object
let mainWindow;
let nextProcess;

// Tournament data storage paths
const userDataPath = app.getPath('userData');
const tournamentsPath = path.join(userDataPath, 'tournaments');
const championsPath = path.join(userDataPath, 'champions');
const assetsPath = path.join(userDataPath, 'assets');
const uploadsPath = path.join(userDataPath, 'uploads', 'cameras');

// Ensure directories exist
[tournamentsPath, championsPath, assetsPath, uploadsPath].forEach(dir => {
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
    const port = process.env.PORT || 3000;

    // If running on Windows and connecting to WSL, use the WSL network IP
    let hostname = 'localhost';
    if (process.platform === 'win32' && process.env.WSL_HOST) {
        hostname = process.env.WSL_HOST;
    }

    const appUrl = isDev ? `http://${hostname}:${port}/modules` : `file://${path.join(__dirname, '../out/modules.html')}`;

    console.log(`Loading Electron app from: ${appUrl}`);
    if (isDev) {
        console.log('Development mode: assuming Next.js is running on port', port);
    }
    mainWindow.loadURL(appUrl);

    // Show window when ready to prevent visual flash
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();

        if (isDev) {
            mainWindow.webContents.openDevTools();
        }
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

ipcMain.handle('copy-asset-file', async (event, sourcePath, fileName) => {
    try {
        const destPath = path.join(assetsPath, fileName);
        fs.copyFileSync(sourcePath, destPath);
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

ipcMain.handle('get-user-data-path', async () => {
    return userDataPath;
});

// App event handlers
app.whenReady().then(() => {
    createWindow();
    createMenu();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Start Next.js in development
if (isDev) {
    app.whenReady().then(() => {
        // Next.js should already be running via npm run dev
        console.log('Development mode: assuming Next.js is running on port 3000');
    });
} 