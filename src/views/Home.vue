<template>
  <div class="home-container">
    <div class="navigation-section">
      <div class="section-header">
        <h2 class="section-title">功能模块</h2>
        <p class="section-subtitle">选择您需要的功能模块开始工作</p>
      </div>
      <div class="nav-grid">
        <!-- AIP/GC Analysis -->
        <div class="nav-card aip" @click="navigateTo('/aipgc')">
          <div class="card-content">
            <div class="card-icon">
              <el-icon size="48" color="#67C23A">
                <DataAnalysis />
              </el-icon>
            </div>
            <div class="card-info">
              <h3 class="card-title">AIP/GC 分析</h3>
              <p class="card-description">智能问题诊断与故障分析</p>
            </div>
            <div class="card-action">
              <el-button type="success" size="large">
                立即使用
                <el-icon class="el-icon--right"><ArrowRight /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
        <!-- Recorder Management -->
        <div class="nav-card recorder" @click="navigateTo('/recorder')">
          <div class="card-content">
            <div class="card-icon">
              <el-icon size="48" color="#E6A23C">
                <VideoCamera />
              </el-icon>
            </div>
            <div class="card-info">
              <h3 class="card-title">Record分析</h3>
              <p class="card-description">尚未开发完成 敬请期待</p>
            </div>
            <div class="card-action">
              <el-button type="warning" size="large">
                立即使用
                <el-icon class="el-icon--right"><ArrowRight /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
        <!-- Log Analysis -->
        <div class="nav-card logs" @click="navigateTo('/log')">
          <div class="card-content">
            <div class="card-icon">
              <el-icon size="48" color="#F56C6C">
                <Document />
              </el-icon>
            </div>
            <div class="card-info">
              <h3 class="card-title">日志分析</h3>
              <p class="card-description">同上 敬请期待</p>
            </div>
            <div class="card-action">
              <el-button type="danger" size="large">
                不要点我
                <el-icon class="el-icon--right"><ArrowRight /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { DataAnalysis, VideoCamera, Document, ArrowRight } from "@element-plus/icons-vue";
import { ElMessage } from 'element-plus';

const router = useRouter();
const navigateTo = (path: string) => {
  router.push(path);
};
</script>

<style scoped lang="scss">
.home-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  min-height: 100vh;
  background: #fff;
}

.navigation-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 1400px;
  min-height: 70vh;
  padding: 40px 20px;
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 4px 32px rgb(0 0 0 / 4%);
}

.section-header {
  margin-bottom: 40px;
  text-align: center;
}

.section-title {
  margin: 0 0 12px;
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
}

.section-subtitle {
  margin: 0;
  font-size: 16px;
  font-weight: 400;
  color: #64748b;
}

.nav-grid {
  display: flex;
  flex-flow: row nowrap;
  gap: 32px;
  width: 100%;
  max-width: 1400px;
}

.nav-card {
  position: relative;
  flex: 1 1 0;
  min-width: 0;
  overflow: hidden;
  cursor: pointer;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  box-shadow: 0 4px 24px rgb(0 0 0 / 6%);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.nav-card:hover {
  box-shadow: 0 12px 32px rgb(0 0 0 / 12%);
  transform: translateY(-4px);
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  padding: 32px 24px;
}

.card-icon {
  align-self: flex-start;
  padding: 12px;
  background: rgb(0 0 0 / 5%);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.nav-card:hover .card-icon {
  transform: scale(1.08);
}

.card-info {
  flex: 1;
}

.card-title {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}

.card-description {
  margin: 0 0 12px;
  font-size: 15px;
  line-height: 1.6;
  color: #64748b;
}

.card-features {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.feature-tag {
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  color: #475569;
  background: #f1f5f9;
  border-radius: 20px;
  transition: all 0.3s ease;
}

.nav-card.aip:hover .feature-tag {
  color: #67c23a;
  background: rgb(103 194 58 / 10%);
}

.nav-card.recorder:hover .feature-tag {
  color: #e6a23c;
  background: rgb(230 162 60 / 10%);
}

.nav-card.logs:hover .feature-tag {
  color: #f56c6c;
  background: rgb(245 108 108 / 10%);
}

.card-action {
  margin-top: auto;
}

@media (width <= 1200px) {
  .navigation-section {
    max-width: 98vw;
    min-height: 60vh;
    padding: 30px 10px;
  }

  .nav-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    max-width: 98vw;
  }
}

@media (width <= 768px) {
  .navigation-section {
    min-height: 40vh;
    padding: 20px 4px;
  }

  .nav-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .card-content {
    padding: 20px 10px;
  }
}
</style>
