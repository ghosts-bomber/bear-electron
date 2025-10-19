<template>
  <div class="element-demo-container">
    <div class="demo-header">
      <h1>Element-Plus 组件示例</h1>
      <p>这里展示了常用的 Element-Plus 组件及其用法</p>
    </div>

    <div class="demo-content">
      <ElementPlusExample />
    </div>

    <div class="demo-footer">
      <el-button @click="$router.push('/')">
        <el-icon><ArrowLeft /></el-icon>
        返回首页
      </el-button>
      <el-button type="primary" @click="openDocs">
        <el-icon><Document /></el-icon>
        查看文档
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { ArrowLeft, Document } from '@element-plus/icons-vue'
import ElementPlusExample from '@/components/ElementPlusExample.vue'

// 打开文档
const openDocs = () => {
  ElMessage.info('将打开 Element-Plus 官方文档')
  // 在实际应用中，这里可以调用 Electron 的 shell.openExternal
  // shell.openExternal('https://element-plus.org/')
}
</script>

<style scoped>
.element-demo-container {
  min-height: 100vh;
  background: #f8f9fa;
}

.demo-header {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  color: white;
  text-align: center;
  padding: 60px 20px;
}

.demo-header h1 {
  font-size: 2.5rem;
  margin-bottom: 15px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.demo-header p {
  font-size: 1.2rem;
  opacity: 0.9;
}

.demo-content {
  background: white;
  margin: 0;
}

.demo-footer {
  background: #f8f9fa;
  padding: 40px 20px;
  text-align: center;
  border-top: 1px solid #e4e7ed;
}

.demo-footer .el-button {
  margin: 0 10px;
  padding: 12px 24px;
  border-radius: 20px;
}
</style>