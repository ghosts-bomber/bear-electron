import type { App } from "vue";
import { setupElIcons } from "./icons";

export default {
  install(app: App<Element>) {
    // 仅保留真实存在的初始化，移除无效模块引用
    setupElIcons(app);
  },
};
