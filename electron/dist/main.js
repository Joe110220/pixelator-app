"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var path = require("path");
var electron_is_dev_1 = require("electron-is-dev");
var fs = require("fs");
var mainWindow = null;
var createWindow = function () {
    mainWindow = new electron_1.BrowserWindow({
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
    var startUrl = electron_is_dev_1.default
        ? 'http://localhost:5173'
        : "file://".concat(path.join(__dirname, '../dist/index.html'));
    mainWindow.loadURL(startUrl);
    if (electron_is_dev_1.default) {
        mainWindow.webContents.openDevTools();
    }
    mainWindow.on('closed', function () {
        mainWindow = null;
    });
};
electron_1.app.on('ready', createWindow);
electron_1.app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});
// Get user data directory for local storage
var getUserDataPath = function () {
    var appDataPath = electron_1.app.getPath('userData');
    var imagesPath = path.join(appDataPath, 'images');
    if (!fs.existsSync(imagesPath)) {
        fs.mkdirSync(imagesPath, { recursive: true });
    }
    return imagesPath;
};
// IPC handlers for file operations
electron_1.ipcMain.handle('save-image', function (event, filename, buffer) { return __awaiter(void 0, void 0, void 0, function () {
    var imagesPath, filePath;
    return __generator(this, function (_a) {
        try {
            imagesPath = getUserDataPath();
            filePath = path.join(imagesPath, filename);
            fs.writeFileSync(filePath, buffer);
            return [2 /*return*/, { success: true, path: filePath }];
        }
        catch (error) {
            console.error('Error saving image:', error);
            return [2 /*return*/, { success: false, error: error.message }];
        }
        return [2 /*return*/];
    });
}); });
electron_1.ipcMain.handle('load-image', function (event, filename) { return __awaiter(void 0, void 0, void 0, function () {
    var imagesPath, filePath, buffer;
    return __generator(this, function (_a) {
        try {
            imagesPath = getUserDataPath();
            filePath = path.join(imagesPath, filename);
            if (!fs.existsSync(filePath)) {
                return [2 /*return*/, { success: false, error: 'File not found' }];
            }
            buffer = fs.readFileSync(filePath);
            return [2 /*return*/, { success: true, buffer: buffer.toString('base64') }];
        }
        catch (error) {
            console.error('Error loading image:', error);
            return [2 /*return*/, { success: false, error: error.message }];
        }
        return [2 /*return*/];
    });
}); });
electron_1.ipcMain.handle('list-images', function () { return __awaiter(void 0, void 0, void 0, function () {
    var imagesPath, files;
    return __generator(this, function (_a) {
        try {
            imagesPath = getUserDataPath();
            files = fs.readdirSync(imagesPath);
            return [2 /*return*/, { success: true, files: files }];
        }
        catch (error) {
            console.error('Error listing images:', error);
            return [2 /*return*/, { success: false, error: error.message }];
        }
        return [2 /*return*/];
    });
}); });
electron_1.ipcMain.handle('delete-image', function (event, filename) { return __awaiter(void 0, void 0, void 0, function () {
    var imagesPath, filePath;
    return __generator(this, function (_a) {
        try {
            imagesPath = getUserDataPath();
            filePath = path.join(imagesPath, filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            return [2 /*return*/, { success: true }];
        }
        catch (error) {
            console.error('Error deleting image:', error);
            return [2 /*return*/, { success: false, error: error.message }];
        }
        return [2 /*return*/];
    });
}); });
electron_1.ipcMain.handle('open-file-dialog', function () { return __awaiter(void 0, void 0, void 0, function () {
    var result, filePath, buffer;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, electron_1.dialog.showOpenDialog(mainWindow, {
                    properties: ['openFile'],
                    filters: [
                        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp'] },
                        { name: 'All Files', extensions: ['*'] },
                    ],
                })];
            case 1:
                result = _a.sent();
                if (!result.canceled && result.filePaths.length > 0) {
                    filePath = result.filePaths[0];
                    buffer = fs.readFileSync(filePath);
                    return [2 /*return*/, {
                            success: true,
                            filename: path.basename(filePath),
                            buffer: buffer.toString('base64'),
                        }];
                }
                return [2 /*return*/, { success: false }];
        }
    });
}); });
electron_1.ipcMain.handle('save-file-dialog', function (event, defaultName) { return __awaiter(void 0, void 0, void 0, function () {
    var result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, electron_1.dialog.showSaveDialog(mainWindow, {
                    defaultPath: defaultName,
                    filters: [
                        { name: 'PNG Image', extensions: ['png'] },
                        { name: 'All Files', extensions: ['*'] },
                    ],
                })];
            case 1:
                result = _a.sent();
                if (!result.canceled && result.filePath) {
                    return [2 /*return*/, { success: true, filePath: result.filePath }];
                }
                return [2 /*return*/, { success: false }];
        }
    });
}); });
electron_1.ipcMain.handle('write-file', function (event, filePath, buffer) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        try {
            fs.writeFileSync(filePath, buffer);
            return [2 /*return*/, { success: true }];
        }
        catch (error) {
            console.error('Error writing file:', error);
            return [2 /*return*/, { success: false, error: error.message }];
        }
        return [2 /*return*/];
    });
}); });
// Create application menu
var createMenu = function () {
    var template = [
        {
            label: '檔案',
            submenu: [
                {
                    label: '退出',
                    accelerator: 'CmdOrCtrl+Q',
                    click: function () {
                        electron_1.app.quit();
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
                    click: function () {
                        electron_1.dialog.showMessageBox(mainWindow, {
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
    var menu = electron_1.Menu.buildFromTemplate(template);
    electron_1.Menu.setApplicationMenu(menu);
};
electron_1.app.on('ready', createMenu);
