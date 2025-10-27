<template>
  <div class="aip-info-container">
    <div class="left-panel" :style="{ width: leftPanelWidth + 'px' }">
      <el-form label-position="right" label-width="auto" style="max-width: 600px">
        <el-form-item label="aip" label-position="right">
          <el-link class="mx-1" type="primary" :href="aipInfo.jiraIssueLink" target="_blank">
            {{ aipInfo.jiraIssueKey }}
          </el-link>
        </el-form-item>

        <el-form-item label="car id" label-position="right">
          <el-text class="mx-1">{{ aipInfo.carId }}</el-text>
        </el-form-item>

        <el-form-item label="cyberrt version" label-position="right">
          <el-text class="mx-1">{{ aipInfo.carCyberRtVersion }}</el-text>
        </el-form-item>

        <el-form-item label="问题时间点" label-position="right">
          <el-text class="mx-1">{{ aipInfo.dateTime }}</el-text>
        </el-form-item>

        <el-form-item label="故障描述" label-position="right">
          <el-text class="mx-1">{{ aipInfo.remark }}</el-text>
        </el-form-item>

        <el-form-item label="dv" label-position="right">
          <el-link class="mx-1" type="primary" :href="dvLink" target="_blank">看dv点我</el-link>
        </el-form-item>
      </el-form>

      <el-table :data="aipDataInfo.logFiles" stripe style="width: 100%;height: 100%;" :row-class-name="getRowClassName"
        @row-dblclick="logDbClickedHandle" @row-contextmenu="showRowContextMenu">
        <el-table-column label="文件名" min-width="200" show-overflow-tooltip>
          <template #default="scope">
            <span>
              {{ scope.row.name }}
            </span>
          </template>
        </el-table-column>
        <el-table-column property="filesize" label="大小" width="120" />
      </el-table>

      <el-table :data="aipDataInfo.record3dayLinks" style="width: 100%; max-height: 300px; overflow: auto;">
        <el-table-column label="record url">
          <template #default="scope">
            {{ scope.row }}
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="resize-handle" @mousedown="startResize" />
    <div class="right-panel" :style="{ width: `calc(100% - ${leftPanelWidth}px - 10px)` }">
      <!-- 空状态显示 -->
      <div v-if="openTabs.length === 0" class="empty-state">
        <div class="empty-content">
          <el-icon size="48" color="#c0c4cc">
            <Document />
          </el-icon>
          <p>双击左侧日志文件以打开查看</p>
        </div>
      </div>

      <!-- Tab页面 -->
      <el-tabs v-else v-model="activeTab" type="card" closable class="log-tabs" ref="tabsRef" @tab-remove="removeTab"
        @tab-click="handleTabClick">
        <el-tab-pane v-for="tab in openTabs" :key="tab.id" :name="tab.id" :closable="true">
          <template #label>
            <div class="tab-label-container" @contextmenu.prevent="showTabContextMenu($event, tab)">
              <el-icon class="tab-icon" size="14">
                <DocumentCopy />
              </el-icon>
              <el-tooltip :content="tab.fullName" placement="top" :disabled="tab.name.length <= 25">
                <span class="tab-label">{{ tab.name }}</span>
              </el-tooltip>
            </div>
          </template>
          <div class="tab-content">
            <LogViewer :content="tab.content" :file-name="tab.fullName" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 右键菜单组件 -->
    <LogTableContextMenu :visible="contextMenuVisible" :position="contextMenuPosition" :log-file="selectedLogFile"
      :jira-issue-key="aipInfo.jiraIssueKey || ''" @close="closeContextMenu" />
  </div>
</template>

<script setup lang="ts">
import PTApi from "@/api/platform";
import LogViewer from "@/components/LogViewer/index.vue";
import LogTableContextMenu from "@/components/LogTableContextMenu.vue";
import { useAipStore } from "@/store";
import { Document, DocumentCopy } from "@element-plus/icons-vue";
import type { AxiosResponse } from "axios";
import { ElMessage, ElMessageBox } from "element-plus";
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { nextTick } from 'vue';
interface AipInfo {
  carCyberRtVersion?: string;
  carId?: string;
  carMapVersion?: string;
  carOtherVersion?: string;
  createTime?: string;
  dateTime?: string;
  dvObjName?: string;
  id: number;
  jiraIssueKey?: string;
  jiraIssueLink?: string;
  machineType?: string;
  mainQuestionId?: number;
  ossName?: string;
  remark?: string;
  reporter?: string;
  status?: number;
  subQuestionId?: number;
  subType?: string;
  title?: string;
  type?: string;
}

interface LogFileInfo {
  cut: boolean;
  filesize: number;
  name: string;
  objName: string;
  updateTime: string;
  containErrorTime?: boolean;
}

interface AipDataInfo {
  dvLinks: string[];
  logFiles: LogFileInfo[];
  ossName?: string;
  record3dayLinks: string[];
}

interface LogTab {
  id: string;
  name: string;
  fullName: string;
  content: string;
  logFile: LogFileInfo;
}

const props = defineProps({
  code: { type: String, required: true },
});

const aipStroe = useAipStore();
console.log("get aip code:", props.code);
let info = aipStroe.getAipInfo(props.code);
console.info("get stroe info:", info);
const aipInfo = reactive(info as AipInfo);
const aipDataInfo = reactive<AipDataInfo>({
  dvLinks: [],
  logFiles: [],
  record3dayLinks: [],
});

PTApi.aipDataInfo(aipInfo.id)
  .then((response: any) => {
    console.log("API Response:", response);
    if (response) {
      aipDataInfo.dvLinks = response.dvLinks || [];
      aipDataInfo.logFiles = response.logFiles || [];
      aipDataInfo.record3dayLinks = response.record3dayLinks || [];
      aipDataInfo.ossName = response.ossName;
      for (let logFile of aipDataInfo.logFiles) {
        logFile.containErrorTime = isTimeInRange(logFile.name);
      }
    }
    console.log("aipDataInfo:", aipDataInfo);
  })
  .catch((error) => {
    console.error("Failed to fetch AIP data:", error);
  });

const dvLink = computed(() => {
  return (
    "http://ndp.data.neolix.cn/neodata/#/dvPlay?recordPath=" +
    aipInfo.dvObjName +
    "&mapName=" +
    aipInfo.carMapVersion +
    "&carId=" +
    aipInfo.carId +
    "&version=" +
    aipInfo.carCyberRtVersion +
    "&ossName=" +
    aipDataInfo.ossName
  );
});

// Tab相关状态
const tabsRef = ref<any>(null)
let tabsHeaderEl: HTMLElement | null = null
const openTabs = ref<LogTab[]>([]);
const activeTab = ref<string>("");

// 右键菜单相关状态
const contextMenuVisible = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });
const selectedLogFile = ref<LogFileInfo | null>(null);

// 文件名缩略处理
const truncateFileName = (name: string, maxLength: number = 25): string => {
  if (name.length <= maxLength) return name;
  const extension = name.split(".").pop() || "";
  const nameWithoutExt = name.substring(0, name.lastIndexOf(".")) || name;
  const availableLength = maxLength - extension.length - 3; // 3 for "..."

  if (availableLength > 0) {
    return nameWithoutExt.substring(0, availableLength) + "..." + extension;
  }
  return name.substring(0, maxLength - 3) + "...";
};

// 生成唯一的Tab ID
const generateTabId = (logFile: LogFileInfo): string => {
  return `tab-${logFile.objName}-${Date.now()}`;
};

// 移除Tab
const removeTab = (targetName: string | number) => {
  const targetId = String(targetName);
  const index = openTabs.value.findIndex((tab) => tab.id === targetId);
  if (index !== -1) {
    openTabs.value.splice(index, 1);

    // 如果关闭的是当前活跃的tab，切换到其他tab
    if (activeTab.value === targetId) {
      if (openTabs.value.length > 0) {
        // 切换到前一个tab，如果没有则切换到下一个
        const newIndex = index > 0 ? index - 1 : 0;
        activeTab.value = openTabs.value[newIndex]?.id || "";
      } else {
        activeTab.value = "";
      }
    }
  }
};

const scrollActiveTabIntoView = () => {
  const root = (tabsRef.value?.$el ?? null) as HTMLElement | null
  if (!root) return
  const wrap = root.querySelector('.el-tabs__nav-wrap') as HTMLElement | null
  const nav = root.querySelector('.el-tabs__nav') as HTMLElement | null
  if (!wrap || !nav) return
  const active = nav.querySelector('.el-tabs__item.is-active') as HTMLElement | null
  if (!active) return

  const targetLeft = active.offsetLeft - (wrap.clientWidth - active.offsetWidth) / 2
  wrap.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' })
}

// 添加新Tab
const addTab = (logFile: LogFileInfo, content: string) => {
  // 创建新tab
  const newTab: LogTab = {
    id: generateTabId(logFile),
    name: truncateFileName(logFile.name),
    fullName: logFile.name,
    content: content,
    logFile: logFile,
  };

  openTabs.value.push(newTab);
  activeTab.value = newTab.id;

  // 新标签激活后，滚动到可视区域
  nextTick(() => {
    scrollActiveTabIntoView()
  })
};

// 处理Tab点击
const handleTabClick = (tab: any) => {
  // 这里可以添加额外的Tab点击逻辑
  console.log(`切换到Tab: ${tab.props.name}`);
};

// 显示Tab右键菜单
const showTabContextMenu = (event: MouseEvent, tab: LogTab) => {
  // 简化实现：直接显示确认对话框
  ElMessageBox.confirm(`确定要关闭 "${tab.fullName}" 吗？`, "关闭Tab", {
    confirmButtonText: "关闭",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      removeTab(tab.id);
    })
    .catch(() => {
      // 用户取消操作
    });
};

const logDbClickedHandle = async (row: any, column: any, event: Event) => {
  let logFile = row as LogFileInfo;
  const existingTab = openTabs.value.find((tab) => tab.logFile.objName === logFile.objName);
  if (existingTab) {
    // 如果已经打开，切换到该tab并更新内容
    activeTab.value = existingTab.id;
    return
  }
  let url: string = "";

  // 显示加载状态
  const loadingMessage = ElMessage({
    message: `正在加载 ${logFile.name}...`,
    type: "info",
    duration: 0,
    showClose: true,
  });

  try {
    await PTApi.getFileDownloadUrl(logFile.objName)
      .then((data: AxiosResponse) => {
        console.log("data:", data);
        url = data as unknown as string;
        console.log("file url", url);
      })
      .catch()
      .finally();
    const url_match = url.match(/https?:\/\/[^/]+(\/.+)/);
    if (url_match !== null) {
      console.log("url_match:", url_match);
      try {
        //if (!logFile.cut) {
        const { success, content, message } = await (window as any).electronAPI.openJiraFile(
          aipInfo.jiraIssueKey,
          logFile.name,
          url_match[0]
        );
        if (!success) {
          throw new Error(message);
        }
        // 添加到Tab中
        addTab(logFile, content);
        // 关闭加载提示，显示成功消息
        loadingMessage.close();
        ElMessage.success(`${logFile.name} 加载完成`);
      } catch (error) {
        console.error("Error processing tar.gz file:", error);
        loadingMessage.close();
        ElMessage.error(`处理文件 ${logFile.name} 时出错: ${error}`);
      }
    } else {
      console.log("download file:can't find match params,url:", url);
      loadingMessage.close();
      ElMessage.error("无法获取文件下载链接");
    }
  } catch (error) {
    console.error("Error downloading file:", error);
    loadingMessage.close();
    ElMessage.error(`下载文件 ${logFile.name} 时出错`);
  }
};
const showRowContextMenu = (row: LogFileInfo, column: any, event: MouseEvent) => {
  event.preventDefault();
  // 设置选中的日志文件
  selectedLogFile.value = row;
  // 设置菜单位置
  contextMenuPosition.value = {
    x: event.clientX,
    y: event.clientY
  };
  // 显示菜单
  contextMenuVisible.value = true;
};

// 关闭右键菜单
const closeContextMenu = () => {
  contextMenuVisible.value = false;
  selectedLogFile.value = null;
};
// 添加左右面板宽度控制相关的代码
const leftPanelWidth = ref(0);
const isResizing = ref(false);

const onTabsWheel = (e: WheelEvent) => {
  if (!tabsHeaderEl) return
  // 使用纵向滚轮驱动横向滚动；有横向滚轮优先用
  const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY
  if (delta === 0) return
  tabsHeaderEl.scrollLeft += delta
  e.preventDefault() // 阻止页面的默认纵向滚动
}

const bindTabsWheel = () => {
  const root = (tabsRef.value?.$el ?? null) as HTMLElement | null
  // 选取真正可滚动的容器（Element Plus 结构：nav-wrap 包裹 nav-scroll）
  tabsHeaderEl =
    (root?.querySelector('.el-tabs__nav-wrap') as HTMLElement | null) ||
    (root?.querySelector('.el-tabs__nav-scroll') as HTMLElement | null) ||
    (root?.querySelector('.el-tabs__header') as HTMLElement | null)

  if (tabsHeaderEl) {
    tabsHeaderEl.addEventListener('wheel', onTabsWheel, { passive: false })
  }
}
const unbindTabsWheel = () => {
  if (tabsHeaderEl) {
    tabsHeaderEl.removeEventListener('wheel', onTabsWheel as EventListener)
    tabsHeaderEl = null
  }
}
// 键盘快捷键处理
const handleKeydown = (e: KeyboardEvent) => {
  // Ctrl+W 关闭当前Tab
  if (e.ctrlKey && e.key === "w" && activeTab.value) {
    e.preventDefault();
    removeTab(activeTab.value);
  }
  // Ctrl+Shift+T 重新打开最近关闭的Tab（如果需要的话）
  // 可以在这里添加更多快捷键
};

// 计算初始宽度（1:3 比例）
onMounted(() => {
  const containerWidth = document.querySelector(".aip-info-container")?.clientWidth || 0;
  leftPanelWidth.value = containerWidth / 4; // 1/4 的宽度

  // 添加键盘事件监听
  document.addEventListener("keydown", handleKeydown);

  bindTabsWheel()

  document.title = props.code;
});

watch(
  () => props.code,
  (newCode) => {
    document.title = newCode;
  }
);
// 当前激活标签变化时，确保其可见
watch(activeTab, () => {
  nextTick(() => {
    scrollActiveTabIntoView()
  })
})

// 标签增删后重新获取头部容器并绑定滚轮
watch(() => openTabs.value.length, () => {
  nextTick(() => {
    unbindTabsWheel()
    bindTabsWheel()
  })
})

// 清理事件监听器
onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleKeydown);
  unbindTabsWheel()
});

// 处理拖动开始
const startResize = (e: MouseEvent) => {
  isResizing.value = true;
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", stopResize);
};

// 处理拖动过程
const handleMouseMove = (e: MouseEvent) => {
  if (!isResizing.value) return;

  const container = document.querySelector(".aip-info-container");
  if (!container) return;

  const containerRect = container.getBoundingClientRect();
  const newWidth = e.clientX - containerRect.left;

  // 设置最小宽度限制
  const minWidth = 200;
  const maxWidth = containerRect.width - 300; // 右侧面板最小宽度 300px

  if (newWidth >= minWidth && newWidth <= maxWidth) {
    leftPanelWidth.value = newWidth;
  }
};

// 处理拖动结束
const stopResize = () => {
  isResizing.value = false;
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", stopResize);
};

// 从文件名中提取时间段
const extractTimeRangeFromFileName = (
  fileName: string
): { startTime: Date | null; endTime: Date | null } => {
  // 匹配文件名中的时间格式：YYYYMMDD-HHMMSS_YYYYMMDD-HHMMSS
  const timePattern = /(\d{8})-(\d{6})_(\d{8})-(\d{6})/;
  const match = fileName.match(timePattern);

  if (!match) {
    console.log("No time pattern match in fileName:", fileName);
    return { startTime: null, endTime: null };
  }

  const [, startDate, startTime, endDate, endTime] = match;
  console.log("Extracted time parts:", { startDate, startTime, endDate, endTime });

  // 解析开始时间
  const startYear = parseInt(startDate.substring(0, 4));
  const startMonth = parseInt(startDate.substring(4, 6)) - 1; // 月份从0开始
  const startDay = parseInt(startDate.substring(6, 8));
  const startHour = parseInt(startTime.substring(0, 2));
  const startMinute = parseInt(startTime.substring(2, 4));
  const startSecond = parseInt(startTime.substring(4, 6));

  // 解析结束时间
  const endYear = parseInt(endDate.substring(0, 4));
  const endMonth = parseInt(endDate.substring(4, 6)) - 1;
  const endDay = parseInt(endDate.substring(6, 8));
  const endHour = parseInt(endTime.substring(0, 2));
  const endMinute = parseInt(endTime.substring(2, 4));
  const endSecond = parseInt(endTime.substring(4, 6));

  const startDateTime = new Date(
    startYear,
    startMonth,
    startDay,
    startHour,
    startMinute,
    startSecond
  );
  const endDateTime = new Date(endYear, endMonth, endDay, endHour, endMinute, endSecond);

  console.log("Parsed dates:", {
    startDateTime: startDateTime.toISOString(),
    endDateTime: endDateTime.toISOString(),
  });

  return { startTime: startDateTime, endTime: endDateTime };
};

// 判断问题时间是否在日志时间范围内
const isTimeInRange = (fileName: string): boolean => {
  if (!aipInfo.dateTime) {
    console.log("No dateTime in aipInfo");
    return false;
  }

  const { startTime, endTime } = extractTimeRangeFromFileName(fileName);

  if (!startTime || !endTime) {
    console.log("Failed to extract time range from fileName:", fileName);
    return false;
  }

  // 解析问题时间 - 尝试多种格式
  let problemTime: Date;
  try {
    problemTime = new Date(aipInfo.dateTime);
    // 如果解析失败，尝试其他格式
    if (isNaN(problemTime.getTime())) {
      // 尝试替换格式，比如将空格替换为T
      const isoFormat = aipInfo.dateTime.replace(" ", "T");
      problemTime = new Date(isoFormat);
    }
  } catch (error) {
    console.error("Failed to parse problem time:", aipInfo.dateTime, error);
    return false;
  }

  if (isNaN(problemTime.getTime())) {
    console.error("Invalid problem time:", aipInfo.dateTime);
    return false;
  }

  // 判断问题时间是否在日志时间范围内
  const ret = problemTime >= startTime && problemTime <= endTime;
  return ret;
};
const getRowClassName = ({ row }: { row: LogFileInfo }): string => {
  return row.containErrorTime ? "highlight-row" : "";
};
</script>

<style scoped>
.aip-info-container {
  position: relative;
  display: flex;
  gap: 10px;
  width: 100vw;
  max-width: 100%;
  height: calc(100vh - 60px);
  padding: 0;
  margin: 0;
  overflow: hidden;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.left-panel {
  display: flex;
  flex-direction: column;
  min-width: 250px;
  padding: 20px;
  overflow-y: auto;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px 0 0 12px;
  box-shadow: 0 4px 20px rgb(0 0 0 / 8%);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.right-panel {
  display: flex;
  flex-direction: column;
  min-width: 400px;
  height: 100%;
  overflow: hidden;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0 12px 12px 0;
  box-shadow: 0 4px 20px rgb(0 0 0 / 8%);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.resize-handle {
  position: relative;
  z-index: 10;
  width: 10px;
  cursor: col-resize;
  background: linear-gradient(to bottom, #667eea, #764ba2);
  border-radius: 5px;
  opacity: 0.3;
  transition: all 0.15s ease;
}

.resize-handle:hover {
  background: linear-gradient(to bottom, #409eff, #66b1ff);
  opacity: 0.8;
  transform: scaleX(1.2);
}

.resize-handle:active {
  background: linear-gradient(to bottom, #337ecc, #4d9eff);
  opacity: 1;
  transform: scaleX(1.5);
}

.empty-state {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  margin: 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.empty-content {
  padding: 40px;
  color: #64748b;
  text-align: center;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgb(0 0 0 / 5%);
  transition: all 0.2s ease;
}

.empty-content:hover {
  box-shadow: 0 8px 30px rgb(0 0 0 / 10%);
  transform: translateY(-2px);
}

.empty-content p {
  margin-top: 16px;
  font-size: 16px;
  font-weight: 500;
}

.log-tabs {
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
  margin: 16px;
  overflow: hidden;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgb(0 0 0 / 5%);
}

.log-tabs :deep(.el-tabs__header) {
  flex-shrink: 0;
  padding: 0 16px;
  margin: 0;
  background: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
  border-radius: 12px 12px 0 0;
  transition: all 0.2s ease;
}

.log-tabs :deep(.el-tabs__nav-wrap) {
  background: transparent;
  border-bottom: none;
  overflow-x: auto;
  overflow-y: hidden;
  /* 启用平滑滚动 */
  scroll-behavior: smooth;
  /* 隐藏滚动条但保持滚动功能 */
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
  /* 阻止父级滚动劫持 */
  overscroll-behavior: contain;
}

/* 保证标签不换行，从而产生横向滚动 */
.log-tabs :deep(.el-tabs__nav) {
  flex-wrap: nowrap;
  white-space: nowrap;
}

.log-tabs :deep(.el-tabs__content) {
  flex: 1;
  padding: 0;
  overflow: hidden;
  background: white;
}

.log-tabs :deep(.el-tab-pane) {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
}

.tab-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
  padding: 12px;
  overflow: hidden;
  background: #f8fafc;
  border-radius: 8px;
}

/* 确保LogViewer在Tab中能占满空间 */
.tab-content :deep(.log-viewer) {
  display: flex;
  flex: 1;
  height: 100%;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 5%);
}

/* 确保MonacoEditor在LogViewer中能占满空间 */
.tab-content :deep(.monaco-container) {
  flex: 1;
  height: 100%;
  min-height: 200px;
  overflow: hidden;
  border-radius: 8px;
}

.tab-label-container {
  display: flex;
  gap: 8px;
  align-items: center;
  max-width: 220px;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.15s ease;
}

.tab-label-container:hover {
  background: rgb(64 158 255 / 10%);
  transform: translateY(-1px);
}

.tab-icon {
  flex-shrink: 0;
  color: #64748b;
  transition: color 0.15s ease;
}

.tab-label {
  display: inline-block;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.15s ease;
}

.log-tabs :deep(.el-tabs__item) {
  max-width: 280px;
  padding: 8px 16px;
  margin: 4px 2px;
  border: 1px solid transparent;
  border-radius: 8px;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.log-tabs :deep(.el-tabs__item:hover) {
  background: rgb(64 158 255 / 5%);
  border-color: rgb(64 158 255 / 20%);
  transform: translateY(-1px);
}

.log-tabs :deep(.el-tabs__item.is-active) {
  background: white;
  border-color: #409eff;
  box-shadow: 0 2px 8px rgb(64 158 255 / 20%);
  transform: translateY(-1px);
}

.log-tabs :deep(.el-tabs__item.is-active .tab-icon) {
  color: #409eff;
}

.log-tabs :deep(.el-tabs__item.is-active .tab-label) {
  color: #409eff;
}

.rich-text-panel {
  display: flex;
  flex-direction: column;
  width: 320px;
  margin: 16px;
  overflow: hidden;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgb(0 0 0 / 8%);
  transition: all 0.2s ease;
}

.rich-text-header {
  padding: 16px 20px;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: all 0.2s ease;
}

.rich-text-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.rich-text-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #f8fafc;
}

.action-item {
  padding: 12px;
  margin-bottom: 12px;
  line-height: 1.6;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.15s ease;
}

.action-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgb(64 158 255 / 10%);
  transform: translateY(-1px);
}

.action-item .time {
  margin-right: 8px;
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
}

.action-item .action {
  margin-right: 8px;
  font-weight: 600;
  color: #409eff;
}

.action-item .text {
  color: #475569;
  word-break: break-all;
}

/* 高亮显示包含问题时间的日志行 */
.left-panel :deep(.el-table .highlight-row) {
  background-color: rgb(245 108 108 / 10%) !important;
}

.left-panel :deep(.el-table .highlight-row:hover) {
  background-color: rgb(245 108 108 / 15%) !important;
}

.left-panel :deep(.el-table .highlight-row td) {
  font-weight: 600;
  color: #f56c6c !important;
}

.highlight-row {
  font-weight: 600;
  color: #f56c6c !important;
}

/* 表格样式优化 */
.left-panel :deep(.el-form) {
  padding: 20px;
  margin-bottom: 20px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.left-panel :deep(.el-form:hover) {
  box-shadow: 0 4px 12px rgb(0 0 0 / 5%);
}

.left-panel :deep(.el-table) {
  margin-bottom: 16px;
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgb(0 0 0 / 5%);
  transition: all 0.2s ease;
}

.left-panel :deep(.el-table:hover) {
  box-shadow: 0 4px 20px rgb(0 0 0 / 8%);
}

.left-panel :deep(.el-table__row) {
  transition: all 0.15s ease;
}

.left-panel :deep(.el-table__row:hover) {
  background-color: rgb(64 158 255 / 5%) !important;
  transform: translateX(2px);
}

/* 响应式设计 */
@media (width <=1200px) {
  .aip-info-container {
    flex-direction: column;
    height: auto;
    min-height: calc(100vh - 60px);
  }

  .left-panel {
    min-width: 100%;
    max-height: 40vh;
    border-radius: 12px 12px 0 0;
  }

  .right-panel {
    min-width: 100%;
    min-height: 60vh;
    border-radius: 0 0 12px 12px;
  }

  .resize-handle {
    width: 100%;
    height: 10px;
    cursor: row-resize;
  }

  .rich-text-panel {
    width: 100%;
    margin: 0;
    border-radius: 0;
  }
}

@media (width <=768px) {
  .aip-info-container {
    gap: 10px;
    padding: 10px;
  }

  .left-panel {
    padding: 16px;
    border-radius: 8px;
  }

  .right-panel {
    border-radius: 8px;
  }

  .log-tabs {
    margin: 8px;
    border-radius: 8px;
  }

  .log-tabs :deep(.el-tabs__header) {
    border-radius: 8px 8px 0 0;
  }

  .tab-content {
    padding: 8px;
  }
}

/* 加载动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 最左上角透明按钮样式 */
.open-root-btn {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 100;
  padding: 6px 12px;
  color: #409eff !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  transition: background 0.2s;
}

.open-root-btn:hover {
  background: rgb(64 158 255 / 8%) !important;
}
</style>
