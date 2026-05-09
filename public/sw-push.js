/* eslint-disable */
/**
 * Service Worker mínimo para Web Push del SGI v3.
 *
 * Sólo maneja `push` y `notificationclick`. No cachea ni intercepta fetches —
 * el resto de la app sigue siendo SPA pura.
 *
 * El payload que enviamos desde WebPushChannel tiene la forma:
 *   { title, body, url?, icon?, tag? }
 */

self.addEventListener('install', () => {
    self.skipWaiting()
})

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
    let data = {}
    try {
        data = event.data ? event.data.json() : {}
    } catch (_e) {
        data = { title: 'Notificación', body: event.data ? event.data.text() : '' }
    }

    const title = data.title || 'Notificación'
    const options = {
        body: data.body || '',
        icon: data.icon || '/img/logo-192.png',
        badge: '/img/badge-72.png',
        tag: data.tag || 'sgi-notif',
        renotify: true,
        data: {
            url: data.url || '/notifications',
        },
    }

    event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
    event.notification.close()
    const url = (event.notification.data && event.notification.data.url) || '/'

    event.waitUntil(
        self.clients
            .matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                for (const client of clientList) {
                    if ('focus' in client && client.url.includes(self.location.origin)) {
                        client.navigate(url).catch(() => {})
                        return client.focus()
                    }
                }
                if (self.clients.openWindow) {
                    return self.clients.openWindow(url)
                }
            }),
    )
})
