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
