import { contextBridge, ipcRenderer } from "electron";

// 移除os模块导入，因为在沙盒环境中不可用
console.log("preload script loaded");

contextBridge.exposeInMainWorld("electronAPI", {
  readFile: (filePath: string) => ipcRenderer.invoke("read-file", filePath),
  selectFile: () => ipcRenderer.invoke("select-file"),
});
