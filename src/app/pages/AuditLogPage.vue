<template>
    <div class="p-4 sm:p-6 space-y-4">
        <div>
            <h1 class="text-xl font-bold text-slate-800">Bitácora de Auditoría</h1>
            <p class="text-sm text-slate-500">Registro central de acciones sensibles (accesos, MFA, simulación de usuario, cambios administrativos).</p>
        </div>

        <!-- Filtros -->
        <div class="flex flex-wrap items-end gap-3 bg-white rounded-xl border border-slate-200 p-4">
            <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">Acción</label>
                <select v-model="filters.action" class="rounded-lg border border-slate-300 px-3 py-2 text-sm min-w-48" @change="reload">
                    <option value="">Todas</option>
                    <option v-for="a in actions" :key="a" :value="a">{{ a }}</option>
                </select>
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">Estado</label>
                <select v-model="filters.status" class="rounded-lg border border-slate-300 px-3 py-2 text-sm" @change="reload">
                    <option value="">Todos</option>
                    <option value="ok">ok</option>
                    <option value="error">error</option>
                </select>
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">Desde</label>
                <input v-model="filters.date_from" type="date" class="rounded-lg border border-slate-300 px-3 py-2 text-sm" @change="reload" />
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">Hasta</label>
                <input v-model="filters.date_to" type="date" class="rounded-lg border border-slate-300 px-3 py-2 text-sm" @change="reload" />
            </div>
            <button type="button" class="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50" @click="clearFilters">
                Limpiar
            </button>
        </div>

        <!-- Tabla -->
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="bg-slate-50 text-slate-500 text-left text-xs uppercase tracking-wide">
                        <tr>
                            <th class="px-4 py-3">Fecha</th>
                            <th class="px-4 py-3">Acción</th>
                            <th class="px-4 py-3">Actor</th>
                            <th class="px-4 py-3">Estado</th>
                            <th class="px-4 py-3">IP</th>
                            <th class="px-4 py-3">Detalle</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <tr v-if="loading">
                            <td colspan="6" class="px-4 py-8 text-center text-slate-400">Cargando…</td>
                        </tr>
                        <tr v-else-if="items.length === 0">
                            <td colspan="6" class="px-4 py-8 text-center text-slate-400">Sin registros.</td>
                        </tr>
                        <tr v-for="row in items" :key="row.id" class="hover:bg-slate-50 align-top">
                            <td class="px-4 py-3 whitespace-nowrap text-slate-500">{{ formatDate(row.createdAt) }}</td>
                            <td class="px-4 py-3 font-mono text-xs text-slate-700">{{ row.action }}</td>
                            <td class="px-4 py-3">
                                <div class="text-slate-700">{{ row.actorName || '—' }}</div>
                                <div class="text-xs text-slate-400">{{ row.actorEmail }}</div>
                            </td>
                            <td class="px-4 py-3">
                                <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold"
                                    :class="row.status === 'ok' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'">
                                    {{ row.status }}
                                </span>
                            </td>
                            <td class="px-4 py-3 font-mono text-xs text-slate-500">{{ row.ip || '—' }}</td>
                            <td class="px-4 py-3 text-xs text-slate-500 max-w-xs">
                                <span v-if="row.context && Object.keys(row.context).length" class="font-mono">{{ JSON.stringify(row.context) }}</span>
                                <span v-if="row.error" class="block text-red-500">{{ row.error }}</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Paginación -->
            <div class="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-sm">
                <span class="text-slate-500">{{ total }} registro(s) · pág. {{ page }} de {{ lastPage }}</span>
                <div class="flex gap-2">
                    <button type="button" :disabled="page <= 1" class="px-3 py-1.5 rounded-lg border border-slate-300 disabled:opacity-40" @click="go(page - 1)">Anterior</button>
                    <button type="button" :disabled="page >= lastPage" class="px-3 py-1.5 rounded-lg border border-slate-300 disabled:opacity-40" @click="go(page + 1)">Siguiente</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { api } from '@/shared/services/api'

interface AuditRow {
    id: number
    action: string
    status: string
    actorName: string | null
    actorEmail: string | null
    ip: string | null
    context: Record<string, unknown> | null
    error: string | null
    createdAt: string | null
}

const items = ref<AuditRow[]>([])
const actions = ref<string[]>([])
const loading = ref(false)
const page = ref(1)
const perPage = ref(25)
const total = ref(0)
const lastPage = ref(1)

const filters = reactive({ action: '', status: '', date_from: '', date_to: '' })

function formatDate(iso: string | null): string {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('es-MX')
}

async function load() {
    loading.value = true
    try {
        const params: Record<string, unknown> = { page: page.value, per_page: perPage.value }
        if (filters.action) params.action = filters.action
        if (filters.status) params.status = filters.status
        if (filters.date_from) params.date_from = filters.date_from
        if (filters.date_to) params.date_to = filters.date_to

        const { data } = await api.get('/api/v1/audit-logs', { params })
        items.value = data.items
        total.value = data.total
        lastPage.value = data.lastPage
        page.value = data.page
    } finally {
        loading.value = false
    }
}

function reload() {
    page.value = 1
    load()
}

function go(p: number) {
    if (p < 1 || p > lastPage.value) return
    page.value = p
    load()
}

function clearFilters() {
    filters.action = ''
    filters.status = ''
    filters.date_from = ''
    filters.date_to = ''
    reload()
}

async function loadActions() {
    try {
        const { data } = await api.get('/api/v1/audit-logs/actions')
        actions.value = data
    } catch { /* no-op */ }
}

onMounted(() => {
    loadActions()
    load()
})
</script>
