import { ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { createWriteStream } from 'fs';
import * as tar from 'tar';
import { getCacheSubDir } from './cache-utils';


// 下载文件的辅助函数
export const downloadFile = async (url: string, filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    const file = createWriteStream(filePath);
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`下载失败: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(filePath, () => {}); // 删除部分下载的文件
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
};

// 解压文件的辅助函数
export const extractFile = async (filePath: string, extractDir: string): Promise<string[]> => {
  const ext = path.extname(filePath).toLowerCase();
  const extractedFiles:string[] = [];
  if (ext === '.gz' || ext === '.tgz') {
    // 处理 tar.gz 文件
    await tar.x({
      file: filePath,
      cwd: extractDir,
      onentry: (entry: tar.ReadEntry) => {
        console.log(`解压: ${entry.path}`);
        extractedFiles.push(entry.path);
      }
    });
  } else if (ext === '.zip') {
    // 如果需要处理zip文件，可以使用yauzl或其他zip库
    throw new Error('ZIP文件解压暂未实现，请使用tar.gz格式');
  } else {
    // 如果是普通文件，直接复制到目标目录
    const fileName = path.basename(filePath);
    const targetPath = path.join(extractDir, fileName);
    await fs.promises.copyFile(filePath, targetPath);
    extractedFiles.push(fileName);
  }
  return extractedFiles;
};

// 处理打开 Jira 文件的主函数
export const openJiraFileHandler = async (_event: any, jira_id: string, file_name: string, file_url: string) => {
  try {
    // 使用缓存目录工具函数
    const jiraDir = await getCacheSubDir(jira_id);
    const filePath = path.join(jiraDir, file_name);
    // 检查文件是否存在
    const fileExists = await fs.promises.access(filePath).then(() => true).catch(() => false);
    
    if (fileExists) {
      // 文件存在，直接读取内容
      const content = await fs.promises.readFile(filePath, 'utf-8');
      return {
        success: true,
        content,
        message: '文件已存在，直接读取'
      };
    }
    
    // 文件不存在，需要下载
    const tempFileName = `temp_${Date.now()}_${path.basename(file_url)}`;
    const tempFilePath = path.join(jiraDir, tempFileName);
    
    try {
      // 下载文件
      await downloadFile(file_url, tempFilePath);
      
      // 解压文件
      await extractFile(tempFilePath, jiraDir);
      
      // 删除临时下载文件
      await fs.promises.unlink(tempFilePath);
      
      // 读取目标文件内容
      const fileExists = await fs.promises.access(filePath).then(() => true).catch(() => false);
      
      if (fileExists) {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        return {
          success: true,
          content,
          message: '文件下载并解压成功'
        };
      } else {
        // 如果指定的文件名不存在，尝试读取解压后的第一个文件
        const files = await fs.promises.readdir(jiraDir);
        const firstFile = files.find(f => f !== tempFileName);
        
        if (firstFile) {
          const firstFilePath = path.join(jiraDir, firstFile);
          const stats = await fs.promises.stat(firstFilePath);
          
          if (stats.isFile()) {
            const content = await fs.promises.readFile(firstFilePath, 'utf-8');
            return {
              success: true,
              content,
              message: `找到文件: ${firstFile}`,
              actualFileName: firstFile
            };
          }
        }
        
        return {
          success: false,
          message: '解压后未找到指定文件'
        };
      }
    } catch (downloadError) {
      // 清理可能创建的临时文件
      try {
        await fs.promises.unlink(tempFilePath);
      } catch {}
      
      throw downloadError;
    }
    
  } catch (error) {
    console.error('open_jira_file 错误:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `操作失败: ${errorMessage}`
    };
  }
};

// 注册 IPC 处理器
export const registerIpcHandlers = () => {
  ipcMain.handle("open_jira_file", openJiraFileHandler);
  
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