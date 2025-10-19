import type { Plugin, PluginResult } from "@/types/plugin";

interface CameraFrameRate {
  time: string;
  sensor: string;
  frameRate1: number; // 发送到SD帧率
  frameRate2: number; // 发送到AD帧率
  timestamp: number;
}

interface TimeRange {
  begin: number;
  end: number;
}

const plugin: Plugin = {
  id: "camera-frame-rate-analysis",
  name: "相机帧率分析",
  description: "分析相机日志中的传感器帧率数据并生成可视化图表",
  async process(content: string): Promise<PluginResult | PluginResult[]> {
    try {
      const lines = content.split("\n").filter((line) => line.trim());

      if (lines.length === 0) {
        return {
          type: "html",
          summary: "❌ 未找到有效的日志数据",
          html: '<div class="no-data">请提供包含相机帧率数据的日志文件</div>',
        };
      }

      // 解析时间范围
      const timeRange = parseTimeRange(lines);
      if (!timeRange) {
        return {
          type: "html",
          summary: "❌ 无法解析日志时间范围",
          html: '<div class="error">日志格式不正确，无法解析时间信息</div>',
        };
      }

      // 解析相机帧率数据
      const frameRateData = parseCameraFrameRates(lines);
      if (frameRateData.length === 0) {
        return {
          type: "html",
          summary: "❌ 未找到相机帧率数据",
          html: '<div class="no-data">日志中未找到相机帧率相关信息</div>',
        };
      }

      // 生成分析结果
      const results = generateAnalysis(frameRateData, timeRange);

      return results;
    } catch (error) {
      console.error("相机帧率分析出错:", error);
      return {
        type: "html",
        summary: "❌ 分析过程中出现错误",
        html: `<div class="error">错误: ${error instanceof Error ? error.message : String(error)}</div>`,
      };
    }
  },
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
  // 解析时间字符串，如 "08:49:12.495646"
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

function parseCameraFrameRates(lines: string[]): CameraFrameRate[] {
  const frameRateData: CameraFrameRate[] = [];

  // 匹配帧率日志的正则表达式
  // 例如: Sensor0_Out0  Frame rate (fps):  10.00  10.00
  const frameRateRegex =
    /(\d{2}:\d{2}:\d{2}\.\d{6}).*?(Sensor\d+_Out\d+)\s+Frame rate \(fps\):\s+([\d\.]+)\s+([\d\.]+)/;

  for (const line of lines) {
    const match = line.match(frameRateRegex);
    if (!match) continue;

    const [, timeStr, sensor, frameRate1Str, frameRate2Str] = match;
    const frameRate1 = parseFloat(frameRate1Str);
    const frameRate2 = parseFloat(frameRate2Str);

    if (isNaN(frameRate1) || isNaN(frameRate2)) continue;

    frameRateData.push({
      time: timeStr,
      sensor,
      frameRate1,
      frameRate2,
      timestamp: timeStringToTimestamp(timeStr),
    });
  }

  return frameRateData;
}

function generateAnalysis(frameRateData: CameraFrameRate[], timeRange: TimeRange): PluginResult[] {
  const results: PluginResult[] = [];

  // 生成第一列帧率图表
  results.push(analyzeFrameRate1(frameRateData, timeRange));

  // 生成第二列帧率图表
  results.push(analyzeFrameRate2(frameRateData, timeRange));

  return results;
}

function analyzeFrameRate1(frameRateData: CameraFrameRate[], timeRange: TimeRange): PluginResult {
  // 按传感器分组数据
  const sensorGroups = new Map<
    string,
    Array<{ timestamp: number; frameRate: number; time: string }>
  >();

  for (const data of frameRateData) {
    if (!sensorGroups.has(data.sensor)) {
      sensorGroups.set(data.sensor, []);
    }
    const group = sensorGroups.get(data.sensor);
    if (group) {
      group.push({
        timestamp: data.timestamp,
        frameRate: data.frameRate1,
        time: data.time,
      });
    }
  }

  // 生成图表数据
  const series: any[] = [];
  const sensors = Array.from(sensorGroups.keys()).sort();

  for (const sensor of sensors) {
    const data = sensorGroups.get(sensor);
    if (data) {
      series.push({
        name: sensor,
        type: "line",
        data: data.map((item) => [item.timestamp, item.frameRate, item.time]),
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        lineWidth: 2,
      });
    }
  }

  const option = {
    title: {
      text: "相机服务帧率分析 (发送到SD)",
      left: "center",
      textStyle: {
        fontSize: 16,
        fontWeight: "bold",
      },
    },
    tooltip: {
      trigger: "axis",
      formatter: function (params: any) {
        let result = `<div style="margin-bottom: 8px;"><strong>时间: ${params[0].data[2]}</strong></div>`;
        params.forEach((param: any) => {
          const color = param.color;
          const sensor = param.seriesName;
          const frameRate = param.data[1];
          result += `<div style="display: flex; align-items: center; margin: 4px 0;">
            <span style="display: inline-block; width: 12px; height: 12px; background: ${color}; margin-right: 8px; border-radius: 2px;"></span>
            <span style="font-weight: bold;">${sensor}:</span>
            <span style="margin-left: 8px;">${frameRate.toFixed(2)} fps</span>
          </div>`;
        });
        return result;
      },
    },
    legend: {
      data: sensors,
      top: 30,
      type: "scroll",
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      top: "15%",
      containLabel: true,
    },
    xAxis: {
      type: "time",
      min: secondsToTimestamp(timeRange.begin),
      max: secondsToTimestamp(timeRange.end),
      axisLabel: {
        formatter: function (value: number) {
          const date = new Date(value);
          return date.toLocaleTimeString("zh-CN", { hour12: false });
        },
      },
    },
    yAxis: {
      type: "value",
      name: "帧率 (fps)",
      min: 0,
      axisLabel: {
        formatter: "{value} fps",
      },
    },
    series,
    dataZoom: [
      { type: "slider", xAxisIndex: 0, start: 0, end: 100, height: 20, bottom: 10 },
      { type: "inside", xAxisIndex: 0 },
    ],
  };

  return {
    type: "mixed",
    summary: `📊 相机服务帧率分析 (发送到SD) - 共${frameRateData.length}个数据点，${sensors.length}个传感器`,
    html: `
      <div class="analysis-summary">
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">数据点数量:</span>
            <span class="stat-value">${frameRateData.length}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">传感器数量:</span>
            <span class="stat-value">${sensors.length}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">时间范围:</span>
            <span class="stat-value">${formatTimeFromSeconds(timeRange.begin)} - ${formatTimeFromSeconds(timeRange.end)}</span>
          </div>
        </div>
      </div>
    `,
    chart: {
      type: "echarts",
      option: option,
    },
  };
}

function analyzeFrameRate2(frameRateData: CameraFrameRate[], timeRange: TimeRange): PluginResult {
  // 按传感器分组数据
  const sensorGroups = new Map<
    string,
    Array<{ timestamp: number; frameRate: number; time: string }>
  >();

  for (const data of frameRateData) {
    if (!sensorGroups.has(data.sensor)) {
      sensorGroups.set(data.sensor, []);
    }
    const group = sensorGroups.get(data.sensor);
    if (group) {
      group.push({
        timestamp: data.timestamp,
        frameRate: data.frameRate2,
        time: data.time,
      });
    }
  }

  // 生成图表数据
  const series: any[] = [];
  const sensors = Array.from(sensorGroups.keys()).sort();

  for (const sensor of sensors) {
    const data = sensorGroups.get(sensor);
    if (data) {
      series.push({
        name: sensor,
        type: "line",
        data: data.map((item) => [item.timestamp, item.frameRate, item.time]),
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        lineWidth: 2,
      });
    }
  }

  const option = {
    title: {
      text: "相机服务帧率分析 (发送到AD)",
      left: "center",
      textStyle: {
        fontSize: 16,
        fontWeight: "bold",
      },
    },
    tooltip: {
      trigger: "axis",
      formatter: function (params: any) {
        let result = `<div style="margin-bottom: 8px;"><strong>时间: ${params[0].data[2]}</strong></div>`;
        params.forEach((param: any) => {
          const color = param.color;
          const sensor = param.seriesName;
          const frameRate = param.data[1];
          result += `<div style="display: flex; align-items: center; margin: 4px 0;">
            <span style="display: inline-block; width: 12px; height: 12px; background: ${color}; margin-right: 8px; border-radius: 2px;"></span>
            <span style="font-weight: bold;">${sensor}:</span>
            <span style="margin-left: 8px;">${frameRate.toFixed(2)} fps</span>
          </div>`;
        });
        return result;
      },
    },
    legend: {
      data: sensors,
      top: 30,
      type: "scroll",
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      top: "15%",
      containLabel: true,
    },
    xAxis: {
      type: "time",
      min: secondsToTimestamp(timeRange.begin),
      max: secondsToTimestamp(timeRange.end),
      axisLabel: {
        formatter: function (value: number) {
          const date = new Date(value);
          return date.toLocaleTimeString("zh-CN", { hour12: false });
        },
      },
    },
    yAxis: {
      type: "value",
      name: "帧率 (fps)",
      min: 0,
      axisLabel: {
        formatter: "{value} fps",
      },
    },
    series,
    dataZoom: [
      { type: "slider", xAxisIndex: 0, start: 0, end: 100, height: 20, bottom: 10 },
      { type: "inside", xAxisIndex: 0 },
    ],
  };

  return {
    type: "mixed",
    summary: `📊 相机服务帧率分析 (发送到AD) - 共${frameRateData.length}个数据点，${sensors.length}个传感器`,
    html: `
      <div class="analysis-summary">
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">数据点数量:</span>
            <span class="stat-value">${frameRateData.length}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">传感器数量:</span>
            <span class="stat-value">${sensors.length}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">时间范围:</span>
            <span class="stat-value">${formatTimeFromSeconds(timeRange.begin)} - ${formatTimeFromSeconds(timeRange.end)}</span>
          </div>
        </div>
      </div>
    `,
    chart: {
      type: "echarts",
      option: option,
    },
  };
}

function formatTimeFromSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default plugin;
