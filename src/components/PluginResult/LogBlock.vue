<template>
    <div class="log-block">
        <div class="log-container">
            <div v-for="log in props.data.logs" :key="log.line" class="log-line"
                @contextmenu.prevent="handleRightClick(log)">
                <span class="line-number">{{ log.lineNumber }}</span>
                <span class="log-text">{{ log.text }}</span>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import type { LogData } from '@/types/plugin'
const emit = defineEmits<{
    lineClick: [lineNumber: number]
}>()

const props = defineProps<{
    data: LogData
}>()

// 处理右键点击事件
const handleRightClick = (log: { lineNumber: number; text: string }) => {
    emit('lineClick', log.lineNumber)
}
</script>
<style scoped>
.log-block {
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
    margin-bottom: 10px;
    max-height: 400px;
    overflow-x: auto;
    overflow-y: auto;
    background-color: #f8f9fa;
    /* 隔离布局与绘制，降低窗口变化时的重排范围 */
    contain: layout paint;
}

.log-container {
    font-family: 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.4;
}

.log-line {
    display: flex;
    align-items: flex-start;
    padding: 2px 0;
    cursor: pointer;
    transition: background-color 0.2s ease;
    min-width: max-content;
    /* 子行也隔离，避免长文本导致整块重新布局 */
    contain: layout paint;
}

.log-line:hover {
    background-color: #e3f2fd;
}

.log-line:last-child {
    border-bottom: none;
}

.line-number {
    display: inline-block;
    width: 50px;
    min-width: 50px;
    padding-right: 10px;
    color: #6c757d;
    text-align: right;
    font-weight: bold;
    user-select: none;
    border-right: 1px solid #dee2e6;
    margin-right: 10px;
}

.log-text {
    flex: 0 0 auto;
    white-space: pre;
    word-break: normal;
    overflow-wrap: normal;
    color: #212529;
}
</style>
