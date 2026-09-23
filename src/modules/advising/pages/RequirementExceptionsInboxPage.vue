<template>
    <div class="space-y-4 max-w-5xl">
        <div>
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Excepciones de Requisitos</h1>
            <p class="text-xs text-slate-500 mt-1">
                Solicitudes de tus alumnos para saltarse un requisito de reinscripción. Al aprobar, el
                requisito se da por cubierto y el alumno puede continuar.
            </p>
        </div>

        <!-- Filtros -->
        <div class="bg-white border rounded-xl p-3 shadow-sm">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                <input v-model="search" type="search" placeholder="Alumno o núm. control…"
                    class="lg:col-span-2 border rounded-md px-3 py-1.5 text-sm" />
                <select v-model="periodFilter" class="border rounded-md px-3 py-1.5 text-sm">
                    <option :value="null">Todos los periodos</option>
                    <option v-for="p in periodOptions" :key="p.id" :value="p.id">{{ p.name }}</option>
                </select>
                <select v-model="careerFilter" class="border rounded-md px-3 py-1.5 text-sm">
                    <option value="">Todas las carreras</option>
                    <option v-for="c in careerOptions" :key="c" :value="c">{{ c }}</option>
                </select>
                <select v-model="statusFilter" class="border rounded-md px-3 py-1.5 text-sm">
                    <option value="">Todos los estados</option>
                    <option value="pending">PENDIENTES</option>
                    <option value="approved">APROBADAS</option>
                    <option value="rejected">RECHAZADAS</option>
                </select>
            </div>
            <div class="flex items-center justify-between mt-2">
                <span class="text-xs text-slate-400">{{ items.length }} de {{ allItems.length }} solicitud(es)</span>
                <div class="flex items-center gap-3">
                    <button v-if="hasActiveFilters" type="button" class="text-xs text-blue-600 hover:underline" @click="clearFilters">Limpiar filtros</button>
                    <button type="button" class="text-xs text-slate-500 hover:text-slate-700 hover:underline" @click="load">Actualizar</button>
                </div>
            </div>
        </div>

        <div v-if="okMsg" class="text-sm px-4 py-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">{{ okMsg }}</div>
        <div v-if="loadError" class="text-sm px-4 py-3 rounded-lg bg-red-50 text-red-700 border border-red-100">{{ loadError }}</div>

        <div v-if="loading" class="bg-white border rounded-xl p-6 text-center text-sm text-slate-400">Cargando…</div>
        <div v-else-if="!items.length" class="bg-white border rounded-xl p-8 text-center text-sm text-slate-400 italic">
            Sin solicitudes.
        </div>

        <ul v-else class="space-y-3">
            <li v-for="ex in pagedItems" :key="ex.id" class="bg-white border rounded-xl shadow-sm p-4 space-y-3">
                <div class="flex items-start justify-between gap-3 flex-wrap">
                    <div class="min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="text-sm font-bold text-slate-800">{{ ex.student }}</span>
                            <span v-if="ex.numControl" class="text-[11px] font-mono text-slate-400">{{ ex.numControl }}</span>
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold" :class="statusClass(ex.status)">
                                {{ statusLabel(ex.status) }}
                            </span>
                        </div>
                        <p class="text-sm text-slate-700 mt-1">
                            Requisito: <strong>{{ ex.requirementLabel }}</strong>
                        </p>
                        <p class="text-[11px] text-slate-400">
                            <span v-if="ex.careerName">{{ ex.careerName }}</span>
                            <span v-if="ex.modalityName"> · {{ ex.modalityName }}</span>
                            <span v-if="ex.periodName"> · {{ ex.periodName }}</span>
                        </p>
                        <p v-if="ex.studentNote" class="text-xs text-slate-500 mt-1.5 bg-slate-50 border rounded-md px-3 py-2">
                            “{{ ex.studentNote }}”
                        </p>
                        <p v-if="ex.resolutionNote" class="text-xs text-slate-500 mt-1.5">
                            <span class="font-semibold">Resolución:</span> {{ ex.resolutionNote }}
                        </p>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                        <button type="button"
                                class="text-xs px-3 py-1.5 border border-slate-300 text-slate-600 rounded-md hover:bg-slate-50"
                                @click="openView(ex)">Ver</button>
                        <template v-if="ex.status === 'pending'">
                            <button type="button"
                                    class="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                                    @click="openResolve(ex, true)">Aprobar</button>
                            <button type="button"
                                    class="text-xs px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700"
                                    @click="openResolve(ex, false)">Rechazar</button>
                        </template>
                    </div>
                </div>
            </li>
        </ul>

        <!-- Paginación -->
        <div v-if="!loading && items.length > pageSize" class="flex items-center justify-between text-xs text-slate-500">
            <span>Mostrando {{ pageStart }}–{{ pageEnd }} de {{ items.length }}</span>
            <div class="flex items-center gap-1">
                <button type="button" class="px-2.5 py-1 rounded border bg-white disabled:opacity-40" :disabled="page <= 1" @click="page--">‹</button>
                <span class="px-2">Página {{ page }} de {{ totalPages }}</span>
                <button type="button" class="px-2.5 py-1 rounded border bg-white disabled:opacity-40" :disabled="page >= totalPages" @click="page++">›</button>
            </div>
        </div>

        <!-- Modal resolver -->
        <Teleport to="body">
            <div v-if="resolveModal.open" class="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-black/40" @click="resolveModal.open = false" />
                <div class="relative bg-white rounded-xl shadow-lg w-full max-w-md p-6 space-y-4 z-10">
                    <h3 class="text-sm font-bold text-slate-800">
                        {{ resolveModal.approve ? 'Aprobar excepción' : 'Rechazar solicitud' }}
                    </h3>
                    <p class="text-sm text-slate-600">
                        Requisito <strong>{{ resolveModal.label }}</strong> de
                        <strong>{{ resolveModal.student }}</strong>.
                    </p>
                    <label class="block">
                        <span class="text-xs font-semibold text-slate-500 uppercase">
                            Comentario {{ resolveModal.approve ? '(opcional)' : '(motivo)' }}
                        </span>
                        <textarea v-model="resolveModal.note" rows="3"
                            class="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                            placeholder="Comentario para el alumno…"></textarea>
                    </label>
                    <p v-if="resolveModal.error" class="text-xs text-red-600">{{ resolveModal.error }}</p>
                    <div class="flex justify-end gap-2">
                        <button type="button" class="px-4 py-2 text-sm rounded-lg border hover:bg-slate-50"
                                :disabled="resolveModal.submitting" @click="resolveModal.open = false">Cancelar</button>
                        <button type="button"
                                class="px-4 py-2 text-sm rounded-lg text-white disabled:opacity-50"
                                :class="resolveModal.approve ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'"
                                :disabled="resolveModal.submitting" @click="submitResolve">
                            {{ resolveModal.submitting ? 'Guardando…' : (resolveModal.approve ? 'Aprobar' : 'Rechazar') }}
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>

        <!-- Modal detalle (Ver) -->
        <Teleport to="body">
            <div v-if="viewModal.open && viewModal.ex" class="fixed inset-0 z-50 flex items-center justify-center p-4" @keydown.esc="viewModal.open = false">
                <div class="absolute inset-0 bg-black/40" @click="viewModal.open = false" />
                <div class="relative bg-white rounded-xl shadow-lg w-full max-w-lg max-h-[88vh] overflow-auto z-10">
                    <div class="flex items-start justify-between gap-3 px-6 py-4 border-b bg-slate-50">
                        <div class="min-w-0">
                            <h3 class="text-sm font-bold text-slate-800">Detalle de la solicitud</h3>
                            <p class="text-[11px] text-slate-400">Excepción de requisito de reinscripción</p>
                        </div>
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0" :class="statusClass(viewModal.ex.status)">
                            {{ statusLabel(viewModal.ex.status) }}
                        </span>
                    </div>
                    <div class="px-6 py-4 space-y-4 text-sm">
                        <div>
                            <div class="text-base font-bold text-slate-800">{{ viewModal.ex.student }}</div>
                            <div class="text-xs font-mono text-slate-400">{{ viewModal.ex.numControl ?? '—' }}</div>
                        </div>
                        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                            <div><dt class="text-[10px] uppercase text-slate-400 font-semibold">Carrera</dt><dd class="text-slate-700">{{ viewModal.ex.careerName ?? '—' }}</dd></div>
                            <div><dt class="text-[10px] uppercase text-slate-400 font-semibold">Modalidad</dt><dd class="text-slate-700">{{ viewModal.ex.modalityName ?? '—' }}</dd></div>
                            <div><dt class="text-[10px] uppercase text-slate-400 font-semibold">Periodo</dt><dd class="text-slate-700">{{ viewModal.ex.periodName ?? '—' }}</dd></div>
                            <div><dt class="text-[10px] uppercase text-slate-400 font-semibold">Gate</dt><dd class="text-slate-700 font-mono text-xs">{{ viewModal.ex.gateCode }}</dd></div>
                            <div class="sm:col-span-2"><dt class="text-[10px] uppercase text-slate-400 font-semibold">Requisito</dt><dd class="text-slate-700 font-semibold">{{ viewModal.ex.requirementLabel }} <span class="font-mono text-[11px] text-slate-400">({{ viewModal.ex.requirementCode }})</span></dd></div>
                            <div><dt class="text-[10px] uppercase text-slate-400 font-semibold">Solicitada</dt><dd class="text-slate-700">{{ fmtDate(viewModal.ex.requestedAt) }}</dd></div>
                            <div><dt class="text-[10px] uppercase text-slate-400 font-semibold">Resuelta</dt><dd class="text-slate-700">{{ fmtDate(viewModal.ex.resolvedAt) }}</dd></div>
                        </dl>
                        <div>
                            <dt class="text-[10px] uppercase text-slate-400 font-semibold mb-1">Justificación del alumno</dt>
                            <dd class="text-slate-600 bg-slate-50 border rounded-md px-3 py-2 whitespace-pre-wrap">{{ viewModal.ex.studentNote || '— Sin comentario —' }}</dd>
                        </div>
                        <div v-if="viewModal.ex.resolutionNote">
                            <dt class="text-[10px] uppercase text-slate-400 font-semibold mb-1">Resolución</dt>
                            <dd class="text-slate-600 bg-slate-50 border rounded-md px-3 py-2 whitespace-pre-wrap">{{ viewModal.ex.resolutionNote }}</dd>
                        </div>
                    </div>
                    <div class="flex justify-end gap-2 px-6 py-3 border-t bg-slate-50">
                        <template v-if="viewModal.ex.status === 'pending'">
                            <button type="button" class="px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                                    @click="openResolve(viewModal.ex, true); viewModal.open = false">Aprobar</button>
                            <button type="button" class="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
                                    @click="openResolve(viewModal.ex, false); viewModal.open = false">Rechazar</button>
                        </template>
                        <button type="button" class="px-4 py-2 text-sm rounded-lg border hover:bg-slate-50" @click="viewModal.open = false">Cerrar</button>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { PendingRequirementException, RequirementExceptionStatus } from '@/modules/advising/types/advising.type'

const allItems = ref<PendingRequirementException[]>([])
const loading = ref(false)
const loadError = ref('')
const okMsg = ref('')

// Filtros (client-side: el conjunto por jefe de carrera es pequeño).
const search = ref('')
const periodFilter = ref<number | null>(null)
const careerFilter = ref('')
const statusFilter = ref('')

// Periodo por id (nombre para mostrar): distintos periodos presentes.
const periodOptions = computed(() => {
    const map = new Map<number, string>()
    for (const i of allItems.value) {
        if (i.periodId != null) map.set(i.periodId, i.periodName ?? `Periodo ${i.periodId}`)
    }
    return [...map.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => b.id - a.id)
})
const careerOptions = computed(() =>
    [...new Set(allItems.value.map(i => i.careerName).filter(Boolean) as string[])].sort())

const hasActiveFilters = computed(() =>
    !!(search.value.trim() || periodFilter.value != null || careerFilter.value || statusFilter.value))

const items = computed(() => {
    const q = search.value.trim().toLowerCase()
    return allItems.value.filter((ex) => {
        if (statusFilter.value && ex.status !== statusFilter.value) return false
        if (periodFilter.value != null && ex.periodId !== periodFilter.value) return false
        if (careerFilter.value && ex.careerName !== careerFilter.value) return false
        if (q && !`${ex.student} ${ex.numControl ?? ''}`.toLowerCase().includes(q)) return false
        return true
    })
})

function clearFilters() {
    search.value = ''
    periodFilter.value = null
    careerFilter.value = ''
    statusFilter.value = ''
}

// Paginación (client-side sobre el conjunto ya filtrado).
const page = ref(1)
const pageSize = 10
const totalPages = computed(() => Math.max(1, Math.ceil(items.value.length / pageSize)))
const pagedItems = computed(() => items.value.slice((page.value - 1) * pageSize, page.value * pageSize))
const pageStart = computed(() => items.value.length === 0 ? 0 : (page.value - 1) * pageSize + 1)
const pageEnd = computed(() => Math.min(page.value * pageSize, items.value.length))

// Al cambiar filtros/tamaño de datos, vuelve a la primera página (y corrige si se pasa).
watch([search, periodFilter, careerFilter, statusFilter], () => { page.value = 1 })
watch(totalPages, (tp) => { if (page.value > tp) page.value = tp })

// Modal de detalle (Ver).
const viewModal = reactive<{ open: boolean; ex: PendingRequirementException | null }>({ open: false, ex: null })
function openView(ex: PendingRequirementException) {
    viewModal.ex = ex
    viewModal.open = true
}

function fmtDate(v: string | null): string {
    if (!v) return '—'
    const d = new Date(v.replace(' ', 'T'))
    return isNaN(d.getTime()) ? v : d.toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
}

const resolveModal = reactive<{
    open: boolean; id: number | null; approve: boolean; label: string; student: string;
    note: string; submitting: boolean; error: string
}>({ open: false, id: null, approve: true, label: '', student: '', note: '', submitting: false, error: '' })

function statusLabel(s: RequirementExceptionStatus): string {
    return ({ pending: 'PENDIENTE', approved: 'APROBADA', rejected: 'RECHAZADA' } as Record<string, string>)[s] ?? s.toUpperCase()
}
function statusClass(s: RequirementExceptionStatus): string {
    return ({
        pending:  'bg-amber-100 text-amber-700',
        approved: 'bg-emerald-100 text-emerald-700',
        rejected: 'bg-red-100 text-red-700',
    } as Record<string, string>)[s] ?? 'bg-slate-100 text-slate-500'
}

async function load() {
    loading.value = true
    loadError.value = ''
    try {
        // Se traen TODOS los estados; el filtrado se hace en el cliente.
        // 'all' es un centinela no vacío (un status='' se puede perder y el
        // backend caería a 'pending').
        const { data } = await api.get(API.ADVISING_API.requirementExceptions.pending, {
            params: { status: 'all' },
        })
        allItems.value = Array.isArray(data?.data) ? data.data : []
    } catch (e: any) {
        allItems.value = []
        loadError.value = e?.response?.status === 403
            ? 'No tienes permiso para ver esta bandeja.'
            : (e?.response?.data?.message ?? 'No se pudieron cargar las solicitudes.')
    } finally {
        loading.value = false
    }
}

// Preselecciona el periodo actual de asesoría reticular (una sola vez).
let defaultPeriodApplied = false
async function applyDefaultPeriod() {
    if (defaultPeriodApplied) return
    defaultPeriodApplied = true
    try {
        const { data } = await api.get(API.ADVISING_API.enrollments.adminDefaultPeriod)
        const id = data?.college_academic_period_id ?? null
        // Solo si ese periodo tiene solicitudes (aparece entre las opciones).
        if (id && periodOptions.value.some(p => p.id === id)) periodFilter.value = id
    } catch { /* sin periodo sugerido: se queda en Todos */ }
}

function openResolve(ex: PendingRequirementException, approve: boolean) {
    resolveModal.open = true
    resolveModal.id = ex.id
    resolveModal.approve = approve
    resolveModal.label = ex.requirementLabel
    resolveModal.student = ex.student
    resolveModal.note = ''
    resolveModal.error = ''
}

async function submitResolve() {
    if (resolveModal.id === null || resolveModal.submitting) return
    if (!resolveModal.approve && !resolveModal.note.trim()) {
        resolveModal.error = 'Indica el motivo del rechazo.'
        return
    }
    resolveModal.submitting = true
    resolveModal.error = ''
    try {
        const { data } = await api.post(API.ADVISING_API.requirementExceptions.resolve(resolveModal.id), {
            approve: resolveModal.approve,
            note:    resolveModal.note || null,
        })
        resolveModal.open = false
        okMsg.value = data?.message ?? 'Solicitud resuelta.'
        setTimeout(() => okMsg.value = '', 4000)
        await load()
    } catch (e: any) {
        resolveModal.error = e?.response?.data?.message ?? 'No se pudo resolver la solicitud.'
    } finally {
        resolveModal.submitting = false
    }
}

onMounted(async () => {
    await load()
    await applyDefaultPeriod()
})
</script>
