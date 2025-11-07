import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  saveImage: (filename: string, buffer: Buffer) =>
    ipcRenderer.invoke("save-image", filename, buffer),
  loadImage: (filename: string) =>
    ipcRenderer.invoke("load-image", filename),
  listImages: () =>
    ipcRenderer.invoke("list-images"),
  deleteImage: (filename: string) =>
    ipcRenderer.invoke("delete-image", filename),
  openFileDialog: () =>
    ipcRenderer.invoke("open-file-dialog"),
  saveFileDialog: (defaultName: string) =>
    ipcRenderer.invoke("save-file-dialog", defaultName),
  writeFile: (filePath: string, buffer: Buffer) =>
    ipcRenderer.invoke("write-file", filePath, buffer),
});

declare global {
  interface Window {
    electronAPI: {
      saveImage: (filename: string, buffer: Buffer) => Promise<void>;
      loadImage: (filename: string) => Promise<Uint8Array | null>;
      listImages: () => Promise<string[]>;
      deleteImage: (filename: string) => Promise<void>;
      openFileDialog: () => Promise<string | null>;
      saveFileDialog: (defaultName?: string) => Promise<string | null>;
      writeFile: (filePath: string, buffer: Buffer) => Promise<void>;
    };
  }
}
