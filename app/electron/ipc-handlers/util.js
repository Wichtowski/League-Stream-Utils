/* eslint-disable @typescript-eslint/no-require-imports */
const { ipcMain, app } = require('electron');
/* eslint-enable @typescript-eslint/no-require-imports */

function registerUtilHandlers() {
    ipcMain.handle('get-user-data-path', async () => {
        try {
            return app.getPath('userData');
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
}

module.exports = { registerUtilHandlers }; 