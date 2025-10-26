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
import type { BlockType, PluginData, LogData, AnalysisPluginResult } from '@/types/plugin'
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
    case "text":
      return markRaw(TextBlock)
    case "log":
      return markRaw(LogBlock)
    case "image":
      return markRaw(ImageBlock)
    case "chart":
      return markRaw(ChartBlock)
    default:
      throw new Error(`Unknown block type: ${type}`)
  }
}

function pushItem(type: BlockType, data: PluginData) {
  items.value.push({
    id: ++itemIdCounter,
    type,
    data
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
    pushItem('text', ({ text: '动态文字示例 — #' + itemIdCounter }))
    const logs: LogData = { logs: [] }
    for (let i = -0; i < 2000; i++) {
      logs.logs.push({ lineNumber: i, text: '动态日志示例 ========++=================— #' + itemIdCounter })
    }
    pushItem('log', logs)
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
    pushItem('chart', ({ title: '动态图表示例 — #' + itemIdCounter, option }))
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
      pushItem('text', ({ text: actionContent }))
      break;
    case "plugin-result":
      if (action.result) {
        for (let iter of action.result) {
          pushItem(iter.type, iter.data)
        }
      }
      break;
    case "plugin-error":
      actionContent = `${timestamp}❌ 插件错误：${action.text}`;
      pushItem('text', ({ text: actionContent }))
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