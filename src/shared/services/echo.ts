/**
 * Configura Laravel Echo apuntando a nuestro servidor Reverb.
 *
 * - El servidor está en {host}:8081 (puerto del WS, expuesto por php84).
 * - El esquema (ws/wss) se decide por el protocolo de la página: si la SPA
 *   se cargó por https, usamos wss para evitar mixed-content.
 * - El token de Sanctum se envía en el header `Authorization` para autenticar
 *   los canales privados (ej: `private-users.{id}`).
 *
 * Vista: importa este módulo desde main.ts. La configuración se aplica al
 * objeto `window.Echo` y queda accesible desde stores y composables.
 */

import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

declare global {
    interface Window {
        Pusher: typeof Pusher
        Echo: Echo<'reverb'>
    }
}

window.Pusher = Pusher

const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
const host    = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
// Reverb siempre en :8081. Asume:
//  - Local dev: Vite sirve HTTP plano (mkcert deshabilitado por bug de WS+h2)
//    → ws://host:8081 directo.
//  - Server intranet: HTTP sin TLS → ws://host:8081 directo.
//  - Si más adelante hay HTTPS real (cert público, no mkcert), habrá que
//    proxear Reverb tras nginx con TLS, y aquí cambiar a usar el mismo
//    puerto de la página vía proxy.
const port    = 8081

// Endpoint para autorización de canales privados — pasa por nuestro nginx
// (mismo dominio que el API) para reusar la sesión Sanctum.
function authEndpoint(): string {
    if (typeof window === 'undefined') return '/api/v1/broadcasting/auth'
    // Si la página está en https con vite (puerto 5173), el proxy de Vite ya
    // reenvía /api → nginx. Usamos URL relativa para no chocar mixed-content.
    return '/api/v1/broadcasting/auth'
}

window.Echo = new Echo({
    broadcaster: 'reverb',
    key:         'sgiv3-dev-key',
    wsHost:      host,
    wsPort:      port,
    wssPort:     port,
    forceTLS:    isHttps,
    enabledTransports: isHttps ? ['wss'] : ['ws'],
    authEndpoint: authEndpoint(),
    auth: {
        headers: {
            // Lazy: el token se lee en cada handshake desde localStorage.
            // (Echo lo invoca al subscribirse, no al crear la instancia.)
            get Authorization() {
                const t = localStorage.getItem('token')
                return t ? `Bearer ${t}` : ''
            },
            Accept: 'application/json',
        },
    },
})

export default window.Echo
