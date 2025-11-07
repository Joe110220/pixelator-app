import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
});

declare global {
  interface Window {
    electron: {
      getAppPath: () => Promise<string>;
    };
  }
}
