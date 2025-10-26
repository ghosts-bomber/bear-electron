<template>
    <div class="text-block">
         <p>{{ props.data.text }}</p>
    </div>
</template>
<script setup lang="ts">
import type { TextData } from '@/types/plugin'
const props = defineProps<{
    data: TextData
}>()
</script>

<style scoped>
.text-block {
    background: white;
    padding: 12px;
    border-radius: 6px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    /* 隔离布局与绘制，减少外层受影响 */
    contain: layout paint;
}
</style>