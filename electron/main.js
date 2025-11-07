import { app, BrowserWindow, Menu, ipcMain, dialog } from 'electron';
import path from 'path';
import isDev from 'electron-is-dev';
import fs from 'fs';
let mainWindow = null;
const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        icon: path.join(__dirname, '../assets/icon.png'),
    });
    const startUrl = isDev
        ? 'http://localhost:5173'
        : `file://${path.join(__dirname, '../dist/index.html')}`;
    mainWindow.loadURL(startUrl);
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
};
app.on('ready', createWindow);
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
// Get user data directory for local storage
const getUserDataPath = () => {
    const appDataPath = app.getPath('userData');
    const imagesPath = path.join(appDataPath, 'images');
    if (!fs.existsSync(imagesPath)) {
        fs.mkdirSync(imagesPath, { recursive: true });
    }
    return imagesPath;
};
// IPC handlers for file operations
ipcMain.handle('save-image', async (event, filename, buffer) => {
    try {
        const imagesPath = getUserDataPath();
        const filePath = path.join(imagesPath, filename);
        fs.writeFileSync(filePath, buffer);
        return { success: true, path: filePath };
    }
    catch (error) {
        console.error('Error saving image:', error);
        return { success: false, error: error.message };
    }
});
ipcMain.handle('load-image', async (event, filename) => {
    try {
        const imagesPath = getUserDataPath();
        const filePath = path.join(imagesPath, filename);
        if (!fs.existsSync(filePath)) {
            return { success: false, error: 'File not found' };
        }
        const buffer = fs.readFileSync(filePath);
        return { success: true, buffer: buffer.toString('base64') };
    }
    catch (error) {
        console.error('Error loading image:', error);
        return { success: false, error: error.message };
    }
});
ipcMain.handle('list-images', async () => {
    try {
        const imagesPath = getUserDataPath();
        const files = fs.readdirSync(imagesPath);
        return { success: true, files };
    }
    catch (error) {
        console.error('Error listing images:', error);
        return { success: false, error: error.message };
    }
});
ipcMain.handle('delete-image', async (event, filename) => {
    try {
        const imagesPath = getUserDataPath();
        const filePath = path.join(imagesPath, filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        return { success: true };
    }
    catch (error) {
        console.error('Error deleting image:', error);
        return { success: false, error: error.message };
    }
});
ipcMain.handle('open-file-dialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp'] },
            { name: 'All Files', extensions: ['*'] },
        ],
    });
    if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        const buffer = fs.readFileSync(filePath);
        return {
            success: true,
            filename: path.basename(filePath),
            buffer: buffer.toString('base64'),
        };
    }
    return { success: false };
});
ipcMain.handle('save-file-dialog', async (event, defaultName) => {
    const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: defaultName,
        filters: [
            { name: 'PNG Image', extensions: ['png'] },
            { name: 'All Files', extensions: ['*'] },
        ],
    });
    if (!result.canceled && result.filePath) {
        return { success: true, filePath: result.filePath };
    }
    return { success: false };
});
ipcMain.handle('write-file', async (event, filePath, buffer) => {
    try {
        fs.writeFileSync(filePath, buffer);
        return { success: true };
    }
    catch (error) {
        console.error('Error writing file:', error);
        return { success: false, error: error.message };
    }
});
// Create application menu
const createMenu = () => {
    const template = [
        {
            label: '檔案',
            submenu: [
                {
                    label: '退出',
                    accelerator: 'CmdOrCtrl+Q',
                    click: () => {
                        app.quit();
                    },
                },
            ],
        },
        {
            label: '編輯',
            submenu: [
                { label: '復原', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
                { label: '重做', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
                { type: 'separator' },
                { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
                { label: '複製', accelerator: 'CmdOrCtrl+C', role: 'copy' },
                { label: '貼上', accelerator: 'CmdOrCtrl+V', role: 'paste' },
            ],
        },
        {
            label: '檢視',
            submenu: [
                { label: '重新加載', accelerator: 'CmdOrCtrl+R', role: 'reload' },
                { label: '強制重新加載', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
                { label: '開發者工具', accelerator: 'CmdOrCtrl+Shift+I', role: 'toggleDevTools' },
            ],
        },
        {
            label: '幫助',
            submenu: [
                {
                    label: '關於拼豆像素化工具',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: '關於拼豆像素化工具',
                            message: '拼豆像素化工具',
                            detail: '版本 1.0.0\n\n一個幫助您設計拼豆圖案的工具。',
                        });
                    },
                },
            ],
        },
    ];
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
};
app.on('ready', createMenu);
//# sourceMappingURL=main.js.map