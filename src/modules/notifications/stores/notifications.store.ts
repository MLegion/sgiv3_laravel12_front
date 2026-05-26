import { defineStore } from 'pinia'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { NotificationItem } from '@/modules/notifications/types/notification.type'
import { playNotificationBeep } from '@/modules/notifications/utils/notificationSound'

const SOUND_PREF_KEY = 'notif.soundEnabled'

/**
 * Estado central de la campana in-app:
 *  - unreadCount: badge.
 *  - items: cache para el popover (se carga al abrir, se invalida al refrescar).
 *
 * Cualquier componente que cambie algo (enviar, marcar leído, marcar todo)
 * llama a `refreshCount()` y `refreshList()` para empujar la actualización
 * de la campana sin tener que esperar el siguiente tick del polling.
 */
export const useNotificationsStore = defineStore('notifications', {
    state: () => ({
        unreadCount: 0,
        items: [] as NotificationItem[],
        loading: false,
        soundEnabled: localStorage.getItem(SOUND_PREF_KEY) !== '0',
        // Marcador para no sonar en la primera carga del polling.
        _initialized: false,
        _subscribedChannel: null as string | null,
        // Contador que se incrementa cada vez que llega un evento WS de
        // notificación. Páginas como NotificationInboxPage lo `watch` para
        // re-fetchar su listado sin necesidad de pasar por este store.
        wsTick: 0,
    }),

    actions: {
        /**
         * Suscribe el cliente al canal privado del usuario para recibir
         * eventos `notification.delivered` en tiempo real (vía Reverb).
         * Idempotente: si ya hay una suscripción activa al mismo canal, no
         * la duplica.
         */
        subscribeRealtime(userId: number): void {
            if (typeof window === 'undefined' || !window.Echo) return
            const channelName = `users.${userId}`
            if (this._subscribedChannel === channelName) return

            // Cambio de usuario: limpia la suscripción anterior.
            if (this._subscribedChannel) {
                try { window.Echo.leave('private-' + this._subscribedChannel) } catch {}
            }

            window.Echo.private(channelName)
                .listen('.notification.delivered', () => {
                    // El servidor sólo manda metadata mínima; refrescamos el
                    // store completo para mantener una única fuente de verdad.
                    this.refresh()
                    // Señal para páginas que tienen su propio listado (p.ej.
                    // NotificationInboxPage). Watch en esta key dispara
                    // re-fetch sin tener que acoplar la página al store.
                    this.wsTick++
                })
                .listen('.user.disabled', () => {
                    // El admin deshabilitó la cuenta del user actual. El backend
                    // ya borró los tokens; aquí limpiamos sesión y redirigimos
                    // al login con banner genérico (sin razón — info interna).
                    // import dinámico para evitar circular con auth store.
                    import('@/modules/auth/stores/auth.store').then(({ useAuthStore }) => {
                        useAuthStore().forceLogout('disabled')
                    })
                })

            this._subscribedChannel = channelName
        },

        unsubscribeRealtime(): void {
            if (typeof window === 'undefined' || !window.Echo) return
            if (this._subscribedChannel) {
                try { window.Echo.leave('private-' + this._subscribedChannel) } catch {}
            }
            this._subscribedChannel = null
        },

        async refreshCount(): Promise<void> {
            try {
                const { data } = await api.get(API.NOTIFICATIONS_API.inbox.unreadCount)
                const next = data?.count ?? 0
                const previous = this.unreadCount
                this.unreadCount = next

                // Suena sólo si subió el contador y el usuario ya cargó la app
                // al menos una vez (evita beep al refresh de la página).
                if (this._initialized && next > previous && this.soundEnabled) {
                    playNotificationBeep()
                }
                this._initialized = true
            } catch { /* tolerar fallos del polling */ }
        },

        toggleSound(): void {
            this.soundEnabled = !this.soundEnabled
            localStorage.setItem(SOUND_PREF_KEY, this.soundEnabled ? '1' : '0')
            if (this.soundEnabled) playNotificationBeep()
        },

        async refreshList(): Promise<void> {
            this.loading = true
            try {
                const { data } = await api.get(API.NOTIFICATIONS_API.inbox.list, {
                    params: { per_page: 15 },
                })
                this.items = data?.items ?? []
            } finally {
                this.loading = false
            }
        },

        async refresh(): Promise<void> {
            await Promise.all([this.refreshCount(), this.refreshList()])
        },

        async markRead(id: number): Promise<void> {
            try {
                await api.patch(API.NOTIFICATIONS_API.inbox.markRead(id))
                const it = this.items.find(i => i.id === id)
                if (it && !it.read_at) {
                    it.read_at = new Date().toISOString()
                    this.unreadCount = Math.max(0, this.unreadCount - 1)
                }
            } catch { /* */ }
        },

        async markAllRead(): Promise<void> {
            try {
                await api.patch(API.NOTIFICATIONS_API.inbox.markAllRead)
                const now = new Date().toISOString()
                this.items = this.items.map(i => ({ ...i, read_at: i.read_at ?? now }))
                this.unreadCount = 0
            } catch { /* */ }
        },

        async remove(id: number): Promise<void> {
            try {
                await api.delete(API.NOTIFICATIONS_API.inbox.delete(id))
                const removed = this.items.find(i => i.id === id)
                this.items = this.items.filter(i => i.id !== id)
                if (removed && !removed.read_at) {
                    this.unreadCount = Math.max(0, this.unreadCount - 1)
                }
            } catch { /* */ }
        },

        async bulkMarkRead(ids: number[]): Promise<number> {
            if (ids.length === 0) return 0
            try {
                const { data } = await api.post(API.NOTIFICATIONS_API.inbox.bulkRead, { ids })
                const affected: number = data?.affected ?? 0
                const now = new Date().toISOString()
                let unreadDelta = 0
                this.items = this.items.map(i => {
                    if (ids.includes(i.id) && !i.read_at) {
                        unreadDelta++
                        return { ...i, read_at: now }
                    }
                    return i
                })
                this.unreadCount = Math.max(0, this.unreadCount - unreadDelta)
                return affected
            } catch {
                return 0
            }
        },

        async bulkRemove(ids: number[]): Promise<number> {
            if (ids.length === 0) return 0
            try {
                const { data } = await api.post(API.NOTIFICATIONS_API.inbox.bulkDelete, { ids })
                const affected: number = data?.affected ?? 0
                let unreadDelta = 0
                this.items = this.items.filter(i => {
                    if (ids.includes(i.id)) {
                        if (!i.read_at) unreadDelta++
                        return false
                    }
                    return true
                })
                this.unreadCount = Math.max(0, this.unreadCount - unreadDelta)
                return affected
            } catch {
                return 0
            }
        },
    },
})
