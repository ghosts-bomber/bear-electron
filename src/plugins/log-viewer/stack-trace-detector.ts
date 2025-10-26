import type { AnalysisPluginResult, LogItem } from "@/types/plugin";
import { IAnalysisPlugin, composeTextDataResult, composeLogDataResult } from "@/types/plugin";;

class StackTraceDetectorPlugin extends IAnalysisPlugin {
  private constructor() {
    super("stack-trace-detector", "trace日志堆栈检查", "检测日志中的堆栈跟踪信息");
  }
  async process(
    fileName: string,
    content: string,
  ): Promise<AnalysisPluginResult[]> {
    const results: AnalysisPluginResult[] = [];
    const lines = content.split("\n");
    const logItems: LogItem[] = [];

    // 遍历每一行进行检测
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;
      // 检测 Stack Info
      if (line.includes("Stack Info Start")) {
       logItems.push({
          lineNumber:lineNumber,
          text: line.trim(),
        });
      } else if (line.includes("stack dump")) {
         logItems.push({
          lineNumber:lineNumber,
          text: line.trim(),
        });
      }
    }
    if(logItems.length > 0){
      results.push(composeTextDataResult(
       `🚨检测到崩溃堆栈`
      ));
      results.push(composeLogDataResult(logItems));
    }else {
      results.push(composeTextDataResult(
       `✅未检测到崩溃堆栈`
      ));
    }
    return results
  }
};

export default StackTraceDetectorPlugin.getInstance();
