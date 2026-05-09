import { computed, ref } from 'vue'
import { api } from '@/shared/services/api'
import notificationsApi from '@/modules/notifications/api/notifications.api'

const SW_PATH = '/sw-push.js'

type Status = 'unsupported' | 'denied' | 'idle' | 'subscribed'

const status = ref<Status>('idle')
const loading = ref(false)
const error = ref<string | null>(null)
const subscriptionEndpoint = ref<string | null>(null)

const supported = computed(() =>
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window,
)

function urlBase64ToUint8Array(base64: string): Uint8Array {
    const padding = '='.repeat((4 - (base64.length % 4)) % 4)
    const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
    const raw = atob(b64)
    const out = new Uint8Array(raw.length)
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
    return out
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (!supported.value) return null
    try {
        const existing = await navigator.serviceWorker.getRegistration(SW_PATH)
        if (existing) return existing
        return await navigator.serviceWorker.register(SW_PATH, { scope: '/' })
    } catch (e: any) {
        error.value = e?.message ?? 'No se pudo registrar el service worker'
        return null
    }
}

async function refreshStatus(): Promise<void> {
    error.value = null
    if (!supported.value) {
        status.value = 'unsupported'
        return
    }
    if (Notification.permission === 'denied') {
        status.value = 'denied'
        return
    }
    const reg = await getRegistration()
    if (!reg) {
        status.value = 'idle'
        return
    }
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
        subscriptionEndpoint.value = sub.endpoint
        // Verifica con backend que la suscripción siga viva en BD.
        try {
            const { data } = await api.get(notificationsApi.api.webPush.status, {
                params: { endpoint: sub.endpoint },
            })
            status.value = data?.subscribed ? 'subscribed' : 'idle'
        } catch {
            status.value = 'subscribed' // optimismo: existe localmente
        }
        return
    }
    subscriptionEndpoint.value = null
    status.value = 'idle'
}

async function enable(): Promise<boolean> {
    error.value = null
    if (!supported.value) {
        error.value = 'Tu navegador no soporta Web Push.'
        status.value = 'unsupported'
        return false
    }

    loading.value = true
    try {
        // 1) Pedir permiso
        const perm = await Notification.requestPermission()
        if (perm !== 'granted') {
            status.value = perm === 'denied' ? 'denied' : 'idle'
            error.value = perm === 'denied'
                ? 'Bloqueaste las notificaciones. Habilítalas en la configuración del navegador.'
                : 'Permiso no otorgado.'
            return false
        }

        // 2) Obtener VAPID public key del backend
        const { data: cfg } = await api.get(notificationsApi.api.webPush.config)
        if (!cfg?.configured || !cfg?.vapidPublicKey) {
            error.value = 'El canal Web Push no está configurado para tu college. Avisa al administrador.'
            return false
        }

        // 3) Registrar SW + suscribir en pushManager
        const reg = await getRegistration()
        if (!reg) return false

        // Si había una suscripción previa con otra public key, hay que desuscribir primero.
        const existing = await reg.pushManager.getSubscription()
        if (existing) {
            await existing.unsubscribe().catch(() => {})
        }

        const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(cfg.vapidPublicKey) as BufferSource,
        })

        // 4) Persistir en backend
        const json: any = sub.toJSON()
        await api.post(notificationsApi.api.webPush.subscribe, {
            endpoint: sub.endpoint,
            keys: {
                p256dh: json.keys?.p256dh,
                auth:   json.keys?.auth,
            },
            contentEncoding: 'aesgcm',
        })

        subscriptionEndpoint.value = sub.endpoint
        status.value = 'subscribed'
        return true
    } catch (e: any) {
        error.value = e?.message ?? 'Error al activar notificaciones push.'
        return false
    } finally {
        loading.value = false
    }
}

async function disable(): Promise<boolean> {
    error.value = null
    loading.value = true
    try {
        const reg = await getRegistration()
        if (!reg) return false
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
            await api.post(notificationsApi.api.webPush.unsubscribe, {
                endpoint: sub.endpoint,
            }).catch(() => {})
            await sub.unsubscribe().catch(() => {})
        }
        subscriptionEndpoint.value = null
        status.value = 'idle'
        return true
    } catch (e: any) {
        error.value = e?.message ?? 'Error al desactivar notificaciones push.'
        return false
    } finally {
        loading.value = false
    }
}

export function useWebPush() {
    return {
        status,
        loading,
        error,
        supported,
        subscriptionEndpoint,
        refreshStatus,
        enable,
        disable,
    }
}
