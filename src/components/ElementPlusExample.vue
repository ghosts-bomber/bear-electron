<template>
  <div class="element-plus-example">
    <h2>Element-Plus 控件示例</h2>
    
    <!-- 按钮示例 -->
    <div class="demo-section">
      <h3>按钮 (Button)</h3>
      <el-button>默认按钮</el-button>
      <el-button type="primary">主要按钮</el-button>
      <el-button type="success">成功按钮</el-button>
      <el-button type="info">信息按钮</el-button>
      <el-button type="warning">警告按钮</el-button>
      <el-button type="danger">危险按钮</el-button>
    </div>

    <!-- 输入框示例 -->
    <div class="demo-section">
      <h3>输入框 (Input)</h3>
      <el-input v-model="inputValue" placeholder="请输入内容" style="width: 300px;" />
      <p>输入的内容：{{ inputValue }}</p>
    </div>

    <!-- 选择器示例 -->
    <div class="demo-section">
      <h3>选择器 (Select)</h3>
      <el-select v-model="selectValue" placeholder="请选择" style="width: 300px;">
        <el-option label="选项1" value="option1" />
        <el-option label="选项2" value="option2" />
        <el-option label="选项3" value="option3" />
      </el-select>
      <p>选择的值：{{ selectValue }}</p>
    </div>

    <!-- 日期选择器示例 -->
    <div class="demo-section">
      <h3>日期选择器 (DatePicker)</h3>
      <el-date-picker
        v-model="dateValue"
        type="date"
        placeholder="选择日期"
        style="width: 300px;"
      />
      <p>选择的日期：{{ dateValue }}</p>
    </div>

    <!-- 表格示例 -->
    <div class="demo-section">
      <h3>表格 (Table)</h3>
      <el-table :data="tableData" style="width: 100%">
        <el-table-column prop="name" label="姓名" width="180" />
        <el-table-column prop="age" label="年龄" width="180" />
        <el-table-column prop="address" label="地址" />
      </el-table>
    </div>

    <!-- 消息提示示例 -->
    <div class="demo-section">
      <h3>消息提示 (Message)</h3>
      <el-button @click="showMessage('success')">成功消息</el-button>
      <el-button @click="showMessage('warning')">警告消息</el-button>
      <el-button @click="showMessage('error')">错误消息</el-button>
    </div>

    <!-- 对话框示例 -->
    <div class="demo-section">
      <h3>对话框 (Dialog)</h3>
      <el-button @click="dialogVisible = true">打开对话框</el-button>
      <el-dialog v-model="dialogVisible" title="提示" width="30%">
        <span>这是一个对话框示例</span>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="dialogVisible = false">确定</el-button>
          </span>
        </template>
      </el-dialog>
    </div>

    <!-- 图标示例 -->
    <div class="demo-section">
      <h3>图标 (Icons)</h3>
      <el-button :icon="Edit">编辑</el-button>
      <el-button :icon="Delete">删除</el-button>
      <el-button :icon="Search">搜索</el-button>
      <el-button :icon="Plus">添加</el-button>
    </div>

    <!-- 卡片示例 -->
    <div class="demo-section">
      <h3>卡片 (Card)</h3>
      <el-card class="box-card" style="width: 480px;">
        <template #header>
          <div class="card-header">
            <span>卡片标题</span>
            <el-button class="button" text>操作按钮</el-button>
          </div>
        </template>
        <div>这是卡片的内容区域</div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Edit, Delete, Search, Plus } from '@element-plus/icons-vue'

// 响应式数据
const inputValue = ref('')
const selectValue = ref('')
const dateValue = ref('')
const dialogVisible = ref(false)

// 表格数据
const tableData = ref([
  {
    name: '张三',
    age: 25,
    address: '北京市朝阳区'
  },
  {
    name: '李四',
    age: 30,
    address: '上海市浦东新区'
  },
  {
    name: '王五',
    age: 28,
    address: '广州市天河区'
  }
])

// 显示消息提示
const showMessage = (type: 'success' | 'warning' | 'error') => {
  const messages = {
    success: '这是一条成功消息！',
    warning: '这是一条警告消息！',
    error: '这是一条错误消息！'
  }
  ElMessage({
    message: messages[type],
    type: type
  })
}
</script>

<style scoped>
.element-plus-example {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.demo-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.demo-section h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #303133;
}

.demo-section .el-button {
  margin-right: 10px;
  margin-bottom: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.box-card {
  margin-top: 10px;
}
</style>