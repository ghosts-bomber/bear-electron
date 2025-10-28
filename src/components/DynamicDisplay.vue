<template>
  <div class="dynamic-display">
    <div
      v-for="(item, index) in items"
      :key="item.id"
      class="dynamic-item"
    >
      <component
        :is="getComponent(item.type)"
        :data="item.data"
        @lineClick="handleLineClick"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { reactive, ref, markRaw } from 'vue'
import TextBlock from '@/components/PluginResult/TextBlock.vue'
import LogBlock from '@/components/PluginResult/LogBlock.vue'
import ChartBlock from '@/components/PluginResult/ChartBlock.vue'
import ImageBlock from '@/components/PluginResult/ImageBlock.vue'
import type { PluginData, LogItem, AnalysisPluginResult } from '@/types/plugin'
import { BlockType, composeTextDataResult, composeLogDataResult, composeChartDataResult } from '@/types/plugin'
const emit = defineEmits<{
  lineClick:[line:number]
}>()
export interface Block {
  id: number
  type: BlockType
  data: PluginData
}

const items = ref<Block[]>([])
const inViewportMap = reactive<Record<number, boolean>>({})
let itemIdCounter = 0

const getComponent = (type: BlockType): Component => {
  switch (type) {
    case BlockType.TEXT:
      return markRaw(TextBlock)
    case BlockType.LOG:
      return markRaw(LogBlock)
    case BlockType.IMAGE:
      return markRaw(ImageBlock)
    case BlockType.CHART:
      return markRaw(ChartBlock)
    default:
      throw new Error(`Unknown block type: ${type}`)
  }
}

function pushItem(data: AnalysisPluginResult) {
  items.value.push({
    id: ++itemIdCounter,
    type: data.type,
    data: data.data,
  })
}

function clear() {
  items.value = []
  Object.keys(inViewportMap).forEach(key => {
    delete inViewportMap[Number(key)]
  })
  itemIdCounter = 0
}

function addRandomItems(n = 1) {
  for (let i = 0; i < n; i++) {
    pushItem(composeTextDataResult(`动态文字示例 — #${itemIdCounter}`))
    const logs: LogItem[] = []
    for (let i = -0; i < 2000; i++) {
      logs.push({ lineNumber: i, text: `动态日志示例 ========++=================— #${itemIdCounter}` })
    }
    pushItem(composeLogDataResult(logs))
    const option = {
      title: {
        text: '动态图表示例 — #' + itemIdCounter
      },
      xAxis: {
        type: 'category',
        data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      },
      yAxis: {
        type: 'value'
      },
      series: [{
        data: [150, 230, 224, 218, 135, 147, 260],
        type: 'line'
      }]
    }
    pushItem(composeChartDataResult( `动态图表示例 — #${itemIdCounter}`, option))
  }
}

// 处理日志行点击事件
const handleLineClick = (lineNumber: number) => {
  console.log(`点击了日志行号: ${lineNumber}`)
  emit('lineClick', lineNumber)
}
const handleEditorAction = async (action: {
  action: string;
  text?: string;
  value?: string;
  pluginName?: string;
  pluginId?: string;
  result?: AnalysisPluginResult[];
}) => {
  const timestamp = new Date().toLocaleTimeString();
  let actionContent = "";

  switch (action.action) {
    case "plugin-processing":
      actionContent = `${timestamp}🔄 ${action.text}`;
      pushItem(composeTextDataResult(actionContent))
      break;
    case "plugin-result":
      if (action.result) {
        for (let iter of action.result) {
          pushItem(iter)
        }
      }
      break;
    case "plugin-error":
      actionContent = `${timestamp}❌ 插件错误：${action.text}`;
      pushItem(composeTextDataResult(actionContent))
      break;
  }
}
// 导出方法供外部使用
defineExpose({
  pushItem,
  clear,
  addRandomItems,
  handleEditorAction
})
</script>

<style scoped>
.dynamic-display {
  height: 100%;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  contain: layout paint;
}

.dynamic-item {
  padding: 8px;
  border-bottom: 1px solid #eee;
  contain: layout paint;
}
</style>