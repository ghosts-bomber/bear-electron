// electron-main/index.ts
import { app, BrowserWindow, ipcMain, dialog } from "electron"
import path from "path"
import fs from "fs"
 
const createWindow = () => {
  const win = new BrowserWindow({
    webPreferences: {
      contextIsolation: true, // 启用上下文隔离，确保安全性
      nodeIntegration: false, // 禁用Node集成，通过preload脚本提供API
      preload: path.join(__dirname, "./preload.js"), // 需要引用js文件
    },
  })
 
  // 如果打包了，渲染index.html
  if (process.env.NODE_ENV !== 'development') {
    win.loadFile(path.join(__dirname, "../index.html"))
    win.webContents.openDevTools()
  } else {
    let url = "http://localhost:5173" // 更新端口号，匹配当前Vite服务器端口
    win.loadURL(url)
    win.webContents.openDevTools()
  }
}
 
app.whenReady().then(() => {
  createWindow() // 创建窗口
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})
 
// 关闭窗口
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
}) 

ipcMain.handle("read-file", async (event, filePath) => {
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
    return { success: false, message: error.message };
  }
});

