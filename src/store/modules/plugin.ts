import { defineStore } from "pinia";
import type { IAnalysisPlugin } from "@/types/plugin";
import { analysisPluginLoader } from "@/plugins/log-viewer";
let loaded = false;
interface PluginState {
  plugins: IAnalysisPlugin[];
}

export const usePluginStore = defineStore("plugin", {
  state: (): PluginState => ({
    plugins: [],
  }),

  getters: {
    getPlugins: (state: PluginState): IAnalysisPlugin[] => state.plugins,
    getPluginById:
      (state: PluginState) =>
      (id: string): IAnalysisPlugin | undefined =>
        state.plugins.find((plugin) => plugin.id === id),
    getPluginCount: (state: PluginState): number => state.plugins.length,
  },

  actions: {
    loadPlugins() {
      if (!loaded) {
        analysisPluginLoader.loadAllPlugins();
        this.plugins = analysisPluginLoader.getAllPlugins();
        console.log("loadPlugins:" + this.plugins);
      }
      loaded = true;
    },
  },
});
