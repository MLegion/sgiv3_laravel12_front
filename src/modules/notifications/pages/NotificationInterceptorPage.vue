<template>
    <div class="space-y-5">
        <div class="flex items-start justify-between gap-4">
            <div>
                <h1 class="text-xl font-semibold text-slate-800">Interceptor de notificaciones</h1>
                <p class="text-sm text-slate-500 mt-1 max-w-2xl">
                    Modo pruebas: cuando está <strong>activo</strong>, toda notificación que <strong>no sea in-app</strong>
                    (correo, SMS, WhatsApp, push) se <strong>captura sin enviarse</strong>. Las in-app se siguen entregando normal.
                </p>
            </div>
        </div>

        <!-- Toggle -->
        <div class="bg-white border rounded-xl shadow-sm p-4 flex items-center justify-between">
            <div>
                <div class="font-medium text-slate-700">Interceptor activo</div>
                <div class="text-xs text-slate-500">
                    {{ enabled ? 'Los envíos externos se están capturando.' : 'Los envíos externos salen normalmente.' }}
                </div>
            </div>
            <FormSwitch :model-value="enabled" :disabled="saving" @update:model-value="toggle" />
        </div>

        <!-- Capturados -->
        <div class="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div class="flex items-center justify-between px-4 py-3 border-b">
                <div class="flex items-center gap-2">
                    <h2 class="text-sm font-semibold text-slate-700">Mensajes capturados ({{ total }})</h2>
                    <span class="inline-flex items-center gap-1 text-[10px] font-bold uppercase rounded-full px-2 py-0.5"
                          :class="live ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'">
                        <span class="w-1.5 h-1.5 rounded-full" :class="live ? 'bg-emerald-500' : 'bg-slate-400'"></span>
                        {{ live ? 'En vivo' : 'Actualización periódica' }}
                    </span>
                </div>
                <button class="text-xs text-blue-600 hover:text-blue-800" :disabled="loading" @click="load">
                    Refrescar
                </button>
            </div>

            <div v-if="loading" class="p-8 text-center text-slate-400 text-sm">Cargando…</div>
            <div v-else-if="items.length === 0" class="p-8 text-center text-slate-400 text-sm">
                No hay mensajes capturados.
            </div>

            <table v-else class="w-full text-sm">
                <thead class="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wide">
                    <tr>
                        <th scope="col" class="px-3 py-2 text-left">Fecha</th>
                        <th scope="col" class="px-3 py-2 text-left">Canal</th>
                        <th scope="col" class="px-3 py-2 text-left">Plantilla / Evento</th>
                        <th scope="col" class="px-3 py-2 text-left">Destinatario</th>
                        <th scope="col" class="px-3 py-2 text-left">Asunto / Cuerpo</th>
                        <th scope="col" class="px-3 py-2 text-right">Vista previa</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="n in items" :key="n.id" class="border-t border-slate-100 align-top">
                        <td class="px-3 py-2 whitespace-nowrap text-slate-600">{{ formatDateTime(n.created_at) }}</td>
                        <td class="px-3 py-2">
                            <span class="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold" :class="channelPill(n.channel)">
                                {{ CHANNEL_LABELS[n.channel] || n.channel }}
                            </span>
                        </td>
                        <td class="px-3 py-2">
                            <div class="text-slate-700">{{ n.template_key || '—' }}</div>
                            <div v-if="n.event_key" class="text-slate-400 text-[11px]">{{ n.event_key }}</div>
                        </td>
                        <td class="px-3 py-2">
                            <div class="font-medium text-slate-700">{{ n.recipient_label || '—' }}</div>
                            <div class="text-[11px] text-slate-500 font-mono">{{ n.recipient_address }}</div>
                        </td>
                        <td class="px-3 py-2 max-w-md">
                            <div v-if="n.subject" class="font-semibold text-slate-700">{{ n.subject }}</div>
                            <div class="text-[11px] text-slate-500 line-clamp-3" :title="n.body_rendered ?? ''" v-html="n.body_rendered ?? ''" />
                        </td>
                        <td class="px-3 py-2 text-right">
                            <button class="text-xs font-semibold text-blue-600 hover:text-blue-800 border border-blue-200 rounded-md px-2 py-1"
                                @click="selected = n">
                                Ver
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Modal de vista previa por canal -->
        <Teleport to="body">
            <div v-if="selected" class="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-black/40" @click="selected = null" />
                <div class="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
                    <div class="flex items-center justify-between px-4 py-3 border-b">
                        <div>
                            <h3 class="text-sm font-bold text-slate-800">Vista previa — {{ CHANNEL_LABELS[selected.channel] || selected.channel }}</h3>
                            <p class="text-[11px] text-slate-500">Así se vería al enviarse (capturado, no enviado).</p>
                        </div>
                        <button class="text-slate-400 hover:text-slate-700 text-xl leading-none" @click="selected = null">&times;</button>
                    </div>
                    <div class="p-4">
                        <NotificationPreview :notification="selected" />
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import FormSwitch from '@/app/components/ui/form/FormSwitch.vue'
import NotificationPreview from '@/modules/notifications/components/NotificationPreview.vue'

interface CapturedRow {
    id: number
    channel: string
    template_key: string | null
    event_key: string | null
    recipient_label: string | null
    recipient_address: string
    subject: string | null
    body_rendered: string | null
    created_at: string
}

const CHANNEL_LABELS: Record<string, string> = {
    email: 'Correo', sms: 'SMS', whatsapp: 'WhatsApp', web_push: 'Push', in_app: 'In-app',
}

const enabled = ref(false)
const saving  = ref(false)
const loading = ref(false)
const items   = ref<CapturedRow[]>([])
const total   = ref(0)
const selected = ref<CapturedRow | null>(null)

function channelPill(ch: string): string {
    return {
        email: 'bg-blue-100 text-blue-700',
        sms: 'bg-amber-100 text-amber-700',
        whatsapp: 'bg-emerald-100 text-emerald-700',
        web_push: 'bg-purple-100 text-purple-700',
    }[ch] ?? 'bg-slate-100 text-slate-600'
}

function formatDateTime(v: string): string {
    if (!v) return '—'
    const d = new Date(v)
    return isNaN(d.getTime()) ? v : d.toLocaleString()
}

async function loadStatus(): Promise<void> {
    const { data } = await api.get(API.NOTIFICATIONS_API.interceptor)
    enabled.value = !!data.enabled
}

async function load(): Promise<void> {
    loading.value = true
    try {
        const { data } = await api.get(API.NOTIFICATIONS_API.logs, { params: { status: 'intercepted', per_page: 100 } })
        items.value = data.items ?? []
        total.value = data.total ?? items.value.length
    } finally {
        loading.value = false
    }
}

async function toggle(value: boolean): Promise<void> {
    saving.value = true
    try {
        await api.put(API.NOTIFICATIONS_API.interceptor, { enabled: value })
        enabled.value = value
    } finally {
        saving.value = false
    }
}

// Realtime si hay WebSocket (Echo) activo; si no, polling periódico.
const live = ref(false)
let pollTimer: number | undefined
let channelName = ''

function activeCollegeId(): number | null {
    const v = localStorage.getItem('active_college_id')
    return v ? Number(v) : null
}

function setupLiveOrPolling(): void {
    const cid = activeCollegeId()
    if (typeof window !== 'undefined' && window.Echo && cid) {
        channelName = 'notifications.interceptor.' + cid
        window.Echo.private(channelName).listen('.notification.intercepted', (n: CapturedRow) => {
            if (!items.value.some(x => x.id === n.id)) {
                items.value = [n, ...items.value]
                total.value += 1
            }
        })
        live.value = true
    } else {
        live.value = false
        pollTimer = window.setInterval(load, 8000)
    }
}

onMounted(async () => {
    await Promise.all([loadStatus(), load()])
    setupLiveOrPolling()
})

onUnmounted(() => {
    if (pollTimer) window.clearInterval(pollTimer)
    if (channelName && typeof window !== 'undefined' && window.Echo) {
        try { window.Echo.leave('private-' + channelName) } catch { /* noop */ }
    }
})
</script>
