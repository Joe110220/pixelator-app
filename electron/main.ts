import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      // ✅ 用 ESM 方式載入 preload：給 URL，而不是一般檔案路徑
      preload: pathToFileURL(path.join(__dirname, "preload.js")).href,
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, "../assets/icon.png"),
  });

  if (isDev) {
    // 開發環境：連 Vite dev server
    await mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    // 生產環境：載入打包後的 index.html
    const indexPath = path.join(app.getAppPath(), "dist", "public", "index.html");
    await mainWindow.loadFile(indexPath);
  }

  mainWindow.once("ready-to-show", () => {
    if (mainWindow) mainWindow.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  void createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    void createWindow();
  }
});

ipcMain.handle("get-app-path", () => {
  return app.getAppPath();
});
