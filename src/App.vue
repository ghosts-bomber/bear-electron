<script setup lang="ts">
import Navigation from './components/Navigation.vue'
</script>

<template>
  <div id="app">
    <Navigation />
    <router-view />
  </div>
</template>
console.log(window)
<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  min-height: 100vh;
  display: flex;
}

#app > * {
  flex-shrink: 0;
}

router-view {
  flex: 1;
  overflow-y: auto;
}
</style>