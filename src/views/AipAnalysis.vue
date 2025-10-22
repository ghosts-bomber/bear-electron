<template>
    <div class="aip-analysis">
        <component :is="currentViewComponent" @search-success="handleSearchSuccess" :code="currentAipCode" />
    </div>
</template>

<script setup lang="ts">
import { ref,computed } from 'vue'
import AipSearch from '@/views/AipSearch.vue';
import AipInfo from '@/views/AipInfo.vue';
const viewMap: Record<string, any> = {
    "aipSearch": AipSearch,
    "aipInfo": AipInfo,
}
const currentAipCode = ref<string>("");
const currentView = ref<string>("aipSearch");
const currentViewComponent = computed(() => {
    return viewMap[currentView.value];
});
// 处理搜索成功事件
const handleSearchSuccess = (aipCode: string) => {
    console.log('搜索成功，切换到详情页面');
    currentView.value = "aipInfo";
    currentAipCode.value = aipCode;
};
</script>