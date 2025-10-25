import { ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import { openJiraFileHandler, viewJiraFileFolder, openJiraFileWithDefaultApp } from './platform-utils';
import { config } from './config';
// 注册 IPC 处理器
export const registerIpcHandlers = () => {
  // platform utils
  ipcMain.handle("open-jira-file", openJiraFileHandler);
  ipcMain.handle("view-jira-file-folder", viewJiraFileFolder);
  ipcMain.handle("open-jira-file-with-default-app", openJiraFileWithDefaultApp);

  // config
  ipcMain.handle("get-pt-username", (_event) => {
    return config.getPtUsername();
  });
  ipcMain.handle("get-pt-password", (_event) => {
    return config.getPtPassword();
  });
  ipcMain.handle("set-pt-username", (_event, username) => {
    config.setPtUsername(username);
  });
  ipcMain.handle("set-pt-password", (_event, password) => {
    config.setPtPassword(password);
  });

  // 其他 IPC 处理器...
  ipcMain.handle("read-file", async (_event, filePath) => {
    try {
      const data = await fs.promises.readFile(filePath, "utf-8");
      return data;
    } catch (error) {
      console.error("读取文件错误:", error);
      return null;
    }
  });

  // 添加文件选择对话框处理器
  ipcMain.handle("select-file", async () => {
    try {
      const { dialog } = await import('electron');
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: 'All Files', extensions: ['*'] },
          { name: 'Text Files', extensions: ['txt', 'json', 'js', 'ts', 'vue', 'html', 'css', 'md'] },
          { name: 'Images', extensions: ['jpg', 'png', 'gif', 'bmp', 'svg'] }
        ]
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        // 读取文件内容
        const content = await fs.promises.readFile(filePath, "utf-8");
        const stats = await fs.promises.stat(filePath);

        return {
          success: true,
          filePath,
          fileName: path.basename(filePath),
          fileSize: stats.size,
          content
        };
      }

      return { success: false, message: "用户取消选择文件" };
    } catch (error) {
      console.error("文件选择或读取错误:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, message: errorMessage };
    }
  });
};