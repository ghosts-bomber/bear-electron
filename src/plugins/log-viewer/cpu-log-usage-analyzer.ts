import type { Plugin, PluginResult } from "@/types/plugin";

interface CpuLogPoint {
  time: string; // 08:31:30.9
  timestamp: number;
  cpuId: number;
  use: number;
  iowait: number;
  system: number;
  user: number;
  softirq: number;
  irq: number;
  lowni: number;
  idle: number;
  iowaitRatio: number;
}

const plugin: Plugin = {
  id: "cpu-log-usage-analyzer",
  name: "CPU使用率分析",
  description: "解析resource monitor日志，绘制cpu使用率和iowait折线图",
  async process(content: string): Promise<PluginResult | PluginResult[]> {
    const lines = content.split("\n").filter((l) => l.trim());
    const cpuPoints: CpuLogPoint[] = [];
    let group: string[] = [];
    for (const line of lines) {
      if (/cpu \d+ use is/.test(line)) {
        group.push(line);
        if (group.length === 12) {
          // 取时间戳（第一行）
          const timeMatch = group[0].match(/\d{2}:\d{2}:\d{2}\.\d+/);
          const time = timeMatch ? timeMatch[0] : "";
          const timestamp = timeStringToTimestamp(time);
          for (let i = 0; i < 12; i++) {
            const cpuLine = group[i];
            const cpuIdMatch = cpuLine.match(/cpu (\d+)/);
            const cpuId = cpuIdMatch ? parseInt(cpuIdMatch[1]) : i;
            const useMatch = cpuLine.match(/use is ?: ([\d\.eE+-]+)/);
            const use = useMatch ? parseFloat(useMatch[1]) : 0;
            const system = getField(cpuLine, "system");
            const user = getField(cpuLine, "user");
            const softirq = getField(cpuLine, "softirq");
            const irq = getField(cpuLine, "irq");
            const lowni = getField(cpuLine, "lowni");
            const iowait = getField(cpuLine, "iowait");
            const idle = getField(cpuLine, "idle");
            const sum = system + user + softirq + irq + lowni + iowait + idle;
            const iowaitRatio = sum > 0 ? iowait / sum : 0;
            cpuPoints.push({
              time,
              timestamp,
              cpuId,
              use,
              iowait,
              system,
              user,
              softirq,
              irq,
              lowni,
              idle,
              iowaitRatio,
            });
          }
          group = [];
        }
      }
    }
    // 按时间分组
    const timeGroups = new Map<string, CpuLogPoint[]>();
    for (const point of cpuPoints) {
      if (!timeGroups.has(point.time)) timeGroups.set(point.time, []);
      timeGroups.get(point.time)?.push(point);
    }
    const times = Array.from(timeGroups.keys()).sort();
    // 生成 use is 图表数据
    const useCharts: PluginResult[] = [];
    for (let cpuId = 0; cpuId < 12; cpuId++) {
      const series = [
        {
          name: `CPU ${cpuId}`,
          type: "line",
          data: times
            .map((t) => {
              const pt = timeGroups.get(t)?.find((p) => p.cpuId === cpuId);
              return pt ? [pt.timestamp, pt.use, pt.time] : null;
            })
            .filter(Boolean),
          symbol: "circle",
          symbolSize: 5,
          showSymbol: false,
          smooth: false,
        },
      ];
      const option = {
        title: { text: `CPU ${cpuId} 使用率趋势`, left: "center" },
        tooltip: {
          trigger: "axis",
          formatter(params: any) {
            let html = `<div><b>时间: ${params[0].data[2]}</b></div>`;
            for (const p of params) {
              html += `<div><span style='display:inline-block;width:10px;height:10px;background:${p.color};margin-right:4px;'></span>${p.seriesName}: ${p.data[1]}</div>`;
            }
            return html;
          },
        },
        legend: { data: [`CPU ${cpuId}`], top: 30 },
        grid: { left: "5%", right: "5%", bottom: "10%", top: "15%", containLabel: true },
        xAxis: {
          type: "time",
          min: times.length ? timeGroups.get(times[0])?.[0].timestamp : undefined,
          max: times.length ? timeGroups.get(times[times.length - 1])?.[0].timestamp : undefined,
          axisLabel: {
            formatter(value: number) {
              const d = new Date(value);
              return d.toLocaleTimeString("zh-CN", { hour12: false });
            },
          },
        },
        yAxis: { type: "value", name: "use is", min: 0 },
        series,
        dataZoom: [
          { type: "slider", xAxisIndex: 0, start: 0, end: 100, height: 20, bottom: 10 },
          { type: "inside", xAxisIndex: 0 },
        ],
      };
      useCharts.push({
        type: "mixed",
        summary: `📊 CPU ${cpuId} use is 使用率趋势 - ${times.length} 个时间点`,
        html: `<div class='analysis-summary'>CPU ${cpuId}，共${times.length}个时间点，${series[0].data.length}条数据</div>`,
        chart: { type: "echarts", option },
      });
    }
    // 生成 iowait 比值图表数据
    const iowaitSeries = [];
    for (let cpuId = 0; cpuId < 12; cpuId++) {
      iowaitSeries.push({
        name: `CPU ${cpuId}`,
        type: "line",
        data: times
          .map((t) => {
            const pt = timeGroups.get(t)?.find((p) => p.cpuId === cpuId);
            return pt ? [pt.timestamp, pt.iowaitRatio, pt.time] : null;
          })
          .filter(Boolean),
        symbol: "circle",
        symbolSize: 5,
        showSymbol: false,
        smooth: false,
      });
    }
    // ECharts 配置
    const iowaitOption = {
      title: { text: "CPU iowait 趋势", left: "center" },
      tooltip: {
        trigger: "axis",
        formatter(params: any) {
          let html = `<div><b>时间: ${params[0].data[2]}</b></div>`;
          for (const p of params) {
            html += `<div><span style='display:inline-block;width:10px;height:10px;background:${p.color};margin-right:4px;'></span>${p.seriesName}: ${(p.data[1] * 100).toFixed(2)}%</div>`;
          }
          return html;
        },
      },
      legend: { data: iowaitSeries.map((s) => s.name), top: 30, type: "scroll" },
      grid: { left: "5%", right: "5%", bottom: "10%", top: "15%", containLabel: true },
      xAxis: {
        type: "time",
        min: times.length ? timeGroups.get(times[0])?.[0].timestamp : undefined,
        max: times.length ? timeGroups.get(times[times.length - 1])?.[0].timestamp : undefined,
        axisLabel: {
          formatter(value: number) {
            const d = new Date(value);
            return d.toLocaleTimeString("zh-CN", { hour12: false });
          },
        },
      },
      yAxis: {
        type: "value",
        name: "iowait比值",
        min: 0,
        max: 1,
        axisLabel: { formatter: (v: number) => (v * 100).toFixed(1) + "%" },
      },
      series: iowaitSeries,
      dataZoom: [
        { type: "slider", xAxisIndex: 0, start: 0, end: 100, height: 20, bottom: 10 },
        { type: "inside", xAxisIndex: 0 },
      ],
    };
    return [
      ...useCharts,
      {
        type: "mixed",
        summary: `📊 CPU iowait比值趋势 - ${times.length} 个时间点`,
        html: `<div class='analysis-summary'>共${times.length}个时间点，${cpuPoints.length}条数据</div>`,
        chart: { type: "echarts", option: iowaitOption },
      },
    ];
  },
};

function getField(line: string, key: string): number {
  const reg = new RegExp(key + " ?: ([\\d.eE+-]+)");
  const m = line.match(reg);
  return m ? parseFloat(m[1]) : 0;
}

function timeStringToTimestamp(time: string): number {
  // 08:31:30.940151 => 今天的日期+时间
  const [h, m, s] = time.split(":");
  const [sec, ms = "0"] = s.split(".");
  const now = new Date();
  now.setHours(Number(h), Number(m), Number(sec), Number(ms.slice(0, 3)));
  return now.getTime();
}

export default plugin;
