<template>
  <div ref="logViewerRef" class="log-viewer">
    <div class="left-panel">
      <div class="editor-container">
        <MonacoEditor
          ref="monacoEditorRef"
          :value="editorContent"
          :options="editorOptions"
          :file-name="props.fileName"
          @context-menu-action="handleContextMenuAction"
        />
      </div>
    </div>

    <!-- 拖拽手柄 -->
    <div
      v-show="showRightPanel"
      class="resize-handle"
      :class="{ 'is-resizing': isResizing }"
      @mousedown="startResize"
    >
      <div class="resize-handle-line" />
    </div>

    <!-- 右侧面板 -->
    <div
      class="right-panel"
      :class="{ 'panel-hidden': !showRightPanel }"
      :style="{
        width: showRightPanel ? rightPanelWidth + 'px' : '0px',
        flexBasis: showRightPanel ? rightPanelWidth + 'px' : '0px',
      }"
    >
      <div v-show="showRightPanel" class="panel-header">
        <div class="panel-title">
          <el-icon><ChatDotSquare /></el-icon>
          <span>分析结果</span>
        </div>
        <div class="panel-controls">
          <el-tooltip content="隐藏面板" placement="top">
            <el-button size="small" text class="hide-button" @click="toggleRightPanel">
              <el-icon><Close /></el-icon>
            </el-button>
          </el-tooltip>
        </div>
      </div>
      <div v-show="showRightPanel" class="rich-text-container">
        <RichTextPanel ref="richTextPanelRef" :editor-ref="monacoEditorRef as any" />
      </div>
      <div v-show="showRightPanel" class="dynamic-display-container">
        <button @click="addDynamicItems">测试动态窗口</button>
        <DynamicDisplay ref="dynamicDisplayRef" />
      </div>
    </div>

    <!-- 显示面板按钮 -->
    <div v-if="!showRightPanel" class="show-panel-button">
      <el-tooltip content="显示分析面板" placement="left">
        <el-button type="primary" size="small" circle @click="toggleRightPanel">
          <el-icon><ChatDotSquare /></el-icon>
        </el-button>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import type { Ref } from "vue";
import MonacoEditor from "@/components/MonacoEditor/index.vue";
import RichTextPanel from "@/components/RichTextPanel/index.vue";
import DynamicDisplay from "@/components/DynamicDisplay.vue";
import type { EditorInstance, Plugin, PluginAction, PluginResult } from "@/types/plugin";
import { ChatDotSquare, Close, Delete } from "@element-plus/icons-vue";

interface Props {
  content: string;
  fileName: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "update:content", content: string): void;
}>();

const monacoEditorRef: Ref<InstanceType<typeof MonacoEditor> | null> = ref(null);
const richTextPanelRef: Ref<InstanceType<typeof RichTextPanel> | null> = ref(null);
const dynamicDisplayRef: Ref<InstanceType<typeof DynamicDisplay> | null> = ref(null);
const logViewerRef: Ref<HTMLElement | null> = ref(null);
const editorContent = ref<string>(props.content);

// 面板大小和显示状态
const showRightPanel = ref(true);
const rightPanelWidth = ref(400);
const isResizing = ref(false);

const editorOptions = {
  theme: "vs-dark",
  language: "plaintext",
  wordWrap: "off",
};

// Watch for content changes
watch(
  () => props.content,
  (newContent: string) => {
    editorContent.value = newContent;
  }
);

watch(editorContent, (newContent: string) => {
  emit("update:content", newContent);
});

// 监听面板显示状态变化
watch(showRightPanel, () => {
  updatePanelWidths();
});

// Handle context menu actions
const handleContextMenuAction = async (action: {
  action: string;
  text?: string;
  value?: string;
  result?: string | PluginResult;
  pluginName?: string;
  pluginId?: string;
}): Promise<void> => {
  // Forward the action to RichTextPanel for display
  if (richTextPanelRef.value) {
    richTextPanelRef.value.handleEditorAction(action);
  }
};

// 更新面板宽度（现在只需要处理右侧面板）
const updatePanelWidths = () => {
  // 在flex布局中，左侧面板会自动调整大小
  // 这里保留函数以备将来扩展
};

// 防抖函数
const debounce = (func: Function, wait: number) => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
};

const debouncedUpdatePanelWidths = debounce(updatePanelWidths, 100);

// 切换右侧面板显示/隐藏
const toggleRightPanel = () => {
  showRightPanel.value = !showRightPanel.value;
  updatePanelWidths();

  // 当面板重新显示时，调整图表大小
  if (showRightPanel.value && richTextPanelRef.value) {
    setTimeout(() => {
      richTextPanelRef.value?.resizeCharts();
    }, 350); // 等待CSS动画完成
  }
};

// 拖拽调整大小
const startResize = (e: MouseEvent) => {
  isResizing.value = true;
  document.body.classList.add("col-resize");
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", stopResize);
  e.preventDefault();
};

const handleMouseMove = (e: MouseEvent) => {
  if (!isResizing.value || !logViewerRef.value) return;

  // 使用组件的 ref 直接获取当前实例的 DOM 元素
  const rect = logViewerRef.value.getBoundingClientRect();
  const totalWidth = rect.width;
  const mouseX = e.clientX - rect.left;

  // 计算新的右侧面板宽度
  const newRightWidth = totalWidth - mouseX - 5; // 5px buffer for handle

  // 设置最小和最大宽度限制
  const minRightWidth = 300;
  const maxRightWidth = totalWidth - 300; // 左侧最小300px

  if (newRightWidth >= minRightWidth && newRightWidth <= maxRightWidth) {
    rightPanelWidth.value = newRightWidth;
  }
};

const stopResize = () => {
  isResizing.value = false;
  document.body.classList.remove("col-resize");
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", stopResize);

  // 调整图表大小以适应新的容器尺寸
  if (richTextPanelRef.value) {
    // 使用setTimeout确保DOM更新完成后再调整图表大小
    setTimeout(() => {
      richTextPanelRef.value?.resizeCharts();
    }, 100);
  }
};

// Initialize plugins on component mount
onMounted(async () => {
  // 初始化面板宽度
  setTimeout(updatePanelWidths, 100);
  window.addEventListener("resize", debouncedUpdatePanelWidths);
});

onBeforeUnmount(() => {
  // 清理事件监听器
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", stopResize);
  window.removeEventListener("resize", debouncedUpdatePanelWidths);
});

const addDynamicItems = () => {
    dynamicDisplayRef.value?.addRandomItems(1)
}
</script>

<style lang="scss" scoped>
.log-viewer {
  position: relative;
  display: flex;
  flex: 1;
  align-items: stretch;
  width: 100%;
  height: 100%;

  .left-panel {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 300px;
    overflow: hidden;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
  }

  .resize-handle {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 10px;
    cursor: col-resize;
    user-select: none;
    background: #f5f7fa;
    border: 1px solid #dcdfe6;
    border-right: none;
    border-left: none;
    transition: background-color 0.3s ease;

    &:hover,
    &.is-resizing {
      background: #e4e7ed;
    }

    .resize-handle-line {
      width: 2px;
      height: 40px;
      background: #c0c4cc;
      border-radius: 1px;
      transition: background-color 0.3s ease;
    }

    &:hover .resize-handle-line,
    &.is-resizing .resize-handle-line {
      background: #909399;
    }
  }

  .right-panel {
    display: flex;
    flex-shrink: 0;
    flex-direction: column;
    min-width: 300px;
    max-width: 60%;
    overflow: hidden;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    transition:
      width 0.3s ease,
      flex-basis 0.3s ease;

    &.panel-hidden {
      min-width: 0;
      overflow: visible;
      border: none;
    }

    .panel-header {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: #f5f7fa;
      border-bottom: 1px solid #dcdfe6;

      .panel-title {
        display: flex;
        gap: 8px;
        align-items: center;
        font-size: 14px;
        font-weight: 500;
        color: #303133;
      }

      .panel-controls {
        display: flex;
        gap: 4px;

        .clear-button {
          color: #909399;

          &:hover {
            color: #f56c6c;
          }
        }

        .hide-button {
          color: #909399;

          &:hover {
            color: #606266;
          }
        }
      }
    }

    .rich-text-container {
      flex: 1;
      overflow-y: auto;
      background-color: #fff;
    }

    .dynamic-display-container {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background-color: #fff;
      border-top: 1px solid #dcdfe6;

      button {
        padding: 8px 16px;
        margin: 8px;
        background: #409eff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        flex-shrink: 0;

        &:hover {
          background: #66b1ff;
        }
      }
    }
  }

  .editor-container {
    display: flex;
    flex: 1;
    flex-direction: column;
    height: 100%;
  }

  .show-panel-button {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 10;
    animation: fadeIn 0.3s ease;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

// 全局样式，用于拖拽时的鼠标样式
:global(body.col-resize) {
  cursor: col-resize !important;
}
</style>
