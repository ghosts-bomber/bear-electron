export enum BlockType {
  TEXT = 0,
  LOG = 1,
  IMAGE = 2,
  CHART = 3,
  SUMMARY = 4,
}
export enum CheckResultType{
  UNCERTAIN = 0,
  DETECTED = 1,
  UNDETECTED = 2,
}
export enum AnalysisType {
  DOWN_GRADE = 1,
  JUMP_STANDBY = 2,
  AD_LIGHT = 3,
}

export const AnalysisTypeMap = {
  [AnalysisType.DOWN_GRADE]: "升降级",
  [AnalysisType.JUMP_STANDBY]: "跳Standby",
  [AnalysisType.AD_LIGHT]: "AD灯不亮",
}

export enum LogClass{
  NEODRIVE = "neodrive",
  OPENAPI = "openapi",
  DRIVER_GNSS = "driver_gnss",
  RESOURCE_MONITOR = "resource_monitor",
  CPU_LOG = "cpu_log",
  MPU_MONITOR = "mpu_monitor",
  NVSIPL = "nvsip",
  NEODRIVE_TRACE = "trace",
}
export interface TextData {
  text: string;
}
export interface LogItem {
  lineNumber: number; text: string
}
export interface LogData {
  logs: LogItem[];
}
export interface ChartData {
  title: string;
  option: any;
  data?: any;
}
export interface SummaryData {
  summary: string;
  checkResultType: CheckResultType;
}

export type PluginData = TextData | LogData | ChartData | SummaryData
export interface AnalysisPluginResult {
  type: BlockType;
  data: PluginData;
}
export abstract class IAnalysisPlugin {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly logClass:LogClass[];

  protected constructor(id: string, name: string, description: string, logClass:LogClass[]) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.logClass = logClass;
  }

  abstract process(
    fileName: string,
    content: string,
    datetime?: Date,
  ): Promise<AnalysisPluginResult[]>;

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

export const composeTextDataResult = (text: string): AnalysisPluginResult => ({
  type: BlockType.TEXT,
  data: { text },
})
export const composeLogDataResult = (logs: LogItem[]): AnalysisPluginResult => ({
  type: BlockType.LOG,
  data: { logs },
})
export const composeChartDataResult = (title: string, option: any): AnalysisPluginResult => ({
  type: BlockType.CHART,
  data: { title, option },
})
export const composeSummaryDataResult = (summary: string, checkResultType: CheckResultType): AnalysisPluginResult => ({
  type: BlockType.SUMMARY,
  data: { summary, checkResultType },
})

