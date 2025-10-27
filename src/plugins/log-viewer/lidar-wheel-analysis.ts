import type { TextData, ChartData, LogData, BlockType, LogItem, AnalysisPluginResult, } from "@/types/plugin";
import { IAnalysisPlugin, composeTextDataResult, composeChartDataResult } from "@/types/plugin";

interface LogCategory {
  lidarFps: string[];
  lidarNanRatio: string[];
  dynamicMapLoad: string[];
  wheelSpeed: string[];
  lidarPacket: string[];
}

interface TimeRange {
  begin: number;
  end: number;
}

interface WheelSpeed {
  time: string;
  fl: number;
  fr: number;
  rl: number;
  rr: number;
  measurement_time: number;
}
class LidarWheelAnalysisPlugin extends IAnalysisPlugin {
  private constructor() {
    super("lidar-wheel-analysis", "雷达轮速分析", "分析雷达轮速相关的日志数据并生成可视化图表");
  }
  async process(fileName: string, content: string): Promise<AnalysisPluginResult[]> {
    const results: AnalysisPluginResult[] = [];

    const lines = content.split("\n").filter((line) => line.trim() !== "");
    if (lines.length === 0) {
      results.push(composeTextDataResult("❌ 未找到有效的日志数据,请提供包含GNSS、雷达或轮速数据的日志文件"));
      return results;
    }

    // 解析时间范围
    const timeRange = parseTimeRange(lines);
    if (!timeRange) {
      results.push(composeTextDataResult("❌ 无法解析日志时间范围,日志格式不正确，无法解析时间信息"));
      return results;
    }

    // 分类日志
    const categorizedLogs = categorizeLogs(lines);
    // 雷达FPS分析
    if (categorizedLogs.lidarFps.length > 0) {
      results.push(...analyzeLidarFps(categorizedLogs.lidarFps, timeRange));
    }

    // 轮速分析
    if (categorizedLogs.wheelSpeed.length > 0) {
      results.push(analyzeWheelSpeed(categorizedLogs.wheelSpeed, timeRange));
    }
    return results;
  }
};

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

// 将秒数转换为时间戳（毫秒）
function secondsToTimestamp(seconds: number): number {
  const today = new Date();
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  today.setHours(hours, minutes, secs, 0);
  return today.getTime();
}

function categorizeLogs(lines: string[]): LogCategory {
  const categories: LogCategory = {
    lidarFps: [],
    lidarNanRatio: [],
    dynamicMapLoad: [],
    wheelSpeed: [],
    lidarPacket: [],
  };

  for (const line of lines) {
    if (line.includes("publisher") && line.includes("pointsize")) {
      categories.lidarFps.push(line);
      categories.lidarNanRatio.push(line);
    } else if (line.includes("LoadDynamicMap______________________________")) {
      categories.dynamicMapLoad.push(line);
    } else if (line.includes("wheel_speed")) {
      categories.wheelSpeed.push(line);
    } else if (line.includes("packet receive:")) {
      categories.lidarPacket.push(line);
    }
  }
  return categories;
}

function analyzeLidarFps(lines: string[], timeRange: TimeRange): AnalysisPluginResult[] {
  const lidarData: Array<{
    systemTime: string;
    lidarIndex: number;
    systemTimestamp: number;
    pointcloudTimestamp: number;
    pointSize: number;
    nanRatio: number;
    timeDiff: number; // 时间戳差值，单位：ms
  }> = [];
  const results: AnalysisPluginResult[] = [];
  // 更精确的正则表达式来匹配完整的日志格式
  const logRegex =
    /(\d{2}:\d{2}:\d{2}\.\d{6}).*?publish (\d+) pointcloud.*?system time is ([\d\.]+).*?timestamp is ([\d\.]+).*?pointsize is (\d+).*?nan ratio is ([\d\.]+)/;

  for (const line of lines) {
    const match = line.match(logRegex);
    if (!match) continue;

    const systemTime = match[1];
    const lidarIndex = parseInt(match[2]);
    const systemTimestamp = parseFloat(match[3]);
    const pointcloudTimestamp = parseFloat(match[4]);
    const pointSize = parseInt(match[5]);
    const nanRatio = parseFloat(match[6]);

    // 计算时间戳差值，转换为毫秒
    const timeDiff = (systemTimestamp - pointcloudTimestamp) * 1000;

    lidarData.push({
      systemTime,
      lidarIndex,
      systemTimestamp,
      pointcloudTimestamp,
      pointSize,
      nanRatio,
      timeDiff,
    });
  }

  if (lidarData.length === 0) {
    results.push(composeTextDataResult(
      '📡 雷达数据分析：未找到匹配的日志行</div>',
    ));
    return results;
  }

  // 按lidar编号分组数据
  const lidarGroups = new Map<number, typeof lidarData>();
  lidarData.forEach((data) => {
    if (!lidarGroups.has(data.lidarIndex)) {
      lidarGroups.set(data.lidarIndex, []);
    }
    const group = lidarGroups.get(data.lidarIndex);
    if (group) {
      group.push(data);
    }
  });

  // 第一个图表：点云数和NAN比例（按lidar编号分类）
  const pointSizeSeries: any[] = [];
  const nanRatioSeries: any[] = [];
  const colors = [
    "#FF6B6B", // 红色
    "#4ECDC4", // 青色
    "#45B7D1", // 蓝色
    "#F9CA24", // 黄色
    "#9B59B6", // 紫色
    "#E74C3C", // 深红色
    "#2ECC71", // 绿色
    "#E67E22", // 橙色
    "#3498DB", // 天蓝色
    "#8E44AD", // 深紫色
  ];

  lidarGroups.forEach((data, lidarIndex) => {
    const color = colors[lidarIndex % colors.length];

    // 将所有数据点直接使用，以系统时间为x轴，转换为时间戳，但保留原始时间字符串
    const pointSizeData = data.map((d) => ({
      value: [timeStringToTimestamp(d.systemTime), d.pointSize],
      originalTime: d.systemTime,
      lidarIndex: d.lidarIndex,
    }));
    const nanRatioData = data.map((d) => ({
      value: [timeStringToTimestamp(d.systemTime), d.nanRatio],
      originalTime: d.systemTime,
      lidarIndex: d.lidarIndex,
    }));

    pointSizeSeries.push({
      name: `Lidar ${lidarIndex} 点云数`,
      type: "scatter",
      data: pointSizeData,
      itemStyle: { color },
      symbol: "circle",
      symbolSize: 6,
    });

    nanRatioSeries.push({
      name: `Lidar ${lidarIndex} NAN比例`,
      type: "scatter",
      yAxisIndex: 1,
      data: nanRatioData,
      itemStyle: { color },
      symbol: "triangle",
      symbolSize: 6,
    });
  });

  const chart1Option = {
    title: {
      text: "雷达点云数和NAN比例分析",
      left: "center",
      textStyle: { fontSize: 14, fontWeight: "bold" },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "cross" },
      formatter: (params: any) => {
        // 获取第一个有效数据点的原始时间
        let originalTime = "";
        for (const p of params) {
          if (p.data && p.data.originalTime) {
            originalTime = p.data.originalTime;
            break;
          }
        }
        let res = `<div style="font-weight: bold; margin-bottom: 5px;">🕒 系统时间: ${originalTime}</div>`;
        params.forEach((p: any) => {
          if (p.value && p.value.length >= 2) {
            const unit = p.seriesName.includes("点云数") ? " 个点" : "";
            const value = p.seriesName.includes("NAN比例")
              ? (p.value[1] * 100).toFixed(4) + "%"
              : p.value[1];
            res += `<div style="margin: 2px 0;">`;
            res += `<span style="display: inline-block; width: 10px; height: 10px; background-color: ${p.color}; margin-right: 5px; border-radius: 50%;"></span>`;
            res += `${p.seriesName}: <span style="font-weight: bold;">${value}${unit}</span>`;
            res += `</div>`;
          }
        });
        return res;
      },
    },
    legend: {
      data: [...pointSizeSeries.map((s) => s.name), ...nanRatioSeries.map((s) => s.name)],
      top: 30,
      textStyle: { fontSize: 11 },
    },
    grid: { left: "8%", right: "8%", bottom: "20%", top: "15%", containLabel: true },
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
      min: secondsToTimestamp(timeRange.begin),
      max: secondsToTimestamp(timeRange.end),
    },
    yAxis: [
      {
        type: "value",
        name: "点云数",
        position: "left",
        axisLabel: { formatter: "{value}" },
        splitLine: { lineStyle: { type: "dashed" } },
      },
      {
        type: "value",
        name: "NAN比例",
        position: "right",
        axisLabel: { formatter: (v: number) => (v * 100).toFixed(2) + "%" },
        splitLine: { show: false },
      },
    ],
    series: [...pointSizeSeries, ...nanRatioSeries],
    dataZoom: [
      { type: "slider", xAxisIndex: 0, start: 0, end: 100, height: 20, bottom: 10 },
      { type: "inside", xAxisIndex: 0 },
    ],
  };

  results.push(composeChartDataResult("雷达点云数和NAN比例分析", chart1Option));

  // 第二个图表：时间戳差值分析
  const timeDiffSeries: any[] = [];

  // 按lidar分组创建不同颜色的系列
  lidarGroups.forEach((data, lidarIndex) => {
    const color = colors[lidarIndex % colors.length];
    const timeDiffData = data.map((d) => {
      return {
        value: [timeStringToTimestamp(d.systemTime), Math.round(d.timeDiff * 1000) / 1000], // [时间戳, 时间差值]
        originalTime: d.systemTime,
        systemTimestamp: d.systemTimestamp,
        pointcloudTimestamp: d.pointcloudTimestamp,
        lidarIndex: d.lidarIndex,
      };
    });

    timeDiffSeries.push({
      name: `Lidar ${lidarIndex} 时间差值`,
      type: "scatter",
      data: timeDiffData,
      itemStyle: {
        color,
        borderColor: "#ffffff",
        borderWidth: 1,
      },
      symbol: "circle",
      symbolSize: 8,
    });
  });

  const chart2Option = {
    title: {
      text: "系统时间戳与点云时间戳差值分析",
      left: "center",
      textStyle: { fontSize: 14, fontWeight: "bold" },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "cross", animation: false },
      formatter: function (params: any) {
        // 获取第一个有效数据点的原始时间
        let originalTime = "";
        for (const p of params) {
          if (p.data && p.data.originalTime) {
            originalTime = p.data.originalTime;
            break;
          }
        }
        let res = `<div style="font-weight: bold; color: #333; margin-bottom: 8px; padding: 4px 0; border-bottom: 1px solid #eee;">🕒 系统时间: ${originalTime}</div>`;

        params.forEach((p: any) => {
          if (p.value && p.data) {
            const data = p.data;
            res += `<div style="margin: 8px 0; padding: 4px; background-color: rgba(0,0,0,0.05); border-radius: 4px;">`;
            res += `<div style="font-weight: bold; color: ${p.color}; margin-bottom: 4px;">`;
            res += `<span style="display: inline-block; width: 10px; height: 10px; background-color: ${p.color}; margin-right: 5px; border-radius: 50%; border: 1px solid #fff;"></span>`;
            res += `📡 Lidar ${data.lidarIndex}</div>`;
            res += `<div style="margin: 4px 0; font-size: 12px; padding-left: 15px;">📊 系统时间戳: ${data.systemTimestamp.toFixed(6)}</div>`;
            res += `<div style="margin: 4px 0; font-size: 12px; padding-left: 15px;">📊 点云时间戳: ${data.pointcloudTimestamp.toFixed(6)}</div>`;
            res += `<div style="margin: 4px 0; font-weight: bold; padding-left: 15px;">⏱️ 时间差值: ${data.value[1]} ms</div>`;
            res += `</div>`;
          }
        });

        return res;
      },
    },
    legend: {
      data: timeDiffSeries.map((s) => s.name),
      top: 30,
      textStyle: { fontSize: 11 },
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
      min: secondsToTimestamp(timeRange.begin),
      max: secondsToTimestamp(timeRange.end),
    },
    yAxis: {
      type: "value",
      name: "时间差值 (ms)",
      axisLabel: { formatter: "{value} ms" },
      splitLine: { lineStyle: { type: "dashed" } },
    },
    series: timeDiffSeries,
    dataZoom: [
      { type: "slider", xAxisIndex: 0, start: 0, end: 100, height: 20, bottom: 10 },
      { type: "inside", xAxisIndex: 0 },
    ],
  };
  results.push(composeChartDataResult("时间戳差值分析", chart2Option));
  return results;
}

function analyzeWheelSpeed(lines: string[], timeRange: TimeRange): AnalysisPluginResult {
  const wheelSpeedData: WheelSpeed[] = [];

  for (const line of lines) {
    if (line.includes("wheel_speed")) {
      // 尝试提取更精确的时间戳（包含毫秒）
      let timeMatch = line.match(/(\d{2}:\d{2}:\d{2}\.\d{6})/);
      if (!timeMatch) continue;

      const time = timeMatch[1];
      const fields = line.split(" ").filter((f) => f.trim());
      if (fields.length >= 6) {
        try {
          const fl = parseFloat(fields[fields.length - 5]);
          const fr = parseFloat(fields[fields.length - 4]);
          const rl = parseFloat(fields[fields.length - 3]);
          const rr = parseFloat(fields[fields.length - 2]);
          const measurementTime = parseFloat(fields[fields.length - 1]);
          wheelSpeedData.push({
            time: time,
            fl: fl,
            fr: fr,
            rl: rl,
            rr: rr,
            measurement_time: measurementTime,
          });
        } catch {
          // 解析失败，跳过
        }
      }
    }
  }

  if (wheelSpeedData.length === 0) {
    return composeTextDataResult(
      `轮速数据分析:未找到轮速数据`,
    );
  }

  // 直接使用所有数据点，以时间为x轴值，转换为时间戳，但保留原始时间字符串
  const flData = wheelSpeedData.map((d) => ({
    value: [timeStringToTimestamp(d.time), Math.round(d.fl * 100) / 100],
    originalTime: d.time,
  }));
  const frData = wheelSpeedData.map((d) => ({
    value: [timeStringToTimestamp(d.time), Math.round(d.fr * 100) / 100],
    originalTime: d.time,
  }));
  const rlData = wheelSpeedData.map((d) => ({
    value: [timeStringToTimestamp(d.time), Math.round(d.rl * 100) / 100],
    originalTime: d.time,
  }));
  const rrData = wheelSpeedData.map((d) => ({
    value: [timeStringToTimestamp(d.time), Math.round(d.rr * 100) / 100],
    originalTime: d.time,
  }));

  // 生成轮速图表
  const chartOption = {
    title: {
      text: "轮速数据时序图",
      left: "center",
      textStyle: {
        fontSize: 14,
        fontWeight: "bold",
      },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
        animation: false,
      },
      formatter: function (params: any) {
        // 获取第一个有效数据点的原始时间
        let originalTime = "";
        for (const param of params) {
          if (param.data && param.data.originalTime) {
            originalTime = param.data.originalTime;
            break;
          }
        }
        let result = "时间: " + originalTime + "<br/>";
        params.forEach((param: any) => {
          if (param.value && param.value.length >= 2) {
            result += param.seriesName + ": " + param.value[1] + " m/s<br/>";
          }
        });
        return result;
      },
    },
    legend: {
      data: ["前左轮", "前右轮", "后左轮", "后右轮"],
      top: 20,
      textStyle: {
        fontSize: 11,
      },
    },
    grid: {
      left: "8%",
      right: "4%",
      bottom: "20%",
      top: "15%",
      containLabel: true,
    },
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
      axisTick: {
        alignWithLabel: true,
      },
      min: secondsToTimestamp(timeRange.begin),
      max: secondsToTimestamp(timeRange.end),
    },
    yAxis: {
      type: "value",
      name: "轮速 (m/s)",
      axisLabel: {
        fontSize: 10,
        formatter: "{value}",
      },
      splitLine: {
        lineStyle: {
          type: "dashed",
        },
      },
    },
    series: [
      {
        name: "前左轮",
        type: "scatter",
        data: flData,
        lineStyle: {
          color: "#FF6B6B",
          width: 2,
        },
        itemStyle: {
          color: "#FF6B6B",
        },
        symbol: "circle",
        symbolSize: 3,
        smooth: false,
        connectNulls: false,
      },
      {
        name: "前右轮",
        type: "scatter",
        data: frData,
        lineStyle: {
          color: "#4ECDC4",
          width: 2,
        },
        itemStyle: {
          color: "#4ECDC4",
        },
        symbol: "circle",
        symbolSize: 3,
        smooth: false,
        connectNulls: false,
      },
      {
        name: "后左轮",
        type: "scatter",
        data: rlData,
        lineStyle: {
          color: "#45B7D1",
          width: 2,
        },
        itemStyle: {
          color: "#45B7D1",
        },
        symbol: "circle",
        symbolSize: 3,
        smooth: false,
        connectNulls: false,
      },
      {
        name: "后右轮",
        type: "scatter",
        data: rrData,
        lineStyle: {
          color: "#F9CA24",
          width: 2,
        },
        itemStyle: {
          color: "#F9CA24",
        },
        symbol: "circle",
        symbolSize: 3,
        smooth: false,
        connectNulls: false,
      },
    ],
    dataZoom: [
      {
        type: "slider",
        xAxisIndex: 0,
        filterMode: "none",
        start: 0,
        end: 100,
        height: 20,
        bottom: 10,
      },
      {
        type: "inside",
        xAxisIndex: 0,
        filterMode: "none",
      },
    ],
  };
  return composeChartDataResult("轮速数据分析",chartOption);
}


// 添加辅助函数：将秒数转换为时分秒字符串
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

export default LidarWheelAnalysisPlugin.getInstance();
