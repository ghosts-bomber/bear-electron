import type { Plugin, PluginResult } from "@/types/plugin";

interface StackTraceResult {
  lineNumber: number;
  content: string;
}

const stackTraceDetectorPlugin: Plugin = {
  id: "stack-trace-detector",
  name: "trace日志堆栈检查",
  description: "检测日志中的堆栈跟踪信息",
  process: async (content: string): Promise<PluginResult> => {
    const lines = content.split("\n");
    const results: StackTraceResult[] = [];

    // 统计信息
    let stackInfoCount = 0;

    // 遍历每一行进行检测
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // 检测 Stack Info
      if (line.includes("Stack Info Start")) {
        results.push({
          lineNumber,
          content: line.trim(),
        });
        stackInfoCount++;
      } else if (line.includes("stack dump")) {
        results.push({
          lineNumber,
          content: line.trim(),
        });
      }
    }

    // 生成检测报告
    const hasIssues = stackInfoCount > 0;
    // 分析严重程度
    const getSeverity = () => {
      if (stackInfoCount > 0) return { level: "critical", text: "严重", color: "#f56c6c" };
      return { level: "normal", text: "正常", color: "#67c23a" };
    };

    const severity = getSeverity();

    const html = `
      <div class="plugin-result stack-trace-detection">
        <h3>🔍 trace日志堆栈检查报告</h3>
        
        <div class="detection-summary ${hasIssues ? "has-issues" : "no-issues"}" style="border-color: ${severity.color}">
          <div class="summary-header">
            <span class="status-icon">${hasIssues ? "⚠️" : "✅"}</span>
            <span class="status-text">
              ${hasIssues ? `发现 ${stackInfoCount} 个堆栈相关问题` : "未发现堆栈问题"}
            </span>
            <span class="severity-badge" style="background-color: ${severity.color}">
              ${severity.text}
            </span>
          </div>
          
          <div class="summary-stats">
            <div class="stat-item">
              <span class="stat-label">Stack Info:</span>
              <span class="stat-value ${stackInfoCount > 0 ? "critical" : ""}">${stackInfoCount}</span>
            </div>
            
          </div>
        </div>
        
        ${
          results.length > 0
            ? `
          <div class="detection-details">
            <h4>详细检测结果</h4>
            <div class="issue-analysis">
              ${
                stackInfoCount > 0
                  ? `
                <div class="analysis-item critical">
                  <strong>🚨 严重问题：</strong>检测到 ${stackInfoCount} 个堆栈转储，可能存在模块崩溃或严重错误
                </div>
              `
                  : ""
              }
            </div>
            
            <div class="results-list">
                <div class="result-item stack_dump">
                  <div class="result-header">
                    
                    <span class="result-type stack_dump">
                     💥 堆栈信息
                    </span>
                  </div>
                  <div class="result-content">
                  ${results
                    .map(
                      (result) => `
                    <code>${result.content}</code>
                  `
                    )
                    .join("")}
            </div>
          </div>
        `
            : `
          <div class="no-results">
            <div class="success-icon">✅</div>
            <h4>未检测到堆栈问题</h4>
            <p>检查了 ${lines.length} 行日志内容，未发现堆栈相关异常</p>
            <div class="tips">
              <p><strong>建议：</strong></p>
              <ul>
                <li>继续监控系统状态</li>
                <li>检查其他类型的日志</li>
                <li>关注模块运行状态</li>
              </ul>
            </div>
          </div>
        `
        }
        
        <div class="detection-info">
          <h4>🔧 检测说明</h4>
          <div class="info-grid">
            <div class="info-item">
              <h5>Stack Info</h5>
              <p>堆栈转储，通常表示严重错误或崩溃</p>
            </div>
          </div>
          
          <div class="impact-analysis">
            <h5>💡 可能影响</h5>
            <ul>
              <li><strong>AD灯不亮：</strong>模块崩溃可能导致自动驾驶指示灯无法正常工作</li>
              <li><strong>行驶中调STBY模块：</strong>堆栈问题可能触发待机模式切换</li>
              <li><strong>系统稳定性：</strong>频繁的堆栈问题可能影响整体系统稳定性</li>
            </ul>
          </div>
        </div>
        
        <div class="detection-time">
          <small>检测完成时间: ${new Date().toLocaleString()}</small>
        </div>
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

export default stackTraceDetectorPlugin;
