import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('electronAPI', {
    saveImage: (filename, buffer) => ipcRenderer.invoke('save-image', filename, buffer),
    loadImage: (filename) => ipcRenderer.invoke('load-image', filename),
    listImages: () => ipcRenderer.invoke('list-images'),
    deleteImage: (filename) => ipcRenderer.invoke('delete-image', filename),
    openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
    saveFileDialog: (defaultName) => ipcRenderer.invoke('save-file-dialog', defaultName),
    writeFile: (filePath, buffer) => ipcRenderer.invoke('write-file', filePath, buffer),
});
//# sourceMappingURL=preload.js.map