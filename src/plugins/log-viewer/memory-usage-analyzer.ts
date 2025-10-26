import type { AnalysisPluginResult, LogItem } from "@/types/plugin";
import { IAnalysisPlugin, composeTextDataResult, composeLogDataResult, composeChartDataResult } from "@/types/plugin";;

interface MemoryUsageData {
  time: number;
  usage: number;
  timeStr: string;
}

interface MemoryAnalysisResult {
  data: MemoryUsageData[];
  avgUsage: number;
  maxUsage: number;
  minUsage: number;
  dataCount: number;
}

class MemoryUsageAnalyzerPlugin extends IAnalysisPlugin {
  private constructor() {
    super("memory-usage-analyzer", "Neodrive内存使用率分析", "分析日志中的Neodrive内存使用率数据并绘制趋势图");
  }

  async process(
    fileName: string,
    content: string,
  ): Promise<AnalysisPluginResult[]> {
    const results: AnalysisPluginResult[] = [];
    const lines = content.split("\n");

    // 时间转换函数
    const convertStrToTime = (timeStr: string): number => {
      const parts = timeStr.split(":");
      return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    };

    const convertTimeToStr = (time: number): string => {
      const hour = Math.floor(time / 3600);
      const minute = Math.floor((time % 3600) / 60);
      const second = time % 60;
      return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:${second.toString().padStart(2, "0")}`;
    };

    // 初始化数据结构
    const memoryUsage: number[] = [];
    const timePoints: number[] = [];

    const startTime = "00:00:00";
    const endTime = "23:59:59";
    const startInt = convertStrToTime(startTime);
    const endInt = convertStrToTime(endTime);

    let timeMatches = 0;
    let memoryMatches = 0;

    // 解析日志数据
    for (const line of lines) {
      // 检测内存使用率行 - 'neodrive memory'
      if (line.includes("neodrive memory")) {
        try {
          const parts = line.split(" ");
          if (parts.length > 6) {
            const timePart = parts[1].split("][")[0].split(".")[0];
            const time = convertStrToTime(timePart);

            if (time < startInt || time > endInt) {
              continue;
            }
            timePoints.push(time);
            timeMatches++;

            const usage = parseFloat(parts[6]) * 1024; // 转换为MB
            memoryUsage.push(usage);
            memoryMatches++;
          }
        } catch (error) {
          console.warn("内存使用率解析错误:", line, error);
          continue;
        }
      }
    }
    if (memoryUsage.length === 0) {
      results.push(composeTextDataResult("无内存数据"));
      return results;
    }
    // 分析内存数据
    const data: MemoryUsageData[] = [];

    // 构建数据点
    for (let i = 0; i < Math.min(memoryUsage.length, timePoints.length); i++) {
      data.push({
        time: timePoints[i],
        usage: memoryUsage[i],
        timeStr: convertTimeToStr(timePoints[i]),
      });
    }

    // 统计信息
    const avgUsage =
      memoryUsage.length > 0 ? memoryUsage.reduce((a, b) => a + b, 0) / memoryUsage.length : 0;
    const maxUsage = memoryUsage.length > 0 ? Math.max(...memoryUsage) : 0;
    const minUsage = memoryUsage.length > 0 ? Math.min(...memoryUsage) : 0;

    const analysisResult: MemoryAnalysisResult = {
      data,
      avgUsage,
      maxUsage,
      minUsage,
      dataCount: memoryUsage.length,
    };

    // 数据验证和调试信息
    const debugInfo = {
      totalLines: lines.length,
      timeMatches,
      memoryMatches,
      timePointsFound: timePoints.length,
      hasData: timePoints.length > 0 && memoryUsage.length > 0,
      sampleLines: lines
        .filter((line) => line.includes("neodrive memory"))
        .slice(0, 3)
        .map((line) => line.substring(0, 120)),
    };

    // 生成ECharts配置
    const generateEChartsConfig = (): any => {
      if (data.length === 0) {
        return {
          title: {
            text: "无内存数据",
            left: "center",
            subtext: `解析了${lines.length}行，找到${timeMatches}个时间点，${memoryMatches}个内存数据`,
          },
          xAxis: { type: "category", data: [] },
          yAxis: { type: "value" },
          series: [],
        };
      }

      // 内存使用率数据
      const lineData = data.map((point) => [point.timeStr, point.usage.toFixed(2)]);

      // 生成x轴数据
      const allTimes = data.map((point) => point.timeStr);

      return {
        title: {
          text: "Neodrive内存使用率趋势图",
          left: "center",
          textStyle: { fontSize: 16, fontWeight: "bold" },
        },
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "cross",
            label: { backgroundColor: "#6a7985" },
          },
          formatter: function (params: any) {
            const param = params[0];
            return `时间: ${param.name}<br/>内存使用率: ${parseFloat(param.value[1]).toFixed(2)} MB`;
          },
        },
        grid: {
          left: "8%",
          right: "5%",
          bottom: "15%",
          top: "15%",
          containLabel: true,
        },
        xAxis: {
          type: "category",
          data: allTimes,
          axisLabel: {
            rotate: 45,
            fontSize: 10,
          },
          boundaryGap: false,
        },
        yAxis: {
          type: "value",
          name: "内存使用率 (MB)",
          min: 0,
          max: 29000,
          interval: 1000,
          axisLabel: {
            formatter: "{value} MB",
          },
          splitLine: {
            lineStyle: { type: "dashed" },
          },
        },
        series: [
          {
            name: "Neodrive内存使用率",
            type: "line",
            data: lineData,
            smooth: false,
            lineStyle: { width: 2, color: "#5cb85c" },
            symbol: "circle",
            symbolSize: 3,
            areaStyle: {
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  {
                    offset: 0,
                    color: "rgba(92, 184, 92, 0.3)",
                  },
                  {
                    offset: 1,
                    color: "rgba(92, 184, 92, 0.1)",
                  },
                ],
              },
            },
          },
        ],
        dataZoom: [
          {
            type: "slider",
            show: true,
            xAxisIndex: [0],
            start: 0,
            end: 100,
            height: 30,
          },
          {
            type: "inside",
            xAxisIndex: [0],
            start: 0,
            end: 100,
          },
        ],
      };
    };
    const summary: string = `
      平均使用率: ${avgUsage.toFixed(2)} MB, 最高使用率: ${maxUsage.toFixed(2)} MB, 最低使用率: ${minUsage.toFixed(2)} MB
    `;
    results.push(composeTextDataResult(summary));
    results.push(composeChartDataResult("neodrive进程内存使用率趋势图", generateEChartsConfig()));
    return results
  }
};

export default MemoryUsageAnalyzerPlugin.getInstance();
