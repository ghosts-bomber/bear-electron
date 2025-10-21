<template>
  <div class="navigation">
    <el-menu
    default-active="/aipgc/login"
    class="sidebar-menu"
    router="true"
    >
    <el-menu-item index="/aipgc/login" >
      <el-icon><DataAnalysis /></el-icon>
      <template #title>Jira分析</template>
    </el-menu-item>
    <el-menu-item index="/about">
      <el-icon> <Document /></el-icon>
      <template #title>日志分析</template>
    </el-menu-item>
    <el-menu-item index="/element-demo">
      <el-icon><VideoCamera /></el-icon>
      <template #title>Record分析</template>
    </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 定义菜单项路由列表
const menuRoutes = ['/aipgc', '/log', '/recorder']

// 组件挂载时处理默认路由
onMounted(() => {
  // 只有在当前路由是根路径时才跳转到第一个菜单项
  if (route.path === '/' || route.path === '') {
    // 使用 el-menu 的 default-active 属性，它会自动处理路由跳转
    // 这里不需要手动跳转，因为 el-menu 的 default-active="/aipgc" 已经设置了
    console.log('默认路由已设置到第一个菜单项')
  }
})

// 监听路由变化
watch(route, (newRoute) => {
  console.log('当前路由:', newRoute.path)
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