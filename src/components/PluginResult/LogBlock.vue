<template>
    <div class="log-block">
        <div class="log-container">
            <div 
                v-for="log in props.data.logs" 
                :key="log.line"
                class="log-line"
                @contextmenu.prevent="handleRightClick(log)"
            >
                <span class="line-number">{{ log.line }}</span>
                <span class="log-text">{{ log.text }}</span>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import type { LogData } from '@/type/plugin'

const props = defineProps<{
    data: LogData
}>()

// 处理右键点击事件
const handleRightClick = (log: { line: number; text: string }) => {
    console.log(`右键点击日志行号: ${log.line}`)
    console.log(`日志内容: ${log.text}`)
}
</script>
<style scoped>
.log-block {
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
    margin-bottom: 10px;
    max-height: 400px;
    overflow: auto;
    background-color: #f8f9fa;
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
    border-bottom: 1px solid #e9ecef;
    cursor: pointer;
    transition: background-color 0.2s ease;
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
    flex: 1;
    word-break: break-all;
    white-space: pre-wrap;
    color: #212529;
}
</style>
