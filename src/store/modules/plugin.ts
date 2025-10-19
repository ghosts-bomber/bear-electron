import { defineStore } from "pinia";
import type { Plugin } from "@/types/plugin";
import { pluginLoader } from "@/plugins/log-viewer";
let loaded = false;
interface PluginState {
  plugins: Plugin[];
}

export const usePluginStore = defineStore("plugin", {
  state: (): PluginState => ({
    plugins: [],
  }),

  getters: {
    getPlugins: (state: PluginState): Plugin[] => state.plugins,
    getPluginById:
      (state: PluginState) =>
      (id: string): Plugin | undefined =>
        state.plugins.find((plugin) => plugin.id === id),
    getPluginCount: (state: PluginState): number => state.plugins.length,
  },

  actions: {
    loadPlugins() {
      if (!loaded) {
        pluginLoader.loadAllPlugins();
        this.plugins = pluginLoader.getAllPlugins();
        console.log("loadPlugins:" + this.plugins);
      }
      loaded = true;
    },
  },
});
