<template>
    <div class="summary-block">
         <p>{{ props.data.summary }}</p>
    </div>
</template>
<script setup lang="ts">
import type { SummaryData } from '@/types/plugin'
const props = defineProps<{
    data: SummaryData
}>()
</script>

<style scoped>
.summary-block {
    background: white;
    padding: 12px;
    border-radius: 6px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    /* 隔离布局与绘制，减少外层受影响 */
    contain: layout paint;
}
</style>