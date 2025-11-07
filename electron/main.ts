import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';

const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, '../assets/icon.png'),
  });

  if (isDev) {
    // 開發環境：連到 Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // 生產環境：載入打包後的 index.html
    // dist/public 是 Vite build 的輸出
    const indexPath = path.join(app.getAppPath(), 'dist', 'public', 'index.html');
    mainWindow.loadFile(indexPath);
  }

  mainWindow.once('ready-to-show', () => {
    if (mainWindow) mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

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

ipcMain.handle('get-app-path', () => {
  return app.getAppPath();
});
