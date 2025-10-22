<template>
  <div id="app">
    <Navigation ref="navigation" @menu-select="handleMenuSelect" />
    <!-- <router-view /> -->
    <div class="stacked-container">
      <!-- 使用 v-show 保持组件实例，而不是 v-if 或动态组件 -->
      <div v-show="currentActiveKey === 'jiraAnalysis'" class="page-container">
        <JiraAnalysis />
      </div>
      <div v-show="currentActiveKey === 'log'" class="page-container">
        <Logs />
      </div>
      <div v-show="currentActiveKey === 'record'" class="page-container">
        <Record />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Navigation from './components/Navigation.vue'
import JiraAnalysis from '@/views/JiraAnalysis.vue'
import Logs from '@/views/Logs.vue'
import Record from '@/views/Record.vue'

// Navigation组件引用
const navigation = ref()

// 当前激活的组件key
const currentActiveKey = ref<string>('jiraAnalysis')

// 处理菜单选择
const handleMenuSelect = (key: string) => {
  currentActiveKey.value = key
}
</script>


<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  min-height: 100vh;
  display: flex;
}

#app > * {
  flex-shrink: 0;
}

.stacked-container {
  flex: 1;
  overflow-y: auto;
  position: relative;
}

.page-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow-y: auto;
}
</style>