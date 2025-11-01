<template>
    <div class="auto-analysis">
        <div class="auto-analysis-top">
            <select class="analysis-type-select" v-model="analysisTypeSelect">
                <option v-for="(type, value) in AnalysisTypeMap" :key="value" :value="value">{{ type }}</option>
            </select>
            <el-button type="primary" @click="handleAnalysis">分析</el-button>
        </div>
        <DynamicDisplay />
    </div>
</template>

<script setup lang="ts">
import DynamicDisplay from '@/components/DynamicDisplay.vue';
import { AnalysisTypeMap } from '@/types/plugin';
import { ref } from 'vue'
const analysisTypeSelect = ref<any>(null);
const handleAnalysis = async () => {
    const analysisType = analysisTypeSelect.value;
}
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
