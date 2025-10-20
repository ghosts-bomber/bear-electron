import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
 
import electron from "vite-plugin-electron"
import electronRenderer from "vite-plugin-electron-renderer" 
import polyfillExports from "vite-plugin-electron-renderer" 
 
export default defineConfig(({ mode }) => ({
  base: mode == 'development' ? '' : './',
  server: {
    port: 7900,
    host: '127.0.0.1'
  },
  plugins: [
    vue(),
    electron([{
      entry: "electron-main/index.ts", // 主进程文件
    },
    {
      entry: 'electron-preload/preload.ts'
    }
  ]),
    electronRenderer(),
    polyfillExports(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    emptyOutDir: false, // 默认情况下，若 outDir 在 root 目录下，则 Vite 会在构建时清空该目录
    outDir: "dist-electron"
  },
}))