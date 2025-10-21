import { contextBridge, ipcRenderer } from "electron";

// 移除os模块导入，因为在沙盒环境中不可用
console.log("preload script loaded");

contextBridge.exposeInMainWorld("electronAPI", {
  readFile: (filePath: string) => ipcRenderer.invoke("read-file", filePath),
  selectFile: () => ipcRenderer.invoke("select-file"),
  openJiraFile: (jira_id: string, file_name: string, file_url: string) => ipcRenderer.invoke("open-jira-file", jira_id, file_name, file_url),
});
