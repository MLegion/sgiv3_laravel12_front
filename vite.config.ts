import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import mkcert from 'vite-plugin-mkcert'
import path from 'path'

export default defineConfig({
  // mkcert genera certificado local firmado por una CA confiable instalada
  // automáticamente en el OS (necesario para que los Service Workers se
  // registren — `@vitejs/plugin-basic-ssl` produce un cert auto-firmado que
  // los SW rechazan, aunque el browser acepte la página).
  plugins: [vue(), tailwindcss(), mkcert()],

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
