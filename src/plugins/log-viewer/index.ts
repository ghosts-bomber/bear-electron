import type { Plugin } from "@/types/plugin";
import upgradeDetectorPlugin from "./upgrade-detector";
import stackTraceDetectorPlugin from "./stack-trace-detector";
import cpuUsageAnalyzerPlugin from "./cpu-log-usage-analyzer";
import memoryUsageAnalyzerPlugin from "./memory-usage-analyzer";
import gnssLidarWheelAnalysisPlugin from "./gnss-lidar-wheel-analysis";
import cameraFrameRateAnalysisPlugin from "./camera-frame-rate-analysis";
import textExportPlugin from "./text-export";
// 导出所有插件
export const plugins: Plugin[] = [
  upgradeDetectorPlugin,
  stackTraceDetectorPlugin,
  cpuUsageAnalyzerPlugin,
  memoryUsageAnalyzerPlugin,
  gnssLidarWheelAnalysisPlugin,
  cameraFrameRateAnalysisPlugin,
  textExportPlugin,
];

// 插件加载器
export class PluginLoader {
  private static instance: PluginLoader;
  private loadedPlugins: Map<string, Plugin> = new Map();
  static getInstance(): PluginLoader {
    if (!PluginLoader.instance) {
      PluginLoader.instance = new PluginLoader();
    }
    return PluginLoader.instance;
  }

  // 加载所有插件
  loadAllPlugins() {
    try {
      // 清空已加载的插件
      this.loadedPlugins.clear();
      // 加载所有插件
      for (const plugin of plugins) {
        this.loadedPlugins.set(plugin.id, plugin);
      }

      console.log(`成功加载 ${this.loadedPlugins.size} 个插件`);
    } catch (error) {
      console.error("插件加载失败:", error);
    }
  }

  // 获取单个插件
  getPlugin(id: string): Plugin | undefined {
    return this.loadedPlugins.get(id);
  }

  // 获取所有插件
  getAllPlugins(): Plugin[] {
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
export const pluginLoader = PluginLoader.getInstance();

// 默认导出所有插件
export default plugins;
