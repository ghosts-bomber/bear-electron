import type { Plugin, PluginResult, PluginContext } from "@/types/plugin";

// 生成文件名
function generateFilename(originalFileName?: string): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 19).replace(/[T:]/g, "-");

  if (originalFileName) {
    // 移除原文件的扩展名，使用txt扩展名
    const nameWithoutExt =
      originalFileName.substring(0, originalFileName.lastIndexOf(".")) || originalFileName;
    return `${nameWithoutExt}-export-${dateStr}.txt`;
  }

  return `text-export-${dateStr}.txt`;
}

// 直接下载文件
function downloadTextFile(content: string, filename: string): boolean {
  try {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error("文件下载失败:", error);
    return false;
  }
}

const plugin: Plugin = {
  id: "text-export",
  name: "导出文本文件",
  description: "直接将文本内容导出为txt文件",
  async process(content: string, context?: PluginContext): Promise<PluginResult> {
    if (!content || !content.trim()) {
      return {
        type: "html",
        html: `
          <div style="padding: 15px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; color: #856404;">
            <strong>⚠️ 内容为空</strong><br>
            没有可导出的内容，请确保选择了有效的文本内容。
          </div>
        `,
      };
    }

    const filename = generateFilename(context?.fileName);
    const success = downloadTextFile(content, filename);

    const contentStats = {
      totalLines: content.split("\n").length,
      totalChars: content.length,
      nonEmptyLines: content.split("\n").filter((line) => line.trim()).length,
    };

    if (success) {
      return {
        type: "html",
        html: `
          <div style="padding: 20px; background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #0369a1;">
              ✅ 文件导出成功
            </h3>
            <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h4 style="margin-top: 0; color: #6b7280;">📊 导出信息</h4>
              <div style="font-size: 14px; line-height: 1.6;">
                <div><strong>文件名:</strong> ${filename}</div>
                <div><strong>总行数:</strong> ${contentStats.totalLines}</div>
                <div><strong>非空行数:</strong> ${contentStats.nonEmptyLines}</div>
                <div><strong>总字符数:</strong> ${contentStats.totalChars.toLocaleString()}</div>
                <div><strong>导出时间:</strong> ${new Date().toLocaleString("zh-CN")}</div>
              </div>
            </div>
            <div style="background: #e0f2fe; padding: 10px; border-radius: 5px; font-size: 13px; color: #0369a1;">
              💡 文件已保存到您的下载目录，可直接用文本编辑器打开查看。
            </div>
          </div>
        `,
      };
    } else {
      return {
        type: "html",
        html: `
          <div style="padding: 15px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 5px; color: #dc2626;">
            <strong>❌ 导出失败</strong><br>
            文件导出过程中发生错误，请重试或检查浏览器权限设置。
          </div>
        `,
      };
    }
  },
};

export default plugin;
