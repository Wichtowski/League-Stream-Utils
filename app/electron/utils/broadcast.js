import { BrowserWindow } from 'electron';

// Function to broadcast LCU data updates to all windows
function broadcastLCUDataUpdate(mainWindow, lcuData) {
    if (mainWindow) {
        mainWindow.webContents.send('lcu-data-update', lcuData);
    }
    // Also send to any overlay windows
    BrowserWindow.getAllWindows().forEach((window) => {
        if (window !== mainWindow) {
            window.webContents.send('lcu-data-update', lcuData);
        }
    });
}

// Function to broadcast mock data toggle
function broadcastMockDataToggle(mainWindow, useMockData) {
    if (mainWindow) {
        mainWindow.webContents.send('mock-data-toggle', useMockData);
    }
    // Also send to any overlay windows
    BrowserWindow.getAllWindows().forEach((window) => {
        if (window !== mainWindow) {
            window.webContents.send('mock-data-toggle', useMockData);
        }
    });
}

export { broadcastLCUDataUpdate, broadcastMockDataToggle };
