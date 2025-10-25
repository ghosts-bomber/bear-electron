import { getCacheSubDir } from './cache-utils';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { createWriteStream } from 'fs';
import * as tar from 'tar';

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
    // TODO 实现已经解压后的文件直接打开
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
        message: '文件下载并解压成功',
        filePath: extractFiles[0]
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

export const openJiraFileWithDefaultApp = async (_event: any, jira_id: string, file_name: string, file_url: string) => {
  try {
    const result = await openJiraFileHandler(_event, jira_id, file_name, file_url);
    if (result.success) {
      // 使用 shell.openPath 打开文件
      const { shell } = await import('electron');
      await shell.openPath(result.filePath as string);
    }
    return result;
  } catch (error) {
    console.error('open_jira_file_with_default_app 错误:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `操作失败: ${errorMessage}`
    };
  }
};

export const viewJiraFileFolder = async (_event: any, jira_id: string) => {
  try {
    const jiraDir = await getCacheSubDir(jira_id);
    // 使用 shell.openPath 打开文件夹
    const { shell } = await import('electron');
    await shell.openPath(jiraDir);
    return {
      success: true,
      message: '文件夹打开成功',
      folderPath: jiraDir
    };
  } catch (error) {
    console.error('view_jira_file_folder 错误:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `操作失败: ${errorMessage}`
    };
  }
};