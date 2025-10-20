<template>
  <div ref="richTextPanelRef" class="rich-text-panel">
    <div class="rich-text-header">
      <h3>操作记录</h3>
      <div class="header-actions">
        <el-button type="primary" size="small" @click="clearContent">清空</el-button>
      </div>
    </div>
    <div class="rich-text-content" v-html="content" />
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onBeforeUnmount } from "vue";
import * as echarts from "echarts";
import type { PluginResult } from "@/types/plugin";

const content = ref("");
const richTextPanelRef = ref<HTMLElement | null>(null);

// 存储图表实例用于清理
const chartInstances = new Map<string, any>();
// 存储图表配置用于重新渲染
const chartConfigs = new Map<string, any>();

// 图表渲染队列
const chartRenderQueue: Array<{ chartId: string; option: any }> = [];
let isProcessingQueue = false;

// ResizeObserver 实例
let resizeObserver: ResizeObserver | null = null;

// 渲染ECharts图表
const renderChart = async (chartId: string, chartOption: any) => {
  console.log(`Starting renderChart for ${chartId}`);

  // 等待DOM更新
  await nextTick();

  // 使用更可靠的DOM检测机制
  const waitForElement = (id: string, maxAttempts = 30): Promise<HTMLElement | null> => {
    return new Promise((resolve) => {
      let attempts = 0;

      const checkElement = () => {
        const element = document.getElementById(id);
        console.log(
          `Attempt ${attempts + 1} for ${id}: element found: ${!!element}, visible: ${element?.offsetParent !== null}`
        );

        if (element && element.offsetParent !== null) {
          // 元素存在且可见
          console.log(`Element ${id} found and visible after ${attempts + 1} attempts`);
          resolve(element);
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkElement, 150);
        } else {
          console.warn(`Element ${id} not found after ${maxAttempts} attempts`);
          resolve(null);
        }
      };
      checkElement();
    });
  };

  const chartDom = await waitForElement(chartId);

  if (chartDom) {
    try {
      console.log(
        `Initializing chart ${chartId}, container size: ${chartDom.offsetWidth}x${chartDom.offsetHeight}`
      );

      // 清理已存在的图表实例
      if (chartInstances.has(chartId)) {
        console.log(`Disposing existing chart instance for ${chartId}`);
        chartInstances.get(chartId).dispose();
        chartInstances.delete(chartId);
      }

      // 确保容器有正确的尺寸
      if (chartDom.offsetWidth === 0 || chartDom.offsetHeight === 0) {
        console.warn(`Chart container ${chartId} has zero dimensions, setting default size`);
        // 设置默认尺寸
        chartDom.style.width = "100%";
        chartDom.style.height = "500px";
        // 强制重新计算布局
        chartDom.offsetHeight;
      }

      const myChart = echarts.init(chartDom);
      myChart.setOption(chartOption);

      // 存储图表实例和配置
      chartInstances.set(chartId, myChart);
      chartConfigs.set(chartId, chartOption);

      // 响应式处理
      const resizeHandler = () => {
        if (chartInstances.has(chartId)) {
          chartInstances.get(chartId).resize();
        }
      };
      window.addEventListener("resize", resizeHandler);

      // 清理函数（在组件卸载时调用）
      const cleanup = () => {
        window.removeEventListener("resize", resizeHandler);
        if (chartInstances.has(chartId)) {
          chartInstances.get(chartId).dispose();
          chartInstances.delete(chartId);
        }
        chartConfigs.delete(chartId);
      };

      console.log(`Chart ${chartId} rendered successfully, total charts: ${chartInstances.size}`);

      // 渲染完成后，检查并重新渲染所有图表以确保可见性
      setTimeout(() => {
        reRenderAllCharts();
      }, 100);

      return cleanup;
    } catch (error) {
      console.error(`ECharts渲染失败 for ${chartId}:`, error);
      if (chartDom) {
        chartDom.innerHTML = `<div style="padding: 20px; color: red; text-align: center;">
          <div>图表渲染失败</div>
          <div style="font-size: 12px; margin-top: 5px;">${error instanceof Error ? error.message : String(error)}</div>
        </div>`;
      }
    }
  } else {
    console.error(`Chart container ${chartId} not found or not visible`);
  }
};

// 处理插件结果
const handlePluginResult = async (
  pluginName: string,
  result: string | PluginResult | PluginResult[]
) => {
  const timestamp = new Date().toLocaleTimeString();

  if (typeof result === "string") {
    // 传统字符串结果
    return `<div class="action-item plugin-result">
      <span class="time">[${timestamp}]</span>
      <span class="action">✅ ${pluginName} 处理完成：</span>
      <div class="plugin-output">${result}</div>
    </div>`;
  } else if (Array.isArray(result)) {
    // PluginResult数组，按顺序处理每个结果
    let allHtml = "";
    for (let i = 0; i < result.length; i++) {
      const singleResult = result[i];
      const resultHtml = await handleSinglePluginResult(
        pluginName,
        singleResult,
        timestamp,
        i + 1,
        result.length
      );
      allHtml += resultHtml;
    }
    return allHtml;
  } else {
    // 单个PluginResult对象
    return await handleSinglePluginResult(pluginName, result, timestamp);
  }
};

// 处理单个PluginResult
const handleSinglePluginResult = async (
  pluginName: string,
  result: PluginResult,
  timestamp: string,
  index?: number,
  total?: number
) => {
  const chartId = `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // 如果是数组结果，添加序号显示
  const titleSuffix = index && total ? ` (${index}/${total})` : "";

  let html = `<div class="action-item plugin-result">
    <span class="time">[${timestamp}]</span>
    <span class="action">✅ ${pluginName}${titleSuffix} 处理完成：</span>
    <div class="plugin-output">`;

  // 添加摘要信息
  if (result.summary) {
    html += `<div class="plugin-summary" style="margin-bottom: 15px; padding: 10px; background: #f0f9ff; border-left: 4px solid #0ea5e9; border-radius: 4px;">
      ${result.summary}
    </div>`;
  }

  // 添加HTML内容
  if (result.html) {
    html += result.html;
  }

  // 添加图表容器
  if (result.chart && result.chart.type === "echarts") {
    console.log(`Adding echarts-chart with ID: ${chartId}`);
    html += `
      <div class="echarts-container" style="margin: 20px 0;">
        <div class="chart-header" style="margin-bottom: 10px; font-weight: bold; color: #333;">
          📊 数据可视化图表${titleSuffix}
        </div>
        <div id="${chartId}" class="echarts-chart" style="width: 100%; height: 500px; border: 1px solid #ddd; border-radius: 6px; background: #fff;">
          <div style="padding: 60px; text-align: center; color: #666;">
            <div style="font-size: 18px;">📊</div>
            <div style="margin-top: 10px;">正在加载图表...</div>
          </div>
        </div>
      </div>`;

    // 使用队列机制渲染图表
    queueChartRender(chartId, result.chart!.option);

    // 为这个特定图表添加独立的渲染尝试
    setTimeout(async () => {
      console.log(`Independent render attempt for ${chartId}`);
      if (!chartInstances.has(chartId)) {
        await renderChart(chartId, result.chart!.option);
      }
    }, 500);
  }

  html += `</div></div>`;
  return html;
};

// 处理来自 Monaco Editor 的操作信号
const handleEditorAction = async (action: {
  action: string;
  text?: string;
  value?: string;
  pluginName?: string;
  pluginId?: string;
  result?: string | PluginResult | PluginResult[];
}) => {
  const timestamp = new Date().toLocaleTimeString();
  let actionContent = "";

  switch (action.action) {
    case "plugin-processing":
      actionContent = `<div class="action-item plugin-processing">
        <span class="time">[${timestamp}]</span>
        <span class="action">🔄 处理中：</span>
        <span class="text">${action.text}</span>
      </div>`;
      break;
    case "plugin-result":
      if (action.result) {
        actionContent = await handlePluginResult(action.pluginName || "插件", action.result);
      } else {
        // 兼容旧格式
        actionContent = `<div class="action-item plugin-result">
          <span class="time">[${timestamp}]</span>
          <span class="action">✅ ${action.pluginName || "插件"} 处理完成：</span>
          <div class="plugin-output">${action.text}</div>
        </div>`;
      }
      break;
    case "plugin-error":
      actionContent = `<div class="action-item plugin-error">
        <span class="time">[${timestamp}]</span>
        <span class="action">❌ 插件错误：</span>
        <span class="text">${action.text}</span>
      </div>`;
      break;
  }

  content.value = content.value + actionContent;

  // 确保DOM更新后重新渲染所有图表
  await nextTick();

  // 每次内容更新都需要重新渲染图表，因为v-html会重新创建DOM
  setTimeout(async () => {
    console.log("Content updated, re-rendering all charts...");
    await reRenderAllChartsAfterContentUpdate();

    // 处理新增的图表
    if (action.action === "plugin-result" && action.result && typeof action.result === "object") {
      // 检查是否有图表需要渲染
      const hasChart = Array.isArray(action.result)
        ? action.result.some((r) => r.chart)
        : action.result.chart;

      if (hasChart) {
        await processChartQueue();
      }
    }
  }, 100);

  // 备用检查机制：再次延迟检查是否有未渲染的图表
  setTimeout(async () => {
    const allChartContainers = document.querySelectorAll(".echarts-chart");
    console.log(
      `Backup check: Found ${allChartContainers.length} chart containers, active charts: ${chartInstances.size}`
    );

    // 检查所有图表容器，重新渲染未渲染的图表
    for (let i = 0; i < allChartContainers.length; i++) {
      const container = allChartContainers[i] as HTMLElement;
      const chartId = container.id;
      if (chartId && !chartInstances.has(chartId)) {
        console.log(`Found unrendered chart: ${chartId}, attempting to render...`);
        // 尝试从配置中找到对应的选项
        if (chartConfigs.has(chartId)) {
          await renderChart(chartId, chartConfigs.get(chartId));
        } else {
          // 如果配置中没有，尝试从队列中找到
          const queueItem = chartRenderQueue.find((item) => item.chartId === chartId);
          if (queueItem) {
            await renderChart(chartId, queueItem.option);
          }
        }
      }
    }

    // 最后再次确保所有图表都正确渲染
    await reRenderAllChartsAfterContentUpdate();
  }, 1500);
};

// 清空内容
const clearContent = () => {
  content.value = "";
  // 清空图表实例
  chartInstances.forEach((chart) => {
    chart.dispose();
  });
  chartInstances.clear();
  // 清空图表配置
  chartConfigs.clear();
};

// 调整所有图表大小
const resizeCharts = () => {
  chartInstances.forEach((chart) => {
    chart.resize();
  });
};

// 处理图表渲染队列
const processChartQueue = async () => {
  console.log(
    `Processing chart queue, length: ${chartRenderQueue.length}, isProcessing: ${isProcessingQueue}`
  );

  if (isProcessingQueue || chartRenderQueue.length === 0) {
    return;
  }

  isProcessingQueue = true;
  console.log("Starting chart queue processing...");

  while (chartRenderQueue.length > 0) {
    const { chartId, option } = chartRenderQueue.shift()!;
    console.log(`Processing chart: ${chartId}`);

    try {
      await renderChart(chartId, option);
      console.log(`Chart ${chartId} rendered successfully`);
      // 给每个图表渲染之间一些间隔
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Failed to render chart ${chartId}:`, error);
      // 即使失败也要继续处理下一个图表
    }
  }

  isProcessingQueue = false;
  console.log("Chart queue processing completed");
};

// 添加图表到渲染队列
const queueChartRender = (chartId: string, option: any) => {
  console.log(`Queuing chart render for ${chartId}`);
  chartRenderQueue.push({ chartId, option });
  // 不立即处理队列，等待handleEditorAction中的延迟处理
};

// 重新渲染所有图表的函数
const reRenderAllCharts = async () => {
  console.log(
    `Re-rendering all charts to ensure visibility. Total configs: ${chartConfigs.size}, Total instances: ${chartInstances.size}`
  );

  for (const [chartId, config] of chartConfigs.entries()) {
    const chartDom = document.getElementById(chartId);
    if (chartDom) {
      try {
        // 检查图表容器是否可见
        const isVisible =
          chartDom.offsetParent !== null && chartDom.offsetWidth > 0 && chartDom.offsetHeight > 0;
        console.log(
          `Chart ${chartId}: DOM found, visible: ${isVisible}, has instance: ${chartInstances.has(chartId)}`
        );

        if (isVisible) {
          if (chartInstances.has(chartId)) {
            // 图表实例存在且容器可见，检查图表是否正常显示
            const chartInstance = chartInstances.get(chartId);
            try {
              chartInstance.resize();
              console.log(`Chart ${chartId}: Resized successfully`);
            } catch (resizeError) {
              console.warn(`Chart ${chartId}: Resize failed, re-initializing...`, resizeError);
              // resize失败，重新初始化
              chartInstance.dispose();
              const newChart = echarts.init(chartDom);
              newChart.setOption(config);
              chartInstances.set(chartId, newChart);
              console.log(`Chart ${chartId}: Re-initialized successfully`);
            }
          } else {
            // 容器可见但没有图表实例，创建新实例
            console.log(`Chart ${chartId}: Creating new instance`);
            const newChart = echarts.init(chartDom);
            newChart.setOption(config);
            chartInstances.set(chartId, newChart);
            console.log(`Chart ${chartId}: New instance created successfully`);
          }
        } else {
          console.log(`Chart ${chartId}: Container not visible, skipping`);
        }
      } catch (error) {
        console.error(`Error processing chart ${chartId}:`, error);
      }
    } else {
      console.warn(`Chart ${chartId}: DOM element not found`);
    }
  }

  console.log(`Re-rendering completed. Active instances: ${chartInstances.size}`);
};

// 在内容更新后重新渲染所有图表的函数
const reRenderAllChartsAfterContentUpdate = async () => {
  console.log(
    `Re-rendering all charts after content update. Total configs: ${chartConfigs.size}, Total instances: ${chartInstances.size}`
  );

  // 先清理所有现有的图表实例，因为DOM已经重新创建
  chartInstances.forEach((chart) => {
    try {
      chart.dispose();
    } catch (error) {
      console.warn("Error disposing chart:", error);
    }
  });
  chartInstances.clear();

  // 重新渲染所有配置的图表
  for (const [chartId, config] of chartConfigs.entries()) {
    const chartDom = document.getElementById(chartId);
    if (chartDom) {
      try {
        // 检查图表容器是否可见
        const isVisible =
          chartDom.offsetParent !== null && chartDom.offsetWidth > 0 && chartDom.offsetHeight > 0;
        console.log(`Chart ${chartId}: DOM found, visible: ${isVisible}`);

        if (isVisible) {
          // 创建新的图表实例
          console.log(`Chart ${chartId}: Creating new instance after content update`);
          const newChart = echarts.init(chartDom);
          newChart.setOption(config);
          chartInstances.set(chartId, newChart);
          console.log(`Chart ${chartId}: New instance created successfully after content update`);
        } else {
          console.log(`Chart ${chartId}: Container not visible, will retry later`);
        }
      } catch (error) {
        console.error(`Error processing chart ${chartId} after content update:`, error);
      }
    } else {
      console.warn(`Chart ${chartId}: DOM element not found after content update`);
    }
  }

  console.log(
    `Re-rendering after content update completed. Active instances: ${chartInstances.size}`
  );
};

// 设置 ResizeObserver 来监听容器大小变化
onMounted(() => {
  if (richTextPanelRef.value && window.ResizeObserver) {
    resizeObserver = new ResizeObserver((entries) => {
      // 防抖处理，避免频繁调用
      setTimeout(() => {
        resizeCharts();
      }, 100);
    });
    resizeObserver.observe(richTextPanelRef.value);
  }
});

onBeforeUnmount(() => {
  // 清理ResizeObserver
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }

  // 清理所有图表实例
  chartInstances.forEach((chart) => {
    chart.dispose();
  });
  chartInstances.clear();
  // 清理图表配置
  chartConfigs.clear();
});

// 暴露方法给父组件
defineExpose({
  handleEditorAction,
  clearContent,
  resizeCharts,
});
</script>

<style scoped>
.rich-text-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background-color: #fff;
}

.rich-text-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
}

.rich-text-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.rich-text-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.action-item {
  padding: 12px;
  margin-bottom: 12px;
  line-height: 1.5;
  background-color: #f8f9fa;
  border-left: 3px solid #e0e0e0;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.action-item:hover {
  background-color: #f0f2f5;
  transform: translateX(2px);
}

.action-item .time {
  margin-right: 8px;
  font-family: monospace;
  font-size: 12px;
  color: #909399;
}

.action-item .action {
  margin-right: 8px;
  font-weight: bold;
  color: #409eff;
}

.action-item .text {
  display: block;
  padding: 6px;
  margin-top: 6px;
  font-family: monospace;
  font-size: 13px;
  color: #606266;
  word-break: break-all;
  background-color: #fff;
  border-radius: 3px;
}

/* 插件处理中状态 */
.action-item.plugin-processing {
  background-color: #fef9e7;
  border-left-color: #f39c12;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.7;
  }
}

/* 插件成功结果 */
.action-item.plugin-result {
  background-color: #f0f9ff;
  border-left-color: #67c23a;
}

.action-item.plugin-result .plugin-output {
  max-height: 300px;
  padding: 12px;
  margin-top: 8px;
  overflow-y: auto;
  background-color: #fff;
  border: 1px solid #e1f5fe;
  border-radius: 4px;
}

/* 插件错误状态 */
.action-item.plugin-error {
  background-color: #fef0f0;
  border-left-color: #f56c6c;
}

/* 插件输出样式 */
.plugin-output h3,
.plugin-output h4 {
  margin: 0 0 8px;
  color: #303133;
}

.plugin-output h3 {
  padding-bottom: 4px;
  font-size: 16px;
  border-bottom: 2px solid #409eff;
}

.plugin-output h4 {
  font-size: 14px;
  color: #606266;
}

.plugin-output p {
  margin: 6px 0;
  line-height: 1.4;
}

.plugin-output ul,
.plugin-output ol {
  padding-left: 20px;
  margin: 8px 0;
}

.plugin-output li {
  margin: 4px 0;
}

.plugin-output pre {
  padding: 12px;
  overflow-x: auto;
  font-family: "Courier New", monospace;
  font-size: 12px;
  line-height: 1.4;
  background-color: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.plugin-output .json-code {
  color: #eff;
  background-color: #263238;
  border: 1px solid #37474f;
}

.plugin-output .stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: 12px 0;
}

.plugin-output .stat-item {
  padding: 8px;
  background-color: #f8f9fa;
  border-left: 3px solid #409eff;
  border-radius: 4px;
}

.plugin-output .stat-item.error {
  background-color: #fef0f0;
  border-left-color: #f56c6c;
}

.plugin-output .stat-item.warning {
  background-color: #fdf6ec;
  border-left-color: #e6a23c;
}

.plugin-output .stat-item.info {
  background-color: #f4f4f5;
  border-left-color: #909399;
}

.plugin-output .keyword-result {
  padding: 8px;
  margin: 8px 0;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.plugin-output .matched-lines {
  max-height: 150px;
  margin-top: 8px;
  overflow-y: auto;
}

.plugin-output .line-match {
  padding: 4px;
  margin: 4px 0;
  font-family: monospace;
  font-size: 12px;
  background-color: #fff;
  border-radius: 2px;
}

.plugin-output .line-number {
  margin-right: 8px;
  color: #909399;
}

.plugin-output .line-content {
  color: #303133;
}

.plugin-output mark {
  padding: 1px 2px;
  background-color: #ffc;
  border-radius: 2px;
}

.plugin-output .more-matches {
  margin-top: 8px;
  font-style: italic;
  color: #909399;
  text-align: center;
}

.plugin-output .json-info,
.plugin-output .search-stats,
.plugin-output .search-results {
  margin: 12px 0;
}

.plugin-output .error-info {
  padding: 8px;
  background-color: #fef0f0;
  border: 1px solid #f56c6c;
  border-radius: 4px;
}

.plugin-output .analysis-time,
.plugin-output .format-time,
.plugin-output .search-time,
.plugin-output .error-time {
  margin-top: 12px;
  font-style: italic;
  color: #909399;
  text-align: right;
}

/* 升降级检测插件样式 */
.plugin-output .upgrade-detection {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.plugin-output .detection-summary {
  padding: 16px;
  margin: 16px 0;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.plugin-output .detection-summary.has-issues {
  background-color: #fff3cd;
  border-color: #ffeaa7;
}

.plugin-output .detection-summary.no-issues {
  background-color: #d4edda;
  border-color: #00b894;
}

.plugin-output .summary-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.plugin-output .status-icon {
  margin-right: 8px;
  font-size: 18px;
}

.plugin-output .status-text {
  font-size: 16px;
  font-weight: bold;
  color: #2d3748;
}

.plugin-output .summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.plugin-output .summary-stats .stat-item {
  padding: 8px 12px;
  background-color: rgb(255 255 255 / 70%);
  border-left: 3px solid #409eff;
  border-radius: 4px;
}

.plugin-output .summary-stats .stat-value.warning {
  font-weight: bold;
  color: #e6a23c;
}

.plugin-output .summary-stats .stat-value.error {
  font-weight: bold;
  color: #f56c6c;
}

.plugin-output .detection-details {
  margin: 16px 0;
}

.plugin-output .results-list {
  max-height: 400px;
  overflow-y: auto;
}

.plugin-output .result-item {
  padding: 12px;
  margin: 12px 0;
  background-color: #f8f9fa;
  border-left: 4px solid #409eff;
  border-radius: 6px;
}

.plugin-output .result-item.reason {
  background-color: #fdf6ec;
  border-left-color: #e6a23c;
}

.plugin-output .result-item.abnormal {
  background-color: #fef0f0;
  border-left-color: #f56c6c;
}

.plugin-output .result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.plugin-output .result-type {
  font-size: 14px;
  font-weight: bold;
}

.plugin-output .result-type.reason {
  color: #e6a23c;
}

.plugin-output .result-type.abnormal {
  color: #f56c6c;
}

.plugin-output .result-content {
  padding: 8px;
  margin: 8px 0;
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.plugin-output .result-content code {
  font-family: "Courier New", monospace;
  font-size: 13px;
  color: #2d3748;
  word-break: break-all;
  white-space: pre-wrap;
}

.plugin-output .result-description {
  font-size: 12px;
  font-style: italic;
  color: #666;
}

.plugin-output .no-results {
  padding: 24px;
  text-align: center;
  background-color: #f0f9ff;
  border: 1px solid #e1f5fe;
  border-radius: 8px;
}

.plugin-output .detection-info {
  padding: 12px;
  margin: 16px 0;
  background-color: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
}

.plugin-output .detection-info h4 {
  margin: 0 0 8px;
  font-size: 14px;
  color: #2d3748;
}

.plugin-output .detection-info ul {
  padding-left: 16px;
  margin: 0;
}

.plugin-output .detection-info li {
  margin: 4px 0;
  font-size: 13px;
  color: #4a5568;
}

/* 堆栈检测插件样式 */
.plugin-output .stack-trace-detection {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.plugin-output .severity-badge {
  padding: 4px 8px;
  margin-left: auto;
  font-size: 12px;
  font-weight: bold;
  color: white;
  border-radius: 12px;
}

.plugin-output .issue-analysis {
  margin: 16px 0;
}

.plugin-output .analysis-item {
  padding: 12px;
  margin: 8px 0;
  border-left: 4px solid;
  border-radius: 6px;
}

.plugin-output .analysis-item.critical {
  color: #721c24;
  background-color: #fef0f0;
  border-left-color: #f56c6c;
}

.plugin-output .analysis-item.warning {
  color: #663d04;
  background-color: #fdf6ec;
  border-left-color: #e6a23c;
}

.plugin-output .result-item.stack_info {
  background-color: #fdf6ec;
  border-left-color: #e6a23c;
}

.plugin-output .result-item.stack_dump {
  background-color: #fef0f0;
  border-left-color: #f56c6c;
}

.plugin-output .result-type.stack_info {
  color: #e6a23c;
}

.plugin-output .result-type.stack_dump {
  color: #f56c6c;
}

.plugin-output .success-icon {
  margin-bottom: 16px;
  font-size: 48px;
  text-align: center;
}

.plugin-output .no-results h4 {
  margin: 8px 0;
  color: #67c23a;
}

.plugin-output .tips {
  padding: 12px;
  margin-top: 16px;
  background-color: rgb(103 194 58 / 10%);
  border: 1px solid #67c23a;
  border-radius: 4px;
}

.plugin-output .tips p {
  margin: 0 0 8px;
  font-weight: bold;
  color: #529b2e;
}

.plugin-output .tips ul {
  padding-left: 16px;
  margin: 0;
}

.plugin-output .tips li {
  margin: 4px 0;
  color: #529b2e;
}

.plugin-output .info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin: 12px 0;
}

.plugin-output .info-item {
  padding: 12px;
  background-color: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
}

.plugin-output .info-item h5 {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: bold;
  color: #2d3748;
}

.plugin-output .info-item p {
  margin: 0;
  font-size: 13px;
  line-height: 1.4;
  color: #4a5568;
}

.plugin-output .impact-analysis {
  padding: 12px;
  margin: 16px 0;
  background-color: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 6px;
}

.plugin-output .impact-analysis h5 {
  margin: 0 0 8px;
  font-size: 14px;
  color: #d46b08;
}

.plugin-output .impact-analysis ul {
  padding-left: 16px;
  margin: 0;
}

.plugin-output .impact-analysis li {
  margin: 6px 0;
  font-size: 13px;
  line-height: 1.4;
  color: #8c4510;
}

.plugin-output .impact-analysis strong {
  color: #d46b08;
}

/* CPU使用率分析插件样式 */
.plugin-output .cpu-usage-analysis {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.plugin-output .analysis-summary {
  padding: 16px;
  margin: 16px 0;
  border: 2px solid;
  border-radius: 8px;
}

.plugin-output .overall-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.plugin-output .stat-card {
  padding: 12px;
  text-align: center;
  background-color: rgb(255 255 255 / 80%);
  border: 1px solid #e0e0e0;
  border-radius: 6px;
}

.plugin-output .stat-label {
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: bold;
  color: #666;
}

.plugin-output .stat-value {
  margin-left: 4px;
  font-size: 18px;
  font-weight: bold;
  color: #2d3748;
}

.plugin-output .stat-value.high {
  color: #f56c6c;
}

.plugin-output .peak-analysis {
  padding: 16px;
  margin: 20px 0;
  background-color: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 8px;
}

.plugin-output .peak-summary {
  margin-top: 12px;
}

.plugin-output .peak-item {
  padding: 8px;
  margin: 8px 0;
  background-color: rgb(255 255 255 / 70%);
  border-left: 3px solid #e6a23c;
  border-radius: 4px;
}

.plugin-output .peak-time {
  display: inline-block;
  padding: 2px 6px;
  margin: 2px 4px;
  font-family: monospace;
  font-size: 11px;
  color: white;
  background-color: #f56c6c;
  border-radius: 3px;
}

.plugin-output .cpu-details {
  margin: 20px 0;
}

.plugin-output .cpu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.plugin-output .cpu-card {
  padding: 16px;
  background-color: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.plugin-output .cpu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  margin-bottom: 12px;
  border-bottom: 1px solid #e0e0e0;
}

.plugin-output .cpu-header h5 {
  margin: 0;
  font-size: 16px;
  color: #2d3748;
}

.plugin-output .cpu-stats {
  display: flex;
  gap: 8px;
  font-size: 12px;
}

.plugin-output .avg-usage {
  font-weight: bold;
  color: #409eff;
}

.plugin-output .max-usage {
  font-weight: bold;
  color: #e6a23c;
}

.plugin-output .max-usage.high {
  color: #f56c6c;
}

.plugin-output .peak-count {
  font-weight: bold;
  color: #909399;
}

.plugin-output .peak-count.has-peaks {
  color: #f56c6c;
}

.plugin-output .cpu-chart {
  margin: 12px 0;
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.plugin-output .chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: bold;
  color: #2d3748;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e0e0e0;
}

.plugin-output .data-info {
  font-size: 11px;
  font-weight: normal;
  color: #666;
}

.plugin-output .chart-container {
  position: relative;
  display: flex;
}

.plugin-output .chart-y-axis {
  display: flex;
  flex-direction: column-reverse;
  justify-content: space-between;
  height: 80px;
  padding: 8px 4px;
  background-color: #fafafa;
  border-right: 1px solid #e0e0e0;
}

.plugin-output .y-label {
  font-size: 10px;
  line-height: 1;
  color: #666;
}

.plugin-output .chart-body {
  position: relative;
  display: flex;
  flex: 1;
  align-items: end;
  height: 80px;
  padding: 4px;
  background-color: white;
}

.plugin-output .chart-bar {
  position: relative;
  min-width: 2px;
  margin: 0 1px;
  background: linear-gradient(to top, #409eff 0%, #66b1ff 100%);
  border-radius: 1px 1px 0 0;
  transition: all 0.2s ease;
}

.plugin-output .chart-bar.high {
  background: linear-gradient(to top, #f56c6c 0%, #f78989 100%);
}

.plugin-output .chart-bar.medium {
  background: linear-gradient(to top, #e6a23c 0%, #eebe77 100%);
}

.plugin-output .bar-label {
  position: absolute;
  bottom: -15px;
  left: 50%;
  font-size: 8px;
  color: #666;
  white-space: nowrap;
  transform: translateX(-50%);
}

.plugin-output .peak-indicator {
  position: absolute;
  top: -8px;
  left: 50%;
  width: 6px;
  height: 6px;
  background-color: #f56c6c;
  border: 1px solid white;
  border-radius: 50%;
  transform: translateX(-50%);
}

.plugin-output .legend {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-top: 8px;
  font-size: 12px;
}

.plugin-output .legend-item {
  display: flex;
  gap: 4px;
  align-items: center;
}

.plugin-output .legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.plugin-output .legend-color.normal {
  background: #409eff;
}

.plugin-output .legend-color.medium {
  background: #e6a23c;
}

.plugin-output .legend-color.high {
  background: #f56c6c;
}

.plugin-output .critical-peaks {
  padding: 12px;
  margin: 16px 0;
  background-color: #fef0f0;
  border: 1px solid #f56c6c;
  border-radius: 4px;
}

.plugin-output .peak-detail {
  margin: 2px 0;
  font-family: monospace;
  font-size: 12px;
  color: #721c24;
}

/* ECharts容器样式 */
.plugin-output .echarts-container {
  padding: 16px;
  margin: 20px 0;
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
}

.plugin-output .echarts-chart {
  width: 100%;
  height: 600px;
  min-height: 500px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.plugin-output .no-data-message {
  padding: 40px 20px;
  margin: 20px 0;
  color: #666;
  text-align: center;
  background-color: #f9f9f9;
  border-radius: 4px;
}

/* 内存使用率分析插件样式 */
.plugin-output .memory-usage-analysis {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.plugin-output .memory-usage-analysis .analysis-summary {
  padding: 16px;
  margin: 16px 0;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 2px solid;
  border-radius: 8px;
}

.plugin-output .memory-usage-analysis .overall-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.plugin-output .memory-usage-analysis .stat-card {
  padding: 12px;
  text-align: center;
  background-color: rgb(255 255 255 / 80%);
  border: 1px solid #e0e0e0;
  border-radius: 6px;
}

.plugin-output .memory-usage-analysis .stat-value.high {
  color: #f56c6c;
}

.plugin-output .analysis-info {
  padding: 16px;
  margin: 20px 0;
  background-color: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.plugin-output .info-content p {
  margin: 8px 0;
  font-size: 14px;
  color: #4a5568;
}

.plugin-output .warning-box {
  padding: 12px;
  margin: 12px 0;
  border-left: 4px solid;
  border-radius: 6px;
}

.plugin-output .warning-box.critical {
  color: #721c24;
  background-color: #fef0f0;
  border-left-color: #f56c6c;
}

.plugin-output .warning-box.warning {
  color: #663d04;
  background-color: #fdf6ec;
  border-left-color: #e6a23c;
}

.plugin-output .info-box.normal {
  padding: 12px;
  margin: 12px 0;
  color: #1f5f1f;
  background-color: #f0f9ff;
  border-left: 4px solid;
  border-left-color: #67c23a;
  border-radius: 6px;
}

.plugin-output .debug-info {
  padding: 12px;
  margin-top: 16px;
  background-color: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
}

.plugin-output .debug-info h5 {
  margin: 0 0 8px;
  font-size: 14px;
  color: #2d3748;
}

.plugin-output .debug-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 12px;
}

.plugin-output .debug-item {
  padding: 4px 8px;
  font-size: 12px;
  color: #1976d2;
  background-color: #e3f2fd;
  border: 1px solid #bbdefb;
  border-radius: 4px;
}

.plugin-output .cpu-data-details {
  margin-top: 8px;
}

.plugin-output .cpu-data-details summary {
  padding: 4px 0;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  outline: none;
}

.plugin-output .cpu-data-details summary:hover {
  color: #409eff;
}

.plugin-output .cpu-data-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 4px;
  margin-top: 8px;
}

.plugin-output .cpu-data-item {
  padding: 3px 6px;
  font-size: 11px;
  color: #555;
  text-align: center;
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 3px;
}

.plugin-output .analysis-time,
.plugin-output .format-time,
.plugin-output .search-time,
.plugin-output .error-time,
.plugin-output .detection-time {
  margin-top: 12px;
  font-style: italic;
  color: #909399;
  text-align: right;
}
</style>
