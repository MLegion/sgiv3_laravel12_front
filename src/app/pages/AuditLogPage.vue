<template>
    <div class="p-4 sm:p-6 space-y-4">
        <div>
            <h1 class="text-xl font-bold text-slate-800">Bitácora de Auditoría</h1>
            <p class="text-sm text-slate-500">
                <template v-if="collegeScoped">Registro de acciones sensibles por colegio. Elige un colegio para ver su bitácora.</template>
                <template v-else>Registro central de acciones sensibles (accesos, MFA, simulación de usuario, cambios administrativos).</template>
            </p>
        </div>

        <!-- Filtros -->
        <div class="flex flex-wrap items-end gap-3 bg-white rounded-xl border border-slate-200 p-4">
            <div v-if="collegeScoped">
                <label class="block text-xs font-semibold text-slate-500 mb-1">Colegio</label>
                <select v-model="selectedCollegeId" class="rounded-lg border border-slate-300 px-3 py-2 text-sm min-w-56" @change="onCollegeChange">
                    <option value="">— Selecciona un colegio —</option>
                    <option v-for="c in colleges" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
            </div>
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
                            <th v-if="collegeScoped" class="px-4 py-3">Colegio</th>
                            <th class="px-4 py-3">Acción</th>
                            <th class="px-4 py-3">Actor</th>
                            <th class="px-4 py-3">Estado</th>
                            <th class="px-4 py-3">IP</th>
                            <th class="px-4 py-3">Detalle</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <tr v-if="collegeScoped && !selectedCollegeId">
                            <td :colspan="colspan" class="px-4 py-8 text-center text-slate-400">Selecciona un colegio para ver su bitácora.</td>
                        </tr>
                        <tr v-else-if="loading">
                            <td :colspan="colspan" class="px-4 py-8 text-center text-slate-400">Cargando…</td>
                        </tr>
                        <tr v-else-if="items.length === 0">
                            <td :colspan="colspan" class="px-4 py-8 text-center text-slate-400">Sin registros.</td>
                        </tr>
                        <tr v-for="row in items" :key="row.id" class="hover:bg-slate-50 align-top">
                            <td class="px-4 py-3 whitespace-nowrap text-slate-500">{{ formatDate(row.createdAt) }}</td>
                            <td v-if="collegeScoped" class="px-4 py-3 text-slate-600">{{ collegeName(row.collegeId) }}</td>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/shared/services/api'
import { useCollegeStore } from '@/modules/auth/stores/college.store'

interface AuditRow {
    id: number
    action: string
    status: string
    actorName: string | null
    actorEmail: string | null
    collegeId: number | null
    ip: string | null
    context: Record<string, unknown> | null
    error: string | null
    createdAt: string | null
}

interface CollegeOption { id: number; name: string }

const route = useRoute()
const collegeStore = useCollegeStore()
// Modo SUPERADMIN: exige elegir un colegio; sin selección no se muestran registros.
const collegeScoped = computed(() => !!route.meta.collegeScoped)

const items = ref<AuditRow[]>([])
const actions = ref<string[]>([])
const colleges = ref<CollegeOption[]>([])
const selectedCollegeId = ref<number | ''>('')
const loading = ref(false)
const page = ref(1)
const perPage = ref(25)
const total = ref(0)
const lastPage = ref(1)

const filters = reactive({ action: '', status: '', date_from: '', date_to: '' })

const colspan = computed(() => (collegeScoped.value ? 7 : 6))

function formatDate(iso: string | null): string {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('es-MX')
}

function collegeName(id: number | null): string {
    if (id == null) return '—'
    return colleges.value.find(c => c.id === id)?.name ?? `#${id}`
}

/** Params comunes; incluye college_id en modo scoped. */
function buildParams(): Record<string, unknown> {
    const params: Record<string, unknown> = { page: page.value, per_page: perPage.value }
    if (filters.action) params.action = filters.action
    if (filters.status) params.status = filters.status
    if (filters.date_from) params.date_from = filters.date_from
    if (filters.date_to) params.date_to = filters.date_to
    if (collegeScoped.value && selectedCollegeId.value) params.college_id = selectedCollegeId.value
    return params
}

async function load() {
    // En modo scoped sin colegio elegido no se consulta nada.
    if (collegeScoped.value && !selectedCollegeId.value) {
        items.value = []
        total.value = 0
        lastPage.value = 1
        return
    }
    loading.value = true
    try {
        const { data } = await api.get('/api/v1/audit-logs', { params: buildParams() })
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

function onCollegeChange() {
    // Al cambiar de colegio, recarga acciones (dependen del plantel) y registros.
    loadActions()
    reload()
}

async function loadActions() {
    if (collegeScoped.value && !selectedCollegeId.value) {
        actions.value = []
        return
    }
    try {
        const params: Record<string, unknown> = {}
        if (collegeScoped.value && selectedCollegeId.value) params.college_id = selectedCollegeId.value
        const { data } = await api.get('/api/v1/audit-logs/actions', { params })
        actions.value = data
    } catch { /* no-op */ }
}

async function loadColleges() {
    try {
        await collegeStore.loadColleges()
        colleges.value = collegeStore.colleges.map((c: any) => ({ id: c.id, name: c.name }))
    } catch { /* no-op */ }
}

onMounted(async () => {
    if (collegeScoped.value) await loadColleges()
    loadActions()
    load()
})
</script>
