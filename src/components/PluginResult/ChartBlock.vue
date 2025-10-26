<template>
    <div class="chart-title">{{ props.data.title }}</div>
    <div class="chart-block" ref="chartRef" style="width:100%;height:300px;"></div>
</template>
<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import type { ChartData } from '@/types/plugin'
import { ChatDotRound } from '@element-plus/icons-vue/dist/types';

const props = defineProps<{ data: ChartData }>()
const chartRef = ref(null)
let chartInstance: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null

let rafId:number|null = null;
const scheduleResize = ()=>{
    if(!chartInstance) return;
    if(rafId!==null) return;
    rafId = requestAnimationFrame(()=>{
        rafId = null
        chartInstance!.resize()
    })
}

onMounted(() => {
    chartInstance = echarts.init(chartRef.value)
    chartInstance.setOption(props.data.option)
    // 移除全局 window.resize 监听，改为容器级监听 + 微防抖
    if(chartRef.value && window.ResizeObserver) {
        resizeObserver = new ResizeObserver(() => {
            scheduleResize()
        })
        resizeObserver.observe(chartRef.value)
    }
})

onUnmounted(() => {
    // 清理ResizeObserver
    if (resizeObserver) {
        resizeObserver.disconnect()
        resizeObserver = null
    }
     // 取消 pending 的 rAF
    if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
    }
    // 销毁图表实例
    if (chartInstance) {
        chartInstance.dispose()
        chartInstance = null
    }
})

watch(() => props.data.option, (newOpt) => {
    if (chartInstance) {
        chartInstance.setOption(newOpt)
    }
})
</script>
<style scoped>
.chart-block {
    background: white;
    border-radius: 6px;
    padding: 6px;
    min-height: 500px;
    max-height: 800px;
    /* 隔离布局与绘制，降低重排/重绘的传播 */
    contain: layout paint;
}
</style>