import { contextBridge, ipcRenderer } from "electron";

// 移除os模块导入，因为在沙盒环境中不可用
console.log("preload script loaded");

contextBridge.exposeInMainWorld("electronAPI", {
  readFile: (filePath: string) => ipcRenderer.invoke("read-file", filePath),
  selectFile: () => ipcRenderer.invoke("select-file"),
  openJiraFile: (jira_id: string, file_name: string, file_url: string) => ipcRenderer.invoke("open-jira-file", jira_id, file_name, file_url),
  openJiraFileWithDefaultApp: (jira_id: string, file_name: string, file_url: string) => ipcRenderer.invoke("open-jira-file-with-default-app", jira_id, file_name, file_url),
  viewJiraFileFolder: (jira_id: string) => ipcRenderer.invoke("view-jira-file-folder", jira_id),
  openLink: (link: string) => ipcRenderer.invoke("open-link", link),
  // config
  getPtUsername: () => ipcRenderer.invoke("get-pt-username"),
  getPtPassword: () => ipcRenderer.invoke("get-pt-password"),
  setPtUsername: (username: string) => ipcRenderer.invoke("set-pt-username", username),
  setPtPassword: (password: string) => ipcRenderer.invoke("set-pt-password", password),
});
