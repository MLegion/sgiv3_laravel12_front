import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
// import mkcert from 'vite-plugin-mkcert'  // deshabilitado, ver comentario abajo
import path from 'path'

export default defineConfig({
  // mkcert deshabilitado temporalmente: Vite v7 con HTTPS levanta un
  // Http2SecureServer (h2) y la proxy WebSocket no funciona sobre HTTP/2
  // (no existe `Upgrade` header allá). Volveremos a HTTPS cuando se
  // resuelva con Reverb-TLS propio o nginx fronting.
  // Mientras tanto: Service Worker / Web Push no se registran en dev,
  // pero el WS de notifications/disable funciona sobre ws://.
  plugins: [vue(), tailwindcss()],

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
      // Sin proxy de /app: con HTTP plano, el browser conecta WS directo a
      // ws://...:8081 (Reverb) sin pasar por Vite.
    },
  },
})
