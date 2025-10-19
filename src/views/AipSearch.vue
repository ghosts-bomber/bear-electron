<template>
  <div class="aip-search-container">
    <div class="search-content">
      <!-- Header Section -->
      <div class="search-header">
        <div class="header-icon">
          <el-icon size="48" color="#667eea">
            <Search />
          </el-icon>
        </div>
        <h1 class="search-title">JIRA问题排查</h1>
        <p class="search-subtitle">输入 JIRA 号快速定位问题</p>
      </div>

      <!-- Main Search Area -->
      <div class="main-search-section">
        <div class="search-form">
          <el-input
            v-model="input"
            placeholder="输入 JIRA 号码进行搜索..."
            class="search-input"
            size="large"
            @keyup.enter="searchHandle"
          >
            <template #prepend>
              <el-select v-model="select" placeholder="类型" class="search-select">
                <el-option
                  v-for="item in select_data"
                  :key="item.val"
                  :label="item.key"
                  :value="item.val"
                >
                  <div class="select-option">
                    <span class="option-label">{{ item.key }}</span>
                    <span class="option-desc">{{ getTypeDescription(item.val) }}</span>
                  </div>
                </el-option>
              </el-select>
            </template>
            <template #append>
              <el-button
                type="primary"
                :icon="Search"
                :loading="isSearching"
                class="search-button"
                @click="searchHandle"
              >
                {{ isSearching ? "搜索中..." : "搜索" }}
              </el-button>
            </template>
          </el-input>
        </div>

        <!-- Quick Type Buttons -->
        <div class="quick-type-buttons">
          <el-button
            v-for="item in select_data"
            :key="item.val"
            :type="select === item.val ? 'primary' : 'default'"
            class="type-btn"
            @click="selectType(item.val)"
          >
            {{ item.key }}
          </el-button>
        </div>
      </div>

      <!-- Content Grid -->
      <div class="content-grid">
        <!-- Recent Searches -->
        <div v-if="recentSearches.length > 0" class="recent-searches-card">
          <div class="card-header">
            <el-icon size="20" color="#409eff"><Clock /></el-icon>
            <h3>最近搜索</h3>
          </div>
          <div class="recent-list">
            <div
              v-for="(search, index) in recentSearches.slice(0, 6)"
              :key="index"
              class="recent-item"
              @click="quickSearch(search)"
            >
              <el-tag :type="getTypeTagType(search.type)" size="small">{{ search.type }}</el-tag>
              <span class="recent-code">{{ search.code }}</span>
              <el-icon size="12" color="#c0c4cc"><ArrowRight /></el-icon>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  Search,
  Clock,
  QuestionFilled,
  ArrowRight,
  DataBoard,
  InfoFilled,
} from "@element-plus/icons-vue";
import PTApi from "@/api/platform";
import { useAipStore } from "@/store";
import { ElMessage } from "element-plus";

const select_data = reactive([
  { key: "AIP", val: "AIP" },
  { key: "GC", val: "GC" },
  { key: "DC", val: "DC" },
]);

const input = ref("");
const select = ref("");
const isSearching = ref(false);
const aipStore = useAipStore();
const router = useRouter();

// 最近搜索记录
const recentSearches = ref<Array<{ type: string; code: string }>>([]);

if (select_data.length > 0) {
  select.value = select_data[0].val;
}

// 获取类型描述
const getTypeDescription = (type: string) => {
  const descriptions: Record<string, string> = {
    AIP: "Automotive Issue Process",
    GC: "Garbage Collection",
    DC: "Data Center",
  };
  return descriptions[type] || "";
};

// 获取类型标签类型
const getTypeTagType = (type: string) => {
  const tagTypes: Record<string, string> = {
    AIP: "success",
    GC: "warning",
    DC: "info",
  };
  return tagTypes[type] || "default";
};

// 选择类型
const selectType = (type: string) => {
  select.value = type;
};

// 保存搜索记录
const saveSearchRecord = (type: string, code: string) => {
  const searchRecord = { type, code };
  const existingIndex = recentSearches.value.findIndex(
    (item) => item.type === type && item.code === code
  );

  if (existingIndex > -1) {
    recentSearches.value.splice(existingIndex, 1);
  }

  recentSearches.value.unshift(searchRecord);

  if (recentSearches.value.length > 20) {
    recentSearches.value = recentSearches.value.slice(0, 20);
  }

  localStorage.setItem("aip-recent-searches", JSON.stringify(recentSearches.value));
};

// 快速搜索
const quickSearch = (search: { type: string; code: string }) => {
  select.value = search.type;
  input.value = search.code.replace(`${search.type}-`, "");
  searchHandle();
};

// 主搜索函数
async function searchHandle() {
  if (!input.value.trim()) {
    ElMessage.warning("请输入 JIRA 号码");
    return;
  }

  isSearching.value = true;
  const aipcode = select.value + "-" + input.value.trim();

  console.log("搜索:", aipcode);

  try {
    const data = await PTApi.searchApi(aipcode, select.value);
    console.log("搜索结果:", data);

    if (data["contents"].length > 0) {
      console.log("添加信息:", aipcode);
      aipStore.addAipInfo(aipcode, data["contents"][0]);

      saveSearchRecord(select.value, aipcode);

      ElMessage.success("搜索成功！");
      router.push({ name: "aipInfo", params: { code: aipcode } });
    } else {
      ElMessage.warning("未找到相关信息，请检查 JIRA 号码是否正确");
    }
  } catch (error) {
    console.error("搜索失败:", error);
    ElMessage.error("搜索失败，请重试");
  } finally {
    isSearching.value = false;
  }
}

// 从localStorage加载搜索记录
onMounted(() => {
  try {
    const saved = localStorage.getItem("aip-recent-searches");
    if (saved) {
      recentSearches.value = JSON.parse(saved);
    }
  } catch (error) {
    console.error("加载搜索记录失败:", error);
  }
});
</script>

<style scoped lang="scss">
.aip-search-container {
  min-height: 100vh;
  padding: 0;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.search-content {
  width: 100%;
  max-width: none;
  padding: 40px;
}

.search-header {
  padding: 0 20px;
  margin-bottom: 60px;
  text-align: center;
}

.header-icon {
  margin-bottom: 20px;
}

.search-title {
  margin: 0 0 12px;
  font-size: 42px;
  font-weight: 700;
  color: #1e293b;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.search-subtitle {
  margin: 0;
  font-size: 18px;
  color: #64748b;
}

.main-search-section {
  max-width: 800px;
  margin: 0 auto 60px;
  text-align: center;
}

.search-form {
  margin-bottom: 30px;
}

.search-input {
  width: 100%;
  box-shadow: 0 4px 20px rgb(0 0 0 / 8%);
}

.search-select {
  width: 120px;
}

.select-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.option-label {
  font-weight: 600;
  color: #1e293b;
}

.option-desc {
  font-size: 12px;
  color: #64748b;
}

.search-button {
  min-width: 120px;
  font-weight: 600;
}

.quick-type-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

.type-btn {
  min-width: 80px;
  font-weight: 500;
  border-radius: 20px;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 30px;
  margin-bottom: 40px;
}

.recent-searches-card,
.type-info-card,
.stats-card {
  padding: 24px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgb(0 0 0 / 8%);
  transition: all 0.3s ease;
}

.recent-searches-card:hover,
.type-info-card:hover,
.stats-card:hover {
  box-shadow: 0 8px 30px rgb(0 0 0 / 12%);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  gap: 12px;
  align-items: center;
  padding-bottom: 12px;
  margin-bottom: 20px;
  border-bottom: 1px solid #f1f5f9;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recent-item {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  background: #f8fafc;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.recent-item:hover {
  background: #e2e8f0;
  transform: translateX(4px);
}

.recent-code {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  text-align: left;
}

.type-info-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.type-info-item {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.type-badge {
  min-width: 50px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 700;
  color: white;
  text-align: center;
  border-radius: 8px;

  &.aip {
    background: linear-gradient(135deg, #10b981, #059669);
  }

  &.gc {
    background: linear-gradient(135deg, #f59e0b, #d97706);
  }

  &.dc {
    background: linear-gradient(135deg, #6366f1, #4f46e5);
  }
}

.type-description {
  flex: 1;

  strong {
    display: block;
    margin-bottom: 4px;
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
  }

  p {
    margin: 0;
    font-size: 13px;
    line-height: 1.4;
    color: #64748b;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-item {
  padding: 16px 8px;
  text-align: center;
  background: #f8fafc;
  border-radius: 8px;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
  color: #1e293b;
}

.stat-label {
  margin-top: 4px;
  font-size: 12px;
  color: #64748b;
}

.tips-section {
  max-width: 800px;
  margin: 0 auto;
}

.tips-card {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  padding: 24px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgb(0 0 0 / 8%);
}

.tips-content {
  flex: 1;

  h4 {
    margin: 0 0 12px;
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
  }

  ul {
    padding-left: 16px;
    margin: 0;

    li {
      margin-bottom: 6px;
      font-size: 14px;
      line-height: 1.6;
      color: #64748b;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}

/* 响应式设计 */
@media (width <= 1200px) {
  .search-content {
    padding: 30px;
  }

  .content-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 24px;
  }
}

@media (width <= 768px) {
  .search-content {
    padding: 20px;
  }

  .search-title {
    font-size: 32px;
  }

  .search-subtitle {
    font-size: 16px;
  }

  .content-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .quick-type-buttons {
    justify-content: center;
  }

  .tips-card {
    flex-direction: column;
    text-align: center;
  }
}

/* Element Plus 样式覆盖 */
:deep(.el-input-group__prepend) {
  background: white;
  border: 1px solid #d1d5db;
  border-right: none;
}

:deep(.el-input-group__append) {
  background: white;
  border: 1px solid #d1d5db;
  border-left: none;
}

:deep(.el-input__wrapper) {
  border: 1px solid #d1d5db;
  border-right: none;
  border-left: none;
  box-shadow: none;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: none;
}

:deep(.el-input__inner) {
  height: 50px;
  font-size: 16px;
}

:deep(.search-button) {
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

:deep(.search-button:hover) {
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
}
</style>
