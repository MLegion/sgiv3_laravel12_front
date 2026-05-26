import { ref, onMounted, onBeforeUnmount, watch, type Ref } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { WidgetMeta } from '@/modules/dashboard/types/widget.type'

interface UseWidgetData<T> {
    data: Ref<T | null>
    loading: Ref<boolean>
    error: Ref<unknown>
    refresh: () => Promise<void>
}

function resolveDataUrl(widget: WidgetMeta): string {
    return widget.data_url ?? API.DASHBOARD_API.widgets.data(widget.id)
}

/**
 * Hace fetch de la data del widget y mantiene el valor vivo según el contrato:
 *  - refresh='static': no llama backend.
 *  - refresh='live' sin ws_channel: polling cada `poll_seconds` (default 60).
 *  - refresh='live' con ws_channel: suscripción WS + polling de respaldo.
 *
 * `extraParams` (opcional, reactivo) — query string que se incluye en cada
 * fetch. Cambios en sus valores disparan un refresh automático. Útil para
 * widgets interactivos (selectores internos).
 */
export function useWidgetData<T = unknown>(
    widget: WidgetMeta,
    extraParams?: Ref<Record<string, string | number | null | undefined>>,
): UseWidgetData<T> {
    const data    = ref<T | null>(null) as Ref<T | null>
    const loading = ref(false)
    const error   = ref<unknown>(null)

    let pollTimer: number | null = null
    let echoChannel: string | null = null

    async function refresh(): Promise<void> {
        loading.value = true
        error.value   = null
        try {
            const params: Record<string, string> = {}
            const raw = extraParams?.value ?? {}
            for (const [k, v] of Object.entries(raw)) {
                if (v === null || v === undefined || v === '') continue
                params[k] = String(v)
            }
            const { data: payload } = await api.get<T>(resolveDataUrl(widget), { params })
            data.value = payload
        } catch (e) {
            error.value = e
        } finally {
            loading.value = false
        }
    }

    function startPolling(): void {
        const seconds = widget.poll_seconds ?? 60
        if (seconds <= 0) return
        pollTimer = window.setInterval(refresh, seconds * 1000)
    }

    function stopPolling(): void {
        if (pollTimer !== null) {
            window.clearInterval(pollTimer)
            pollTimer = null
        }
    }

    function subscribeWs(): void {
        if (typeof window === 'undefined' || !window.Echo) return
        if (!widget.ws_channel) return

        echoChannel = widget.ws_channel
        const event = widget.ws_event ?? '.widget.changed'
        try {
            window.Echo.private(echoChannel).listen(event, () => { refresh() })
        } catch (e) {
            console.warn(`[useWidgetData] WS subscribe falló para ${widget.id}:`, e)
            echoChannel = null
        }
    }

    function unsubscribeWs(): void {
        if (typeof window === 'undefined' || !window.Echo || !echoChannel) return
        try { window.Echo.leave('private-' + echoChannel) } catch {}
        echoChannel = null
    }

    onMounted(() => {
        if (widget.refresh === 'static') return
        refresh()
        subscribeWs()
        startPolling()
    })

    onBeforeUnmount(() => {
        stopPolling()
        unsubscribeWs()
    })

    if (extraParams) {
        watch(extraParams, () => { refresh() }, { deep: true })
    }

    return { data, loading, error, refresh }
}
