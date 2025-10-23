<template>
    <div class="aip-stack">
        <el-tabs v-model="currentTab" type="card" editable addable @edit="handleTabsEdit">
            <el-tab-pane v-for="tab in jiraTabs" :key="tab.name" :label="tab.title" :name="tab.name">
                <component :is="tab.component" @aip-code-display="(aipCode:string) => handleAipCodeDisplay(aipCode, tab.name)"/>
            </el-tab-pane>
        </el-tabs>
    </div>
</template>

<script setup lang="ts">
import { ref, markRaw } from 'vue'
import AipAnalysis from '@/views/AipAnalysis.vue';
import type { TabPaneName } from 'element-plus'
interface TabItem {
    title: string;
    name: string;
    component: any;
}
let tabIndex = 0
const jiraTabs = ref<TabItem[]>([
    {
        title: "jira",
        name: `${tabIndex++}`,
        component: markRaw(AipAnalysis),
    }
])
const currentTab = ref<string>(jiraTabs.value[0].name);
const handleTabsEdit = (targetName: TabPaneName | undefined,
    action: 'remove' | 'add') => {
    if (action === 'add') {
        const newTab = {
            title: `jira`,
            name: `${tabIndex++}`,
            component: markRaw(AipAnalysis),
        };
        jiraTabs.value.push(newTab);
        currentTab.value = newTab.name;
    }
    if (action === 'remove') {
        const idx = jiraTabs.value.findIndex(t => t.name === targetName)
        if (idx > -1) {
            jiraTabs.value.splice(idx, 1)
            // 如果关闭的是当前激活的 tab，则激活前一个或后一个
            if (currentTab.value === targetName) {
                const nextTab = jiraTabs.value[idx] || jiraTabs.value[idx - 1]
                currentTab.value = nextTab ? nextTab.name : ''
            }
        }
    }
}
const handleAipCodeDisplay = (aipCode: string, tabName: string) => {
    console.log(aipCode, tabName) 
    // 找到对应的tab并修改其name值为aipCode
    const targetTab = jiraTabs.value.find(tab => tab.name === tabName);
    if (targetTab) {
        targetTab.title = aipCode;
    }
}
</script>

<style scoped>
.aip-stack {
    height: 100%;
    width: 100%;
}

.aip-stack :deep(.el-tabs) {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.aip-stack :deep(.el-tabs__content) {
    flex: 1;
    overflow: hidden;
}

.aip-stack :deep(.el-tab-pane) {
    height: 100%;
    overflow: hidden;
}

.aip-stack :deep(.el-tabs__header) {
    margin: 0;
}

.aip-stack :deep(.el-tabs__nav-wrap) {
    display: flex;
    align-items: center;
    justify-content: flex-start;
}

.aip-stack :deep(.el-tabs__nav-scroll) {
    display: flex;
    align-items: center;
    width: auto;
    overflow: visible;
}

.aip-stack :deep(.el-tabs__nav) {
    display: flex;
    align-items: center;
    float: none;
    position: relative;
}

.aip-stack :deep(.el-tabs__new-tab) {
    position: static !important;
    right: auto !important;
    margin-left: 8px;
    margin-right: 0;
    order: 1;
}
</style>