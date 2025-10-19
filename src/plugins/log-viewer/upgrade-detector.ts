import type { Plugin, PluginResult } from "@/types/plugin";

interface DetectionResult {
  lineNumber: number;
  content: string;
}

const upgradeDetectorPlugin: Plugin = {
  id: "upgrade-detector",
  name: "升降级检测器",
  description: "检测日志中的升降级事件和异常状态",
  process: async (content: string): Promise<PluginResult> => {
    const lines = content.split("\n");
    const results: DetectionResult[] = [];

    // 统计信息
    let reasonCount = 0;
    let abnormalCount = 0;

    // 遍历每一行进行检测
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // 检测升降级原因：包含 '[reason:' 但不包含 '[reason:]'
      if (line.includes("[reason:") && !line.includes("[reason:]")) {
        results.push({
          lineNumber,
          content: line.trim(),
        });
        reasonCount++;
      }
      // 检测异常状态：包含 'monitor_message: msg:' 和 '[STAT_ABNORMAL]'
      else if (line.includes("monitor_message: msg:") && line.includes("[STAT_ABNORMAL]")) {
        results.push({
          lineNumber,
          content: line.trim(),
        });
        abnormalCount++;
      }
    }

    // 生成检测报告
    const totalIssues = reasonCount + abnormalCount;
    const hasIssues = totalIssues > 0;

    const html = `
      <div class="plugin-result upgrade-detection">
        <h3>🔍 升降级检测报告</h3>
        
        <div class="detection-summary ${hasIssues ? "has-issues" : "no-issues"}">
          <div class="summary-header">
            <span class="status-icon">${hasIssues ? "⚠️" : "✅"}</span>
            <span class="status-text">
              ${hasIssues ? `发现 ${totalIssues} 个升降级相关事件` : "未发现升降级事件"}
            </span>
          </div>
          
          <div class="summary-stats">
            <div class="stat-item">
              <span class="stat-label">升降级原因:</span>
              <span class="stat-value ${reasonCount > 0 ? "warning" : ""}">${reasonCount}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">状态异常:</span>
              <span class="stat-value ${abnormalCount > 0 ? "error" : ""}">${abnormalCount}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">总计:</span>
              <span class="stat-value">${totalIssues}</span>
            </div>
          </div>
        </div>
        
        ${
          results.length > 0
            ? `
          <div class="detection-details">
            <h4>详细检测结果</h4>
            <div class="results-list">
              ${results
                .map(
                  (result) => `
                <div class="result-item">
                  <div class="result-content">
                    <code>${result.content}</code>
                  </div>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        `
            : `
          <div class="no-results">
            <p>✅ 未检测到升降级相关事件</p>
            <p><small>检查了 ${lines.length} 行日志内容</small></p>
          </div>
        `
        }
      </div>
    `;
    const summary = "";
    return {
      type: "html",
      summary,
      html,
    };
  },
};

export default upgradeDetectorPlugin;
