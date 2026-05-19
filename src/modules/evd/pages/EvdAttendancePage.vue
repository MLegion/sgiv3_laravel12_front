<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { EvdAttendanceRow } from '@/modules/evd/types/evd.type'

interface CollegeAcademicPeriodOption {
    id: number
    academicPeriod?: { name?: string | null; shortName?: string | null } | null
}

const caPeriods    = ref<CollegeAcademicPeriodOption[]>([])
const selectedCap  = ref<number | null>(null)
const rows         = ref<EvdAttendanceRow[]>([])
const loading      = ref(false)
const loadingCaps  = ref(true)
const error        = ref('')
const search       = ref('')
const statusFilter = ref<'all' | 'submitted' | 'pending'>('all')

const stats = computed(() => {
    const total      = rows.value.length
    const submitted  = rows.value.filter(r => r.acuse !== null).length
    const inProgress = rows.value.filter(r => r.acuse === null && r.completed_assignments > 0).length
    const pending    = rows.value.filter(r => r.acuse === null && r.completed_assignments === 0).length
    return { total, submitted, inProgress, pending }
})

async function loadCaps() {
    loadingCaps.value = true
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.collegeAcademicPeriods.list, {
            params: { per_page: 50, order_by: 'id', order_dir: 'desc' },
        })
        caPeriods.value = Array.isArray(data?.items) ? data.items : []
        if (caPeriods.value.length && selectedCap.value === null) {
            selectedCap.value = caPeriods.value[0].id
        }
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudieron cargar los periodos.'
    } finally {
        loadingCaps.value = false
    }
}

async function loadRows() {
    if (selectedCap.value === null) return
    loading.value = true
    error.value = ''
    try {
        const params: Record<string, string> = {}
        if (search.value.trim() !== '') params.search = search.value.trim()
        if (statusFilter.value !== 'all') params.status = statusFilter.value
        const { data } = await api.get(API.EVD_API.admin.attendanceSummary(selectedCap.value), { params })
        rows.value = Array.isArray(data?.data) ? data.data : []
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudo cargar el concentrado.'
    } finally {
        loading.value = false
    }
}

function periodOptionLabel(p: CollegeAcademicPeriodOption): string {
    const name  = p.academicPeriod?.name      ?? ''
    const short = p.academicPeriod?.shortName ?? ''
    if (name && short) return `${name} (${short})`
    return name || short || `Periodo #${p.id}`
}

function formatDate(s: string | null): string {
    if (!s) return '—'
    try { return new Date(s).toLocaleDateString('es-MX') } catch { return s }
}

// Refresh rows when the CAP changes or filters change
watch([selectedCap, statusFilter], () => { loadRows() })
let searchT: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
    if (searchT) clearTimeout(searchT)
    searchT = setTimeout(() => loadRows(), 350)
})

onMounted(loadCaps)
</script>

<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-2">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Concentrado de Evaluación Docente</h1>
        </div>

        <div v-if="error" class="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded px-3 py-2">{{ error }}</div>

        <!-- Filtros -->
        <div class="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-end gap-3">
            <div class="flex flex-col gap-1 min-w-[260px]">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Periodo SCA</label>
                <select v-model.number="selectedCap"
                        :disabled="loadingCaps"
                        class="border border-slate-300 rounded px-2 py-1.5 text-sm">
                    <option :value="null" disabled>Selecciona…</option>
                    <option v-for="p in caPeriods" :key="p.id" :value="p.id">
                        {{ periodOptionLabel(p) }}
                    </option>
                </select>
            </div>
            <div class="flex flex-col gap-1 flex-1 min-w-[220px]">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Buscar (nombre / nº control)</label>
                <input v-model="search" type="text" placeholder="Empieza a escribir…"
                       class="border border-slate-300 rounded px-2 py-1.5 text-sm" />
            </div>
            <div class="flex flex-col gap-1 min-w-[160px]">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Estado</label>
                <select v-model="statusFilter"
                        class="border border-slate-300 rounded px-2 py-1.5 text-sm">
                    <option value="all">Todos</option>
                    <option value="submitted">Solo entregaron acuse</option>
                    <option value="pending">Sin acuse aún</option>
                </select>
            </div>
        </div>

        <!-- Stats -->
        <div v-if="rows.length" class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div class="bg-white border rounded-lg p-3">
                <div class="text-[10px] uppercase font-black text-slate-500 tracking-wider">Total alumnos</div>
                <div class="text-2xl font-bold tabular-nums text-slate-700">{{ stats.total }}</div>
            </div>
            <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <div class="text-[10px] uppercase font-black text-emerald-700 tracking-wider">Con acuse</div>
                <div class="text-2xl font-bold tabular-nums text-emerald-700">{{ stats.submitted }}</div>
            </div>
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div class="text-[10px] uppercase font-black text-blue-700 tracking-wider">En progreso</div>
                <div class="text-2xl font-bold tabular-nums text-blue-700">{{ stats.inProgress }}</div>
            </div>
            <div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div class="text-[10px] uppercase font-black text-amber-700 tracking-wider">No iniciaron</div>
                <div class="text-2xl font-bold tabular-nums text-amber-700">{{ stats.pending }}</div>
            </div>
        </div>

        <!-- Tabla -->
        <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <table class="w-full text-sm">
                <thead class="bg-slate-50 text-slate-600 text-[10px] uppercase tracking-wider">
                    <tr>
                        <th class="text-left  px-3 py-2 w-28">NO. CONTROL</th>
                        <th class="text-left  px-3 py-2">ALUMNO</th>
                        <th class="text-left  px-3 py-2 w-24">CARRERA</th>
                        <th class="text-right px-3 py-2 w-44">AVANCE</th>
                        <th class="text-left  px-3 py-2 w-48">ACUSE</th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    <tr v-if="loading">
                        <td colspan="5" class="px-3 py-6 text-center text-sm text-slate-400">Cargando…</td>
                    </tr>
                    <tr v-else-if="!rows.length">
                        <td colspan="5" class="px-3 py-6 text-center text-sm text-slate-400 italic">
                            No hay alumnos con assignments en este periodo.
                        </td>
                    </tr>
                    <tr v-for="r in rows" :key="r.student.id" class="hover:bg-slate-50">
                        <td class="px-3 py-2 font-mono text-xs text-slate-700">{{ r.student.num_control ?? '—' }}</td>
                        <td class="px-3 py-2">
                            <div class="font-bold text-slate-700 uppercase">{{ r.student.full_name }}</div>
                        </td>
                        <td class="px-3 py-2 text-xs text-slate-600">{{ r.career?.short_name ?? '—' }}</td>
                        <td class="px-3 py-2 text-right">
                            <div class="text-xs text-slate-500">
                                <span class="font-bold text-emerald-700 tabular-nums">{{ r.completed_assignments }}</span>
                                / {{ r.total_assignments }}
                            </div>
                            <div class="h-1.5 bg-slate-100 rounded overflow-hidden mt-1">
                                <div class="h-full bg-emerald-500"
                                     :style="{ width: r.progress_pct + '%' }"></div>
                            </div>
                            <div class="text-[10px] text-slate-400 mt-0.5">{{ r.progress_pct }}%</div>
                        </td>
                        <td class="px-3 py-2">
                            <div v-if="r.acuse" class="text-xs">
                                <div class="font-mono font-bold text-emerald-700">{{ r.acuse.folio }}</div>
                                <div class="text-[10px] text-slate-500">{{ formatDate(r.acuse.issued_at) }}</div>
                            </div>
                            <span v-else class="text-[10px] uppercase text-slate-400">— pendiente —</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
