<template>
  <div class="navigation">
    <el-menu
    :default-active="currentActive"
    class="sidebar-menu"
    @select="handleMenuSelect"
    >
    <el-menu-item index="jiraAnalysis" >
      <el-icon><DataAnalysis /></el-icon>
      <template #title>Jira分析</template>
    </el-menu-item>
    <el-menu-item index="log">
      <el-icon> <Document /></el-icon>
      <template #title>日志分析</template>
    </el-menu-item>
    <el-menu-item index="record">
      <el-icon><VideoCamera /></el-icon>
      <template #title>Record分析</template>
    </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 当前激活的菜单项
const currentActive = ref('jiraAnalysis')

// 定义事件
const emit = defineEmits<{
  menuSelect: [key: string]
}>()

// 处理菜单选择
const handleMenuSelect = (key: string) => {
  currentActive.value = key
  emit('menuSelect', key)
}

// 暴露给父组件的方法和数据
defineExpose({
  currentActive
})
</script>

<style scoped>
.navigation {
  height: 100vh;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.sidebar-menu {
  width: 200px;
  height: 100vh;
  background: #f5f7fa;
  border-right: 1px solid #e2e8f0;
  position: relative;
}

.sidebar-menu .el-menu-item {
  height: 60px;
  line-height: 60px;
  font-size: 14px;
  justify-content: flex-start;
  width: 100%;
}

.sidebar-menu .el-icon {
  margin-right: 10px;
  font-size: 16px;
}
.nav-menu {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: none;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #ffd04b;
  font-weight: 600;
  font-size: 1.2rem;
  margin-right: 40px;
}

.nav-brand .el-icon {
  font-size: 24px;
}

.nav-items {
  display: flex;
  flex: 1;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-actions .el-button {
  color: #fff;
  border: none;
  background: transparent;
}

.nav-actions .el-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

:deep(.el-menu-item) {
  border-bottom: none !important;
}

:deep(.el-menu-item:hover) {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

:deep(.el-menu-item.is-active) {
  background-color: rgba(255, 208, 75, 0.2) !important;
}

@media (max-width: 768px) {
  .nav-menu {
    padding: 0 10px;
  }
  
  .nav-brand span {
    display: none;
  }
  
  .nav-items .el-menu-item span {
    display: none;
  }
}
</style>