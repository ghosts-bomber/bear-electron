import { AnalysisType, IAnalysisPlugin } from "@/types/plugin";
import * as LogViewerPlugin from "@/plugins/log-viewer";
import type { AipDataInfo,LogFileInfo } from "@/types/pt-type";
import { isTimeInRangeUseDate,openJiraFileWithDownload } from "@/utils/tools";
const AnalysisMap: Map<AnalysisType, IAnalysisPlugin[]> = new Map([
    [AnalysisType.DOWN_GRADE, [LogViewerPlugin.UpgradeDetectorPlugin, LogViewerPlugin.StackTraceDetectorPlugin]],
    [AnalysisType.JUMP_STANDBY, [LogViewerPlugin.StackTraceDetectorPlugin, LogViewerPlugin.UpgradeDetectorPlugin]],
]);

class AutoAnalysis {
    private static instance: AutoAnalysis;

    private constructor() {
        console.log("AutoAnalysis constructor");
    }

    static getInstance(): AutoAnalysis {
        if (!AutoAnalysis.instance) {
            AutoAnalysis.instance = new AutoAnalysis();
        }
        return AutoAnalysis.instance;
    }

    async analysis(type: AnalysisType,aipCode:string, aipData: AipDataInfo,datetime:Date) {
        const plugins = AnalysisMap.get(type);
        if (!plugins) {
            return;
        }
        // 遍历插件，调用分析方法
        for (const plugin of plugins) {
            // 插件需要的日志
            const logClass = plugin.logClass;
            // 获取问题时间点插件需要的日志
            const logItems = aipData.logFiles.filter((item:LogFileInfo)=>{
               for(const logClassItem of logClass){
                    if(item.cut === false && item.name.includes(logClassItem)){
                        return true;
                    }
               }
               return false;
            });
            // 传给插件，获取插件的分析结果
            for(const item of logItems){
                const content = await openJiraFileWithDownload(aipCode,item);
                const pluginResult = await plugin.process(aipCode,content,datetime);
                // 判断summary是否确认分析到问题原因
              
            }
            // 没有确认分析到则继续调用其他插件分析
            // 分析结果发送信号动态返回出去
        }
    }
}
export default AutoAnalysis.getInstance();