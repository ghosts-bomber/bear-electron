import type {IAnalysisPlugin} from "@/types/plugin";
import UpgradeDetectorPlugin from "./upgrade-detector";
import stackTraceDetectorPlugin from "./stack-trace-detector";
import cpuUsageAnalyzerPlugin from "./cpu-log-usage-analyzer";
import memoryUsageAnalyzerPlugin from "./memory-usage-analyzer";
import gnssLidarWheelAnalysisPlugin from "./gnss-lidar-wheel-analysis";
import cameraFrameRateAnalysisPlugin from "./camera-frame-rate-analysis";
import textExportPlugin from "./text-export";
import GnssLogAnalysisPlugin from "./gnss-log-analysis";
// 导出所有插件
export const AnalysisPlugins: IAnalysisPlugin[] = [
  UpgradeDetectorPlugin,
  // stackTraceDetectorPlugin,
  // cpuUsageAnalyzerPlugin,
  // memoryUsageAnalyzerPlugin,
  // gnssLidarWheelAnalysisPlugin,
  // cameraFrameRateAnalysisPlugin,
  // textExportPlugin,
  GnssLogAnalysisPlugin,
];

// 插件加载器
export class AnalysisPluginLoader {
  private static instance: AnalysisPluginLoader;
  private loadedPlugins: Map<string, IAnalysisPlugin> = new Map();
  static getInstance(): AnalysisPluginLoader {
    if (!AnalysisPluginLoader.instance) {
      AnalysisPluginLoader.instance = new AnalysisPluginLoader();
    }
    return AnalysisPluginLoader.instance;
  }

  // 加载所有插件
  loadAllPlugins() {
    try {
      // 清空已加载的插件
      this.loadedPlugins.clear();
      // 加载所有插件
      for (const plugin of AnalysisPlugins) {
        this.loadedPlugins.set(plugin.id, plugin);
      }

      console.log(`成功加载 ${this.loadedPlugins.size} 个插件`);
    } catch (error) {
      console.error("插件加载失败:", error);
    }
  }

  // 获取单个插件
  getPlugin(id: string): IAnalysisPlugin | undefined {
    return this.loadedPlugins.get(id);
  }

  // 获取所有插件
  getAllPlugins(): IAnalysisPlugin[] {
    return Array.from(this.loadedPlugins.values());
  }

  // 检查插件是否已加载
  isPluginLoaded(id: string): boolean {
    return this.loadedPlugins.has(id);
  }

  // 获取插件信息
  getPluginInfo(): Array<{ id: string; name: string; description: string }> {
    return Array.from(this.loadedPlugins.values()).map((plugin) => ({
      id: plugin.id,
      name: plugin.name,
      description: plugin.description,
    }));
  }
}

// 导出插件加载器实例
export const analysisPluginLoader = AnalysisPluginLoader.getInstance();

// 默认导出所有插件
export default AnalysisPlugins;
