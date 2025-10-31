<template>
    <div class="auto-analysis">
        <div class="auto-analysis-top">
            <select class="analysis-type-select">
                <option value="1">分析类型1</option>
                <option value="2">分析类型2</option>
                <option value="3">分析类型3</option>
            </select>
            <el-button type="primary">分析</el-button>
        </div>
        <DynamicDisplay />
    </div>
</template>

<script setup lang="ts">
import DynamicDisplay from '@/components/DynamicDisplay.vue';

</script>

<style scoped lang="scss">
.auto-analysis {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}
</style>
