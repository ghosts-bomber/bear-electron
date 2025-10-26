<template>
    <div class="image-block">
        <div>图片</div>
    </div>
</template>

<script setup lang="ts">

</script>
<style scoped>
.image-block {
    width: 100%;
    height: 400px;
    /* 隔离布局与绘制，降低图像变动影响范围 */
    contain: layout paint;
}
</style>