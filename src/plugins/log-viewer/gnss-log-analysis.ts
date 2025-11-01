import type {  AnalysisPluginResult, } from "@/types/plugin";
import { IAnalysisPlugin, composeTextDataResult, composeChartDataResult,LogClass } from "@/types/plugin";

interface LogCategory {
    orinRecvMpu: string[];
    gnssImu: string[];
    bestGnssPos: string[];
}
interface TimeRange {
    begin: number;
    end: number;
}
function parseTimeRange(lines: string[]): TimeRange | null {
    try {
        let beginTime = 0;
        let endTime = 0;

        for (const line of lines) {
            const timeMatch = line.match(/(\d{2}:\d{2}:\d{2})/);
            if (timeMatch) {
                const time = timeStringToSeconds(timeMatch[1]);
                beginTime = time;
                break;
            }
        }
        // 从后向前遍历查找结束时间
        for (let i = lines.length - 1; i >= 0; i--) {
            const timeMatch = lines[i].match(/(\d{2}:\d{2}:\d{2})/);
            if (timeMatch) {
                const time = timeStringToSeconds(timeMatch[1]);
                endTime = time;
                break;
            }
        }

        return beginTime > 0 ? { begin: beginTime, end: endTime } : null;
    } catch {
        return null;
    }
}

function timeStringToSeconds(timeStr: string): number {
    const [hours, minutes, seconds] = timeStr.split(":").map(Number);
    return hours * 3600 + minutes * 60 + seconds;
}

// 将时间字符串转换为时间戳（毫秒）
function timeStringToTimestamp(timeStr: string): number {
    // 解析时间字符串，如 "16:14:24.967221"
    const [timePart, microseconds = "0"] = timeStr.split(".");
    const [hours, minutes, seconds] = timePart.split(":").map(Number);

    // 创建今天的日期，然后设置时间
    const today = new Date();
    today.setHours(hours, minutes, seconds, parseInt(microseconds.substr(0, 3))); // 只取前3位作为毫秒

    return today.getTime();
}
function formatTimeFromSeconds(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
        .toString()
        .padStart(2, "0");
    const mins = Math.floor((seconds % 3600) / 60)
        .toString()
        .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${hours}:${mins}:${secs}`;
}
// 将秒数转换为时间戳（毫秒）
function secondsToTimestamp(seconds: number): number {
    const today = new Date();
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    today.setHours(hours, minutes, secs, 0);
    return today.getTime();
}

class GnssLogAnalysisPlugin extends IAnalysisPlugin {
    private constructor() {
        super("gnss-log-analysis", "GNSS日志分析", "分析GNSS日志生成图表与文本",[LogClass.DRIVER_GNSS]);
    }
    results: AnalysisPluginResult[] = [];
    process = async (fileName: string, content: string): Promise<AnalysisPluginResult[]> => {
        // 重置单例的结果缓存，避免跨次分析污染
        this.results = [];
        const lines = content.split("\n").filter((line) => line.trim());
        const timeRange = parseTimeRange(lines);
        if (!timeRange) {
            this.results.push(composeTextDataResult('🖥️ Orin接收MPU数据分析：未找到时间范围'))
            return this.results;
        }
        this.analyzeOrinRecvMpu(lines, timeRange);
        return this.results;
    }
    analyzeOrinRecvMpu(lines: string[], timeRange: TimeRange) {
        // 存储每秒的数据量汇总
        const dataBySecond = new Map<string, number>();

        // 正则表达式匹配日志格式：I[250613 16:14:24.967221][2684][raw_stream.cpp:493]read data length: 32/84
        const logRegex = /(\d{2}:\d{2}:\d{2})\.\d+.*?read data length: (\d+)\/\d+/;

        for (const line of lines) {
            const match = line.match(logRegex);
            if (!match) continue;

            const timeSecond = match[1]; // 提取到秒级的时间，如 "16:14:24"
            const dataLength = parseInt(match[2]); // 提取数据长度，如 32

            // 按秒汇总数据量
            const currentValue = dataBySecond.get(timeSecond) || 0;
            dataBySecond.set(timeSecond, currentValue + dataLength);
        }

        if (dataBySecond.size === 0) {
            this.results.push(composeTextDataResult('🖥️ Orin接收MPU数据分析：未找到匹配的日志行'))
            return;
        }

        // 生成完整的秒级时间序列（基于timeRange）
        const timeLabels: string[] = [];
        const chartData: Array<{ value: [number, number]; originalTime: string }> = [];

        for (let time = timeRange.begin; time <= timeRange.end; time++) {
            const timeStr = formatTimeFromSeconds(time);
            timeLabels.push(timeStr);

            const dataAmount = dataBySecond.get(timeStr) || 0;
            chartData.push({
                value: [secondsToTimestamp(time), dataAmount],
                originalTime: timeStr,
            });
        }

        // 计算统计信息
        const totalData = Array.from(dataBySecond.values()).reduce((sum, val) => sum + val, 0);
        const nonZeroSeconds = Array.from(dataBySecond.values()).filter((val) => val > 0);
        const avgDataPerSecond =
            nonZeroSeconds.length > 0 ? Math.round(totalData / nonZeroSeconds.length) : 0;
        const maxDataPerSecond = Math.max(...Array.from(dataBySecond.values()));
        const activeSeconds = nonZeroSeconds.length;

        // 生成图表配置
        const chartOption = {
            title: {
                text: "Orin每秒接收MPU数据量统计",
                left: "center",
                textStyle: { fontSize: 14, fontWeight: "bold" },
            },
            tooltip: {
                trigger: "axis",
                axisPointer: { type: "cross", animation: false },
                formatter: function (params: any) {
                    const data = params[0];
                    const originalTime = data.data && data.data.originalTime ? data.data.originalTime : "";
                    return `<div style="font-weight: bold; color: #333; margin-bottom: 8px;">
          🕒 时间: ${originalTime}
        </div>
        <div style="margin: 4px 0;">
          📊 该秒总数据量: <span style="font-weight: bold;">${data.value[1]} bytes</span>
        </div>
        <div style="margin: 4px 0; font-size: 12px; color: #666;">
          💡 该秒内所有读取操作的数据量总和
        </div>`;
                },
            },
            grid: { left: "8%", right: "4%", bottom: "20%", top: "15%", containLabel: true },
            xAxis: {
                type: "time",
                axisLabel: {
                    rotate: 45,
                    fontSize: 9,
                    formatter: (value: number) => {
                        const date = new Date(value);
                        return date.toTimeString().split(" ")[0]; // 显示 HH:MM:SS
                    },
                },
                axisTick: { alignWithLabel: true },
                min: secondsToTimestamp(timeRange.begin),
                max: secondsToTimestamp(timeRange.end),
            },
            yAxis: {
                type: "value",
                name: "数据量 (bytes/秒)",
                axisLabel: { formatter: "{value}" },
                splitLine: { lineStyle: { type: "dashed" } },
            },
            series: [
                {
                    name: "每秒数据量",
                    type: "line",
                    data: chartData,
                    itemStyle: {
                        color: "#5470C6",
                        borderColor: "#ffffff",
                        borderWidth: 1,
                    },
                    lineStyle: {
                        color: "#5470C6",
                        width: 2,
                    },
                    symbol: "circle",
                    symbolSize: 4,
                    smooth: false,
                    connectNulls: false,
                    areaStyle: {
                        color: {
                            type: "linear",
                            x: 0,
                            y: 0,
                            x2: 0,
                            y2: 1,
                            colorStops: [
                                { offset: 0, color: "rgba(84, 112, 198, 0.3)" },
                                { offset: 1, color: "rgba(84, 112, 198, 0.1)" },
                            ],
                        },
                    },
                },
            ],
            dataZoom: [
                { type: "slider", xAxisIndex: 0, start: 0, end: 100, height: 20, bottom: 10 },
                { type: "inside", xAxisIndex: 0 },
            ],
        };
        this.results.push(composeChartDataResult('🖥️ Orin接收MPU数据分析', chartOption))
    }

}
export default GnssLogAnalysisPlugin.getInstance();
