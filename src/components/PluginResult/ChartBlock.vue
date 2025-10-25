<template>
    <div class="chart-title">{{ props.data.title }}</div>
    <div class="chart-block" ref="chartRef" style="width:100%;height:300px;"></div>
</template>
<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import type { ChartData } from '@/type/plugin'

const props = defineProps<{ data: ChartData }>()
const chartRef = ref(null)
let chartInstance: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null

const handleResize = () => {
    if (chartInstance) {
        chartInstance.resize()
    }
}

onMounted(() => {
    chartInstance = echarts.init(chartRef.value)
    chartInstance.setOption(props.data.option)
    
    // 监听窗口大小变化
    window.addEventListener('resize', handleResize)
    
    // 使用ResizeObserver监听容器大小变化（更精确）
    if (chartRef.value && window.ResizeObserver) {
        resizeObserver = new ResizeObserver(() => {
            handleResize()
        })
        resizeObserver.observe(chartRef.value)
    }
})

onUnmounted(() => {
    // 清理事件监听器
    window.removeEventListener('resize', handleResize)
    
    // 清理ResizeObserver
    if (resizeObserver) {
        resizeObserver.disconnect()
        resizeObserver = null
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
    padding: 6px
}
</style>