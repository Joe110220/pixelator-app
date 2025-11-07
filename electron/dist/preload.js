"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    saveImage: function (filename, buffer) {
        return electron_1.ipcRenderer.invoke('save-image', filename, buffer);
    },
    loadImage: function (filename) {
        return electron_1.ipcRenderer.invoke('load-image', filename);
    },
    listImages: function () {
        return electron_1.ipcRenderer.invoke('list-images');
    },
    deleteImage: function (filename) {
        return electron_1.ipcRenderer.invoke('delete-image', filename);
    },
    openFileDialog: function () {
        return electron_1.ipcRenderer.invoke('open-file-dialog');
    },
    saveFileDialog: function (defaultName) {
        return electron_1.ipcRenderer.invoke('save-file-dialog', defaultName);
    },
    writeFile: function (filePath, buffer) {
        return electron_1.ipcRenderer.invoke('write-file', filePath, buffer);
    },
});
