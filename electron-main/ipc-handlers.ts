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
        fs.unlink(filePath, () => { }); // 删除部分下载的文件
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
  const extractedFiles: string[] = [];
  if (ext === '.gz' || ext === '.tgz') {
    // 处理 tar.gz 文件
    await tar.x({
      file: filePath,
      cwd: extractDir,
      onentry: (entry: tar.ReadEntry) => {
        console.log(`解压: ${entry.path}`);
        extractedFiles.push(path.join(extractDir, entry.path));
      }
    });
  } else if (ext === '.zip') {
    // 如果需要处理zip文件，可以使用yauzl或其他zip库
    throw new Error('ZIP文件解压暂未实现，请使用tar.gz格式');
  } else {
    // 如果是普通文件，直接复制到目标目录
    console.log(`普通文件: ${filePath}`);
    extractedFiles.push(filePath);
  }
  return extractedFiles;
};

// 处理打开 Jira 文件的主函数
export const openJiraFileHandler = async (_event: any, jira_id: string, file_name: string, file_url: string) => {
  try {
    // 使用缓存目录
    const jiraDir = await getCacheSubDir(jira_id);
    const filePath = path.join(jiraDir, file_name);
    // 检查文件是否存在
    const fileExists = await fs.promises.access(filePath).then(() => true).catch(() => false);
    // 文件不存在，需要下载
    if (!fileExists) {
      // 下载文件
      console.log(`下载文件: ${filePath}`);
      await downloadFile(file_url, filePath);
    }
    // 解压文件
    const extractFiles = await extractFile(filePath, jiraDir);
    console.log(`解压文件: ${extractFiles}`);
    // 读取目标文件内容
    const extractFileExists = await fs.promises.access(extractFiles[0]).then(() => true).catch(() => false);

    if (extractFileExists) {
      const content = await fs.promises.readFile(extractFiles[0], 'utf-8');
      return {
        success: true,
        content,
        message: '文件下载并解压成功'
      };
    } else {
      return {
        success: false,
        message: '文件下载或解压失败'
      };
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
  ipcMain.handle("open-jira-file", openJiraFileHandler);

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