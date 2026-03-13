import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // GitHub Pages 部署時使用倉庫名稱作為 base
  // 如果部署到 https://<USERNAME>.github.io/<REPO>/，設置 base: '/<REPO>/'
  // 如果部署到自訂網域或 Vercel/Netlify，設置 base: '/'
  base: process.env.NODE_ENV === 'production' ? '/paper-mario-battle-simulator/' : '/',
})
