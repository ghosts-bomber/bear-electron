<template>
    <div class="jira-analysis">
        <component :is="currentWidgetComponent" @login-success="handleLoginSuccess" />
    </div>
</template>

<script setup lang="ts">
import { ref,computed } from 'vue'
import PTLogin from '@/views/PTLogin.vue'
import AipStack from '@/views/AipStack.vue'

const ptWidgeMap: Record<string, any> = {
    "ptLogin": PTLogin,
    "aipStack": AipStack,
};
const currentWidget = ref<string>("ptLogin");

const currentWidgetComponent = computed(() => {
    return ptWidgeMap[currentWidget.value];
});

// 处理登录成功事件
const handleLoginSuccess = () => {
    console.log('登录成功，切换到搜索页面');
    currentWidget.value = "aipStack";
};
</script>

<style scoped>
.jira-analysis {
    display: flex;
    width: 100%;
    min-height: 100vh;
    background: #fff;
}
</style>
