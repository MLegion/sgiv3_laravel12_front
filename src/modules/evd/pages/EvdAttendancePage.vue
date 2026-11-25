<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import EvdPeriodSelect from '@/modules/evd/components/EvdPeriodSelect.vue'
import type { EvdAttendanceRow } from '@/modules/evd/types/evd.type'
import SkeletonTable from '@/app/components/ui/SkeletonTable.vue'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'

interface CollegeAcademicPeriodOption {
    id: number
    academicPeriod?: { name?: string | null; shortName?: string | null } | null
}

const columns: DataTableColumn<EvdAttendanceRow>[] = [
    { key: 'num_control', label: 'NO. CONTROL', width: '7rem' },
    { key: 'student', label: 'ALUMNO' },
    { key: 'career', label: 'CARRERA', width: '6rem' },
    { key: 'avance', label: 'AVANCE', align: 'right', width: '11rem' },
    { key: 'acuse', label: 'ACUSE', width: '12rem' },
]

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
            <EvdPeriodSelect v-model="selectedCap" :periods="caPeriods" :disabled="loadingCaps" label="Periodo SCA" />
            <div class="flex flex-col gap-1 flex-1 min-w-[220px]">
                <label for="evd-att-search" class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Buscar (nombre / nº control)</label>
                <input id="evd-att-search" v-model="search" type="text" placeholder="Empieza a escribir…"
                       class="border border-slate-300 rounded px-2 py-1.5 text-sm" />
            </div>
            <div class="flex flex-col gap-1 min-w-[160px]">
                <label for="evd-att-status" class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Estado</label>
                <select id="evd-att-status" v-model="statusFilter"
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
        <SkeletonTable v-if="loading" :rows="5" :cols="5" />
        <DataTable v-else :columns="columns" :rows="rows" hide-search
                   caption="Concentrado de evaluación docente"
                   empty-text="No hay alumnos registrados en este periodo.">
            <template #cell-num_control="{ row: r }">
                <span class="font-mono text-xs text-slate-700">{{ r.student.num_control ?? '—' }}</span>
            </template>
            <template #cell-student="{ row: r }">
                <div class="font-bold text-slate-700 uppercase">{{ r.student.full_name }}</div>
            </template>
            <template #cell-career="{ row: r }">
                <span class="text-xs text-slate-600">{{ r.career?.short_name ?? '—' }}</span>
            </template>
            <template #cell-avance="{ row: r }">
                <div class="text-xs text-slate-500">
                    <span class="font-bold text-emerald-700 tabular-nums">{{ r.completed_assignments }}</span>
                    / {{ r.total_assignments }}
                </div>
                <div class="h-1.5 bg-slate-100 rounded overflow-hidden mt-1">
                    <div class="h-full bg-emerald-500"
                         :style="{ width: r.progress_pct + '%' }"></div>
                </div>
                <div class="text-[10px] text-slate-400 mt-0.5">{{ r.progress_pct }}%</div>
            </template>
            <template #cell-acuse="{ row: r }">
                <div v-if="r.acuse" class="text-xs">
                    <div class="font-mono font-bold text-emerald-700">{{ r.acuse.folio }}</div>
                    <div class="text-[10px] text-slate-500">{{ formatDate(r.acuse.issued_at) }}</div>
                </div>
                <span v-else class="text-[10px] uppercase text-slate-400">— pendiente —</span>
            </template>
        </DataTable>
    </div>
</template>
