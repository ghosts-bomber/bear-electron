<template>
  <div class="about-container">
    <div class="about-content">
      <div class="about-header">
        <el-avatar :size="120" src="/vite.svg" />
        <h1>Bear Electron</h1>
        <p class="version">版本 {{ appInfo.version }}</p>
      </div>

      <el-divider />

      <div class="about-info">
        <el-descriptions title="应用信息" :column="1" border>
          <el-descriptions-item label="应用名称">{{ appInfo.name }}</el-descriptions-item>
          <el-descriptions-item label="版本号">{{ appInfo.version }}</el-descriptions-item>
          <el-descriptions-item label="构建时间">{{ appInfo.buildTime }}</el-descriptions-item>
          <el-descriptions-item label="开发框架">{{ appInfo.framework }}</el-descriptions-item>
          <el-descriptions-item label="UI 组件库">{{ appInfo.uiLibrary }}</el-descriptions-item>
          <el-descriptions-item label="运行环境">{{ appInfo.runtime }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <el-divider />

      <div class="tech-stack">
        <h3>技术栈</h3>
        <div class="tech-tags">
          <el-tag 
            v-for="tech in techStack" 
            :key="tech.name"
            :type="tech.type"
            size="large"
            class="tech-tag"
          >
            {{ tech.name }}
          </el-tag>
        </div>
      </div>

      <el-divider />

      <div class="features">
        <h3>主要特性</h3>
        <el-timeline>
          <el-timeline-item
            v-for="feature in features"
            :key="feature.title"
            :icon="feature.icon"
            :type="feature.type"
          >
            <h4>{{ feature.title }}</h4>
            <p>{{ feature.description }}</p>
          </el-timeline-item>
        </el-timeline>
      </div>

      <el-divider />

      <div class="contact">
        <h3>联系方式</h3>
        <el-space wrap>
          <el-button type="primary" @click="openGithub">
            <el-icon><Link /></el-icon>
            GitHub
          </el-button>
          <el-button @click="showContact">
            <el-icon><Message /></el-icon>
            联系我们
          </el-button>
          <el-button @click="checkUpdate">
            <el-icon><Refresh /></el-icon>
            检查更新
          </el-button>
        </el-space>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Link, Message, Refresh, Star, Lightning, Shield, Tools } from '@element-plus/icons-vue'

// 应用信息
const appInfo = ref({
  name: 'Bear Electron',
  version: '1.0.0',
  buildTime: new Date().toLocaleDateString(),
  framework: 'Vue 3 + TypeScript',
  uiLibrary: 'Element-Plus',
  runtime: 'Electron'
})

// 技术栈
const techStack = ref([
  { name: 'Vue 3', type: 'success' },
  { name: 'TypeScript', type: 'primary' },
  { name: 'Element-Plus', type: 'info' },
  { name: 'Electron', type: 'warning' },
  { name: 'Vite', type: 'danger' },
  { name: 'Node.js', type: '' }
])

// 主要特性
const features = ref([
  {
    title: '现代化开发',
    description: '使用 Vue 3 Composition API 和 TypeScript，提供更好的开发体验',
    icon: Lightning,
    type: 'primary'
  },
  {
    title: '跨平台支持',
    description: '基于 Electron 构建，支持 Windows、macOS 和 Linux 操作系统',
    icon: Star,
    type: 'success'
  },
  {
    title: '安全可靠',
    description: '采用最新的安全实践，确保应用程序的安全性和稳定性',
    icon: Shield,
    type: 'warning'
  },
  {
    title: '易于扩展',
    description: '模块化架构设计，便于功能扩展和维护',
    icon: Tools,
    type: 'info'
  }
])

// 打开 GitHub
const openGithub = () => {
  // 在实际应用中，这里可以调用 Electron 的 shell.openExternal
  ElMessage.info('GitHub 链接功能待实现')
}

// 显示联系信息
const showContact = () => {
  ElMessage({
    message: '联系邮箱: contact@example.com',
    type: 'info',
    duration: 3000
  })
}

// 检查更新
const checkUpdate = () => {
  ElMessage.success('当前已是最新版本！')
}
</script>

<style scoped>
.about-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 40px 20px;
}

.about-content {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.about-header {
  text-align: center;
  margin-bottom: 30px;
}

.about-header h1 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin: 20px 0 10px 0;
}

.version {
  color: #7f8c8d;
  font-size: 1.1rem;
}

.about-info {
  margin: 30px 0;
}

.tech-stack h3,
.features h3,
.contact h3 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 1.5rem;
}

.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tech-tag {
  font-size: 14px;
  padding: 8px 16px;
}

.features {
  margin: 30px 0;
}

.contact {
  text-align: center;
  margin-top: 30px;
}

:deep(.el-timeline-item__content) h4 {
  margin: 0 0 10px 0;
  color: #409eff;
}

:deep(.el-timeline-item__content) p {
  margin: 0;
  color: #606266;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .about-content {
    padding: 20px;
    margin: 20px;
  }
  
  .about-header h1 {
    font-size: 2rem;
  }
  
  .tech-tags {
    justify-content: center;
  }
}
</style>