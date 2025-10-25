export type BlockType = "text" | "log" | "image" | "chart"
export interface TextData {
  text: string;
}
export interface LogItem {
   line: number; text: string 
}
export interface LogData {
  logs: LogItem[];
}
export interface ChartData {
  title: string;
  option: any;
  data?: any;
}
export type PluginData = TextData | LogData | ChartData
export interface AnalysisPluginResults {
  type:BlockType;
  data:PluginData;
}
export interface IAnalysisPlugin {
  id: string;
  name: string;
  description: string;
  process: (
    fileName:string,
    content: string,
  ) => Promise<AnalysisPluginResults[]>;
}
export const composeTextDataResult = (text: string): AnalysisPluginResults => ({
  type: "text",
  data: { text },
})
export const composeLogDataResult = (logs: LogData): AnalysisPluginResults => ({
  type: "log",
  data: logs,
})
export const composeChartDataResult = (description:string,option: any): AnalysisPluginResults => ({
  type: "chart",
  data: { description, option },
})


export interface ChartConfig {
  type: "echarts";
  option: any;
  data?: any;
}
export interface PluginResult {
  type: "html" | "chart" | "mixed" | "text" | "image" | "log";
  html?: string;
  chart?: ChartConfig;
  summary?: string;
  data?: any;
}

export interface PluginContext {
  fileName?: string;
}

export interface Plugin {
  id: string;
  name: string;
  description: string;
  process: (
    content: string,
    context?: PluginContext
  ) => Promise<string | PluginResult | PluginResult[]>;
}

export interface PluginAction {
  id: string;
  label: string;
  contextMenuGroupId: string;
  contextMenuOrder: number;
  run: () => Promise<void>;
}

export interface EditorInstance {
  addAction: (action: any) => void;
  getModel: () => any;
  getValue: () => string;
  getSelection: () => any;
}

export interface PluginConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  filePath: string;
}
