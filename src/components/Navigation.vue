<template>
  <div class="navigation">
    <el-menu
      :default-active="activeIndex"
      mode="horizontal"
      @select="handleSelect"
      background-color="#545c64"
      text-color="#fff"
      active-text-color="#ffd04b"
      class="nav-menu"
    >
      <div class="nav-brand">
        <el-icon><Platform /></el-icon>
        <span>Bear Electron</span>
      </div>
      
      <div class="nav-items">
        <el-menu-item index="/">
          <el-icon><House /></el-icon>
          <span>首页</span>
        </el-menu-item>
        
        <el-menu-item index="/element-demo">
          <el-icon><Grid /></el-icon>
          <span>组件示例</span>
        </el-menu-item>
        
        <el-menu-item index="/about">
          <el-icon><InfoFilled /></el-icon>
          <span>关于</span>
        </el-menu-item>
      </div>

      <div class="nav-actions">
        <el-button type="text" @click="toggleTheme">
          <el-icon><Moon v-if="isDark" /><Sunny v-else /></el-icon>
        </el-button>
        
        <el-dropdown @command="handleCommand">
          <el-button type="text">
            <el-icon><Setting /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="settings">设置</el-dropdown-item>
              <el-dropdown-item command="help">帮助</el-dropdown-item>
              <el-dropdown-item divided command="about">关于应用</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  Platform, 
  House, 
  Grid, 
  InfoFilled, 
  Moon, 
  Sunny, 
  Setting 
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

// 当前激活的菜单项
const activeIndex = computed(() => route.path)

// 主题切换
const isDark = ref(false)

// 菜单选择处理
const handleSelect = (key: string) => {
  router.push(key)
}

// 主题切换
const toggleTheme = () => {
  isDark.value = !isDark.value
  ElMessage.info(isDark.value ? '已切换到深色主题' : '已切换到浅色主题')
  // 这里可以实现实际的主题切换逻辑
}

// 下拉菜单命令处理
const handleCommand = (command: string) => {
  switch (command) {
    case 'settings':
      ElMessage.info('设置功能待实现')
      break
    case 'help':
      ElMessage.info('帮助功能待实现')
      break
    case 'about':
      router.push('/about')
      break
  }
}

// 监听路由变化
watch(route, (newRoute) => {
  console.log('当前路由:', newRoute.path)
})
</script>

<style scoped>
.navigation {
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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