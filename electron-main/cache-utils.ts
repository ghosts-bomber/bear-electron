import path from "path";
import fs from "fs";
import os from "os";

// 获取应用缓存目录的工具函数
export const getAppCacheDir = async (): Promise<string> => {
  const userDir = os.homedir();
  const appName = 'bear-electron'; // 应用名称
  const cacheDir = path.join(userDir, `.${appName}`);
  
  // 确保缓存目录存在
  try {
    await fs.promises.access(cacheDir);
  } catch {
    await fs.promises.mkdir(cacheDir, { recursive: true });
  }
  
  return cacheDir;
};

// 获取特定子目录的缓存路径
export const getCacheSubDir = async (subDirName: string): Promise<string> => {
  const cacheDir = await getAppCacheDir();
  const subDir = path.join(cacheDir, subDirName);
  
  // 确保子目录存在
  try {
    await fs.promises.access(subDir);
  } catch {
    await fs.promises.mkdir(subDir, { recursive: true });
  }
  
  return subDir;
};

// 获取缓存文件路径
export const getCacheFilePath = async (subDirName: string, fileName: string): Promise<string> => {
  const subDir = await getCacheSubDir(subDirName);
  return path.join(subDir, fileName);
};

// 清理缓存目录
export const clearCache = async (subDirName?: string): Promise<void> => {
  if (subDirName) {
    // 清理特定子目录
    const subDir = path.join(await getAppCacheDir(), subDirName);
    try {
      await fs.promises.rm(subDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`清理缓存目录失败: ${subDir}`, error);
    }
  } else {
    // 清理整个缓存目录
    const cacheDir = await getAppCacheDir();
    try {
      const items = await fs.promises.readdir(cacheDir);
      await Promise.all(
        items.map(item => 
          fs.promises.rm(path.join(cacheDir, item), { recursive: true, force: true })
        )
      );
    } catch (error) {
      console.warn(`清理缓存目录失败: ${cacheDir}`, error);
    }
  }
};

// 检查缓存文件是否存在
export const cacheFileExists = async (subDirName: string, fileName: string): Promise<boolean> => {
  try {
    const filePath = await getCacheFilePath(subDirName, fileName);
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
};

// 获取缓存目录大小
export const getCacheSize = async (subDirName?: string): Promise<number> => {
  const targetDir = subDirName 
    ? path.join(await getAppCacheDir(), subDirName)
    : await getAppCacheDir();
  
  let totalSize = 0;
  
  const calculateSize = async (dirPath: string): Promise<void> => {
    try {
      const items = await fs.promises.readdir(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = await fs.promises.stat(itemPath);
        
        if (stats.isDirectory()) {
          await calculateSize(itemPath);
        } else {
          totalSize += stats.size;
        }
      }
    } catch (error) {
      console.warn(`计算缓存大小失败: ${dirPath}`, error);
    }
  };
  
  await calculateSize(targetDir);
  return totalSize;
};

// 获取缓存目录信息
export const getCacheInfo = async (): Promise<{
  cacheDir: string;
  totalSize: number;
  subDirs: string[];
}> => {
  const cacheDir = await getAppCacheDir();
  const totalSize = await getCacheSize();
  
  let subDirs: string[] = [];
  try {
    const items = await fs.promises.readdir(cacheDir);
    const dirChecks = await Promise.all(
      items.map(async (item) => {
        const itemPath = path.join(cacheDir, item);
        const stats = await fs.promises.stat(itemPath);
        return stats.isDirectory() ? item : null;
      })
    );
    subDirs = dirChecks.filter(Boolean) as string[];
  } catch (error) {
    console.warn('获取缓存目录信息失败:', error);
  }
  
  return {
    cacheDir,
    totalSize,
    subDirs
  };
};