import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import path from 'path'

export default defineConfig({
  plugins: [vue(), tailwindcss(), basicSsl()],

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
    // permitir cualquier host (dominio local + IP LAN para móvil)
    allowedHosts: true,
    // HMR auto-detecta protocolo y host del cliente, así funciona desde
    // sgiv3-laravel.itstb.test y desde la IP LAN.
    hmr: { clientPort: 5173 },
    // Proxy del API: el celular carga la SPA por HTTPS, así que no puede
    // hablar con http://...:8080 (mixed content). Vite recibe /api/* en
    // HTTPS y lo reenvía internamente al nginx (servicio www) en HTTP.
    proxy: {
      '/api':     { target: 'http://www', changeOrigin: true },
      '/sanctum': { target: 'http://www', changeOrigin: true },
    },
  },
})
