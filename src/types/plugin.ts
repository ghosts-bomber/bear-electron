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
export abstract class IAnalysisPlugin {
  readonly id: string;
  readonly name: string;
  readonly description: string;

  protected constructor(id: string, name: string, description: string) {
    this.id = id;
    this.name = name;
    this.description = description;
  }

  abstract process(
    fileName: string,
    content: string,
  ): Promise<AnalysisPluginResults[]>;

  // 基类维护所有子类的单例实例，按构造函数区分
  private static _instances = new WeakMap<Function, IAnalysisPlugin>();

  // 通过构造函数获取/创建对应的单例实例
  static getInstance<T extends IAnalysisPlugin>(
    this: Function,
    ...args: any[]
  ): T {
    const ctor = this as unknown as new (...args: any[]) => T;
    let instance = IAnalysisPlugin._instances.get(ctor) as T | undefined;
    if (!instance) {
      instance = new ctor(...args);
      IAnalysisPlugin._instances.set(ctor, instance as unknown as IAnalysisPlugin);
    }
    return instance!;
  }
}

export const composeTextDataResult = (text: string): AnalysisPluginResults => ({
  type: "text",
  data: { text },
})
export const composeLogDataResult = (logs: LogItem[]): AnalysisPluginResults => ({
  type: "log",
  data: { logs },
})
export const composeChartDataResult = (title:string,option: any): AnalysisPluginResults => ({
  type: "chart",
  data: { title, option },
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
