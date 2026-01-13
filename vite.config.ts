import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [vue(),tailwindcss()],

  build: {
      outDir: path.resolve(__dirname, '../public/frontend'),
      emptyOutDir: true,
      assetsDir: 'assets',
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },

  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: {
        host: 'sgiv3-laravel.itstb.test',
        port: 5173,
    },
  },
})
