// 全局声明 preload 暴露的 API，解决 window.electronAPI 的类型错误
export {}

declare global {
  interface Window {
    electronAPI?: {
      readFile: (filePath: string) => Promise<string | null>;
      selectFile: () => Promise<{ canceled: boolean; filePaths: string[] } | undefined>;
      openJiraFile: (jira_id: string, file_name: string, file_url: string) => Promise<unknown>;
      openJiraFileWithDefaultApp: (jira_id: string, file_name: string, file_url: string) => Promise<{ success: boolean; message?: string; filePath?: string }>;
      viewJiraFileFolder: (jira_id: string) => Promise<{ success: boolean; message?: string; folderPath?: string }>;
      openLink: (link: string) => Promise<{ success: boolean; message?: string; link?: string }>;
      getPtUsername: () => Promise<string>;
      getPtPassword: () => Promise<string>;
      setPtUsername: (username: string) => Promise<void>;
      setPtPassword: (password: string) => Promise<void>;
    }
  }
}