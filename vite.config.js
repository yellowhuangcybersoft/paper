import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // GitHub Pages 部署時使用倉庫名稱作為 base
  // 部署到 https://yellowhuangcybersoft.github.io/paper/
  base: '/paper/',
})
