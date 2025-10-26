import type { AnalysisPluginResult,LogItem } from "@/types/plugin";
import { IAnalysisPlugin, composeTextDataResult,composeLogDataResult } from "@/types/plugin";;

interface DetectionResult {
  lineNumber: number;
  content: string;
}
class UpgradeDetectorPlugin extends IAnalysisPlugin {
  private constructor() {
    super("upgrade-detector", "升降级检测器", "检测日志中的升降级事件和异常状态");
  }
  async process(
    fileName: string,
    content: string,
  ): Promise<AnalysisPluginResult[]> {
    const results: AnalysisPluginResult[] = [];
    const lines = content.split("\n");
    const logItems: LogItem[] = [];
    // 统计信息
    let errorCount = 0;

    // 遍历每一行进行检测
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // 检测升降级原因：包含 '[reason:' 但不包含 '[reason:]'
      if (line.includes("[reason:") && !line.includes("[reason:]") && (line.includes("->DEGRADATION"))) {
        logItems.push({
          lineNumber: lineNumber,
          text: line.trim(),
        });
        errorCount++;
      }
      // 检测异常状态：包含 'monitor_message: msg:' 和 '[STAT_ABNORMAL]'
      else if (line.includes("monitor_message: msg:") && line.includes("[STAT_ABNORMAL]")) {
        logItems.push({
          lineNumber: lineNumber,
          text: line.trim(),
        });
        errorCount++;
      }
    }

    // 生成检测报告
   if(errorCount > 0) {
    const summary = `⚠️发现 ${errorCount} 条升降级相关日志`
    results.push(composeTextDataResult(summary))
    results.push(composeLogDataResult(logItems))
   }else{
    results.push(composeTextDataResult("✅未发现升降级相关事件"))
   }
   
   return results
  }
};

export default UpgradeDetectorPlugin.getInstance();
