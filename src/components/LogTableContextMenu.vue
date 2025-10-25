<template>
  <teleport to="body">
    <div
      v-if="visible"
      ref="menuRef"
      class="log-table-context-menu"
      :style="menuStyle"
      @contextmenu.prevent
    >
      <div
        class="context-menu-item"
        @click="handleOpenWithDefaultApp"
      >
        <el-icon class="menu-icon"><FolderOpened /></el-icon>
        <span>用默认应用打开</span>
      </div>
      <div class="menu-divider"></div>
      <div
        class="context-menu-item"
        @click="handleOpenFolder"
      >
        <el-icon class="menu-icon"><Folder /></el-icon>
        <span>打开文件所在文件夹</span>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { FolderOpened, Folder } from '@element-plus/icons-vue'

interface LogFileInfo {
  cut: boolean;
  filesize: number;
  name: string;
  objName: string;
  updateTime: string;
  containErrorTime?: boolean;
}

interface MenuPosition {
  x: number;
  y: number;
}

const props = defineProps<{
  visible: boolean;
  position: MenuPosition;
  logFile: LogFileInfo | null;
  jiraIssueKey: string;
}>()

const emit = defineEmits<{
  close: []
}>()

const menuRef = ref<HTMLElement>()

// 计算菜单位置样式
const menuStyle = computed(() => {
  if (!props.visible || !props.position) return {}
  
  return {
    position: 'fixed',
    top: `${props.position.y}px`,
    left: `${props.position.x}px`,
    zIndex: 9999
  }
})

// 用默认应用打开文件
const handleOpenWithDefaultApp = async () => {
  if (!props.logFile) return
  
  try {
    const loadingMessage = ElMessage({
      message: `正在打开文件 ${props.logFile.name}...`,
      type: 'info',
      duration: 0
    });

    // 调用 Electron IPC 打开文件
    const result = await window.electronAPI?.openJiraFileWithDefaultApp(
      props.jiraIssueKey,
      props.logFile.name,
      props.logFile.objName
    );

    loadingMessage.close();

    if (result?.success) {
      ElMessage.success(`文件 ${props.logFile.name} 已用默认应用打开`);
    } else {
      ElMessage.error(result?.message || '打开文件失败');
    }
  } catch (error) {
    console.error('Error opening file with default app:', error);
    ElMessage.error(`打开文件 ${props.logFile.name} 时出错`);
  }
  
  emit('close')
}

// 打开文件所在文件夹
const handleOpenFolder = async () => {
  if (!props.logFile) return
  
  try {
    const loadingMessage = ElMessage({
      message: '正在打开文件夹...',
      type: 'info',
      duration: 0
    });

    // 调用 Electron IPC 打开文件夹
    const result = await window.electronAPI?.viewJiraFileFolder(
      props.jiraIssueKey
    );

    loadingMessage.close();

    if (result?.success) {
      ElMessage.success('文件夹已打开');
    } else {
      ElMessage.error(result?.message || '打开文件夹失败');
    }
  } catch (error) {
    console.error('Error opening file folder:', error);
    ElMessage.error('打开文件夹时出错');
  }
  
  emit('close')
}

// 点击外部关闭菜单
const handleClickOutside = (event: MouseEvent) => {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    emit('close')
  }
}

// 键盘事件处理
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.log-table-context-menu {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 180px;
  padding: 4px 0;
  font-size: 14px;
  user-select: none;
}

.context-menu-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  color: #606266;
  transition: all 0.2s ease;
}

.context-menu-item:hover {
  background-color: #f5f7fa;
  color: #409eff;
}

.menu-icon {
  margin-right: 8px;
  font-size: 16px;
}

.menu-divider {
  height: 1px;
  background-color: #e4e7ed;
  margin: 4px 0;
}

/* 动画效果 */
.log-table-context-menu {
  animation: fadeInScale 0.15s ease-out;
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>