<template>
    <div class="dynamic-display"> 
            <div v-for="item in items" :key="item.id" class="dynamic-item">
                <component :is="item.component" :data="item.data"/>
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
import type {BlockType, PluginData,LogData } from '@/type/plugin'


export interface Block {
    id: number
    type: BlockType
    component: Component
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

function pushItem(type: BlockType, data:PluginData) {
    const component = getComponent(type)
    items.value.push({
        id: ++itemIdCounter,
        type,
        component,
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
        const logs:LogData = { logs: [] }
        for(let i=-0;i<2000;i++){
            logs.logs.push({ line: i, text: '动态日志示例 — #' + itemIdCounter })
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

// 导出方法供外部使用
defineExpose({
    pushItem,
    clear,
    addRandomItems
})
</script>

<style scoped>
.dynamic-display {
    height: 100%;
    width: 100%;
    overflow-y: auto;
    overflow-x: hidden;
}

.scroller {
    height: 100%;
}

.dynamic-item {
    padding: 8px;
    border-bottom: 1px solid #eee;
}
</style>