// electron-main/index.ts
import { app, BrowserWindow, ipcMain, dialog } from "electron"
import path from "path"
import { registerIpcHandlers } from "./ipc-handlers"


const createWindow = () => {
  const win = new BrowserWindow({
    width: 1600,
    height: 1200, 
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
    let url = "http://localhost:7900" // 更新端口号，匹配当前Vite服务器端口
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

registerIpcHandlers();