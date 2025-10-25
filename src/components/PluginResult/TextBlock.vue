<template>
    <div class="text-block">
         <p>aa{{ props.data.text }}</p>
    </div>
</template>
<script setup lang="ts">
import type { TextData } from '@/type/plugin'
const props = defineProps<{
    data: TextData
}>()
</script>

<style scoped>
.text-block {
    background: white;
    padding: 12px;
    border-radius: 6px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04)
}
</style>