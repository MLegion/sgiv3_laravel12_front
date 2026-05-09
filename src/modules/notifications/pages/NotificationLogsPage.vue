<template>
    <div class="space-y-4">
        <div>
            <h1 class="text-lg font-bold text-slate-800">Historial de notificaciones</h1>
            <p class="text-xs text-slate-500">Auditoría cross-canal del college. Filtra por canal, estado, fechas, evento o búsqueda libre.</p>
        </div>

        <!-- Resumen por estado -->
        <div v-if="summary" class="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
            <div v-for="(label, key) in STATUS_LABELS" :key="key"
                class="rounded p-2"
                :class="STATUS_BG[key]"
            >
                <div class="text-base font-bold">{{ summary.byStatus[key] ?? 0 }}</div>
                <div class="text-[10px] uppercase opacity-70">{{ label }}</div>
            </div>
        </div>

        <!-- Filtros -->
        <div class="bg-white border border-slate-200 rounded-lg p-3 grid sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <div class="lg:col-span-2">
                <label class="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">Buscar</label>
                <input v-model="search" type="text" placeholder="Asunto, destinatario, error..." class="w-full border rounded-md px-2 py-1.5 text-sm" />
            </div>
            <div>
                <label class="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">Canal</label>
                <select v-model="channel" class="w-full border rounded-md px-2 py-1.5 text-sm">
                    <option value="">Todos</option>
                    <option value="in_app">In-app</option>
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="whatsapp">WhatsApp</option>
                </select>
            </div>
            <div>
                <label class="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">Estado</label>
                <select v-model="status" class="w-full border rounded-md px-2 py-1.5 text-sm">
                    <option value="">Todos</option>
                    <option v-for="(label, key) in STATUS_LABELS" :key="key" :value="key">{{ label }}</option>
                </select>
            </div>
            <div>
                <label class="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">Desde</label>
                <input v-model="dateFrom" type="date" class="w-full border rounded-md px-2 py-1.5 text-sm" />
            </div>
            <div>
                <label class="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">Hasta</label>
                <input v-model="dateTo" type="date" class="w-full border rounded-md px-2 py-1.5 text-sm" />
            </div>

            <label class="lg:col-span-2 flex items-center gap-2 text-xs text-slate-600 mt-1">
                <input v-model="withTrashed" type="checkbox" class="rounded border-slate-300 text-indigo-600" />
                Incluir eliminadas por usuarios
            </label>
            <div class="flex items-end justify-end lg:col-span-4">
                <button class="text-xs text-slate-500 hover:underline" @click="clearFilters">Limpiar filtros</button>
            </div>
        </div>

        <!-- Tabla -->
        <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div v-if="loading" class="p-6 text-sm text-slate-400 italic text-center">Cargando...</div>
            <div v-else-if="items.length === 0" class="p-6 text-sm text-slate-400 italic text-center">Sin resultados.</div>
            <div v-else class="overflow-x-auto">
                <table class="w-full text-xs">
                    <thead class="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wide">
                        <tr>
                            <th class="px-3 py-2 text-left">Fecha</th>
                            <th class="px-3 py-2 text-left">Canal</th>
                            <th class="px-3 py-2 text-left">Estado</th>
                            <th class="px-3 py-2 text-left">Plantilla / Evento</th>
                            <th class="px-3 py-2 text-left">Destinatario</th>
                            <th class="px-3 py-2 text-left">Asunto / Error</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="n in items" :key="n.id" class="border-t border-slate-100 hover:bg-slate-50 align-top">
                            <td class="px-3 py-2 whitespace-nowrap text-slate-600">{{ formatDateTime(n.created_at) }}</td>
                            <td class="px-3 py-2"><span class="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[10px] uppercase">{{ n.channel }}</span></td>
                            <td class="px-3 py-2">
                                <span :class="STATUS_PILL[n.status]" class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">{{ STATUS_LABELS[n.status] || n.status }}</span>
                            </td>
                            <td class="px-3 py-2 font-mono text-[11px]">
                                <div class="text-slate-700">{{ n.template_key || '—' }}</div>
                                <div v-if="n.event_key" class="text-slate-400">{{ n.event_key }}</div>
                            </td>
                            <td class="px-3 py-2">
                                <div class="font-medium text-slate-700">{{ n.recipient_label || '—' }}</div>
                                <div class="text-[11px] text-slate-500 font-mono">{{ n.recipient_address }}</div>
                            </td>
                            <td class="px-3 py-2">
                                <div v-if="n.subject" class="font-semibold text-slate-700">{{ n.subject }}</div>
                                <div v-if="n.error" class="text-[11px] text-red-600">{{ n.error }}</div>
                                <div v-else class="text-[11px] text-slate-500 line-clamp-2">{{ n.body_rendered }}</div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Paginación -->
        <div v-if="lastPage > 1" class="flex items-center justify-between text-xs text-slate-600">
            <span>Página {{ page }} / {{ lastPage }} · {{ total }} registros</span>
            <div class="flex gap-2">
                <button class="px-3 py-1.5 rounded-md border disabled:opacity-50" :disabled="page <= 1" @click="page--">Anterior</button>
                <button class="px-3 py-1.5 rounded-md border disabled:opacity-50" :disabled="page >= lastPage" @click="page++">Siguiente</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { NotificationItem } from '@/modules/notifications/types/notification.type'

const STATUS_LABELS: Record<string, string> = {
    pending:   'Pendiente',
    sending:   'Enviando',
    sent:      'Enviado',
    delivered: 'Entregado',
    read:      'Leído',
    failed:    'Falló',
}
const STATUS_BG: Record<string, string> = {
    pending:   'bg-slate-100 text-slate-700',
    sending:   'bg-blue-100 text-blue-700',
    sent:      'bg-emerald-100 text-emerald-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    read:      'bg-indigo-100 text-indigo-700',
    failed:    'bg-red-100 text-red-700',
}
const STATUS_PILL: Record<string, string> = STATUS_BG

const items    = ref<NotificationItem[]>([])
const loading  = ref(false)
const summary  = ref<{ byStatus: Record<string, number> } | null>(null)

const page      = ref(1)
const perPage   = ref(25)
const total     = ref(0)
const lastPage  = ref(1)

const search      = ref('')
const channel     = ref('')
const status      = ref('')
const dateFrom    = ref('')
const dateTo      = ref('')
const withTrashed = ref(false)

let debounceTimer: number | undefined

function clearFilters() {
    search.value = ''
    channel.value = ''
    status.value = ''
    dateFrom.value = ''
    dateTo.value = ''
    withTrashed.value = false
    page.value = 1
    load()
}

async function load() {
    loading.value = true
    try {
        const { data } = await api.get(API.NOTIFICATIONS_API.logs, {
            params: {
                page: page.value,
                per_page: perPage.value,
                search: search.value || undefined,
                channel: channel.value || undefined,
                status: status.value || undefined,
                date_from: dateFrom.value || undefined,
                date_to: dateTo.value || undefined,
                with_trashed: withTrashed.value ? 1 : undefined,
            },
        })
        items.value    = data?.items ?? []
        total.value    = data?.total ?? 0
        lastPage.value = data?.lastPage ?? 1
        summary.value  = data?.summary ?? null
    } finally {
        loading.value = false
    }
}

function formatDateTime(iso: string): string {
    if (!iso) return ''
    return new Date(iso).toLocaleString('es-MX', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    })
}

watch(page, load)
watch([channel, status, dateFrom, dateTo, withTrashed], () => { page.value = 1; load() })
watch(search, () => {
    if (debounceTimer) window.clearTimeout(debounceTimer)
    debounceTimer = window.setTimeout(() => { page.value = 1; load() }, 300)
})

onMounted(load)
</script>
