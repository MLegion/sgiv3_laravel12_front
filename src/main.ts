import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from '@/app/App.vue'
import router from '@/app/router'

// Importación de estilos globales (Tailwind CSS)
import '@/assets/styles/main.css'

// Laravel Echo (WebSocket via Reverb) — se importa en un CHUNK APARTE para
// sacar pusher-js/laravel-echo del bundle principal. Se dispara ya (fetch en
// paralelo) y se espera antes de montar, así window.Echo está listo cuando los
// stores se suscriben (sin race), pero sin engordar el parse inicial.
const echoReady = import('@/shared/services/echo')

/**
 * Inicialización de la aplicación SGI v3.
 * * El orden de los plugins es importante:
 * 1. Pinia: Debe estar disponible antes que el Router para permitir
 * la hidratación de la sesión en los Navigation Guards.
 * 2. Router: Gestiona las rutas y los guardias de seguridad.
 */
async function bootstrap() {
    const app = createApp(App)
    const pinia = createPinia()

    // Registrar plugins
    app.use(pinia)
    app.use(router)

    // Montar la aplicación en el DOM
    // El router.isReady() asegura que las rutas iniciales y guards
    // se hayan procesado antes de mostrar la UI.
    await router.isReady()
    await echoReady
    app.mount('#app')
}

// Arrancar la aplicación
bootstrap()
