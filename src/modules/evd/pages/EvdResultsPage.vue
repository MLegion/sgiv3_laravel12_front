<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import EvdPeriodSelect from '@/modules/evd/components/EvdPeriodSelect.vue'
import EvdReportDrawer from '@/modules/evd/components/EvdReportDrawer.vue'
import { ReportCode } from '@/modules/reports/types/reportCodes'
import SkeletonTable from '@/app/components/ui/SkeletonTable.vue'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'
import type {
    EvdLevel,
    EvdResultsFilterOptions,
    EvdTeacherResultRow,
} from '@/modules/evd/types/evd.type'

const columns: DataTableColumn<EvdTeacherResultRow>[] = [
    { key: 'teacher', label: 'DOCENTE' },
    { key: 'campus', label: 'CAMPUS' },
    { key: 'modality', label: 'TIPO DE MODALIDAD' },
    { key: 'areas', label: 'ÁREAS', align: 'right', width: '6rem' },
    { key: 'responses', label: 'RESPUESTAS', align: 'right', width: '7rem' },
    { key: 'average', label: 'PROMEDIO', align: 'right', width: '7rem' },
    { key: 'level', label: 'NIVEL', width: '8rem' },
    { key: 'actions', label: '', align: 'right', width: '5rem' },
]

interface CollegeAcademicPeriodOption {
    id: number
    academicPeriod?: { name?: string | null; shortName?: string | null } | null
}

const route  = useRoute()
const router = useRouter()

const caPeriods   = ref<CollegeAcademicPeriodOption[]>([])
const loadingCaps = ref(true)

const selectedCap    = ref<number | null>(null)
const campusId       = ref<number | null>(null)
const modalityTypeId = ref<number | null>(null)
const careerId       = ref<number | null>(null)
const search         = ref('')

const filterOptions = ref<EvdResultsFilterOptions>({ campuses: [], modality_types: [], careers: [] })
const rows          = ref<EvdTeacherResultRow[]>([])
const loading       = ref(false)
const error         = ref('')

// Drawer del reporte (a la derecha). Sirve para el reporte por docente y el general.
const reportDrawer = ref<{ open: boolean; code: string; title: string; filename: string; params: Record<string, unknown> }>({
    open: false, code: '', title: '', filename: 'reporte', params: {},
})
function openReport(r: EvdTeacherResultRow) {
    reportDrawer.value = {
        open: true,
        code: ReportCode.TEACHER_EVALUATION,
        title: r.teacher.name,
        filename: `evaluacion-docente-${r.teacher.id}`,
        params: {
            cap:              selectedCap.value,
            teacher_id:       r.teacher.id,
            campus_id:        r.campus_id ?? campusId.value ?? undefined,
            modality_type_id: r.modality_type_id ?? modalityTypeId.value ?? undefined,
        },
    }
}
function openGeneralReport() {
    reportDrawer.value = {
        open: true,
        code: ReportCode.TEACHER_EVALUATION_GENERAL,
        title: 'Reporte general por modalidad y ubicación',
        filename: 'evaluacion-general',
        params: {
            cap:              selectedCap.value,
            modality_type_id: modalityTypeId.value ?? undefined,
            campus_id:        campusId.value ?? undefined,
        },
    }
}

const hasPeriod = computed(() => selectedCap.value !== null)

function queryNum(key: string): number | null {
    const v = route.query[key]
    return v !== undefined && v !== null && v !== '' ? Number(v) : null
}

function syncUrl(): void {
    router.replace({
        query: {
            cap:           selectedCap.value ?? undefined,
            campus_id:     campusId.value ?? undefined,
            modality_type: modalityTypeId.value ?? undefined,
            career_id:     careerId.value ?? undefined,
        },
    }).catch(() => {})
}

async function loadCaps() {
    loadingCaps.value = true
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.collegeAcademicPeriods.list, {
            params: { per_page: 50, order_by: 'id', order_dir: 'desc' },
        })
        caPeriods.value = Array.isArray(data?.items) ? data.items : []
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudieron cargar los periodos.'
    } finally {
        loadingCaps.value = false
    }
}

async function loadFilterOptions() {
    if (selectedCap.value === null) {
        filterOptions.value = { campuses: [], modality_types: [], careers: [] }
        return
    }
    try {
        const { data } = await api.get(API.EVD_API.admin.resultsFilters(selectedCap.value))
        filterOptions.value = {
            campuses:       Array.isArray(data?.campuses) ? data.campuses : [],
            modality_types: Array.isArray(data?.modality_types) ? data.modality_types : [],
            careers:        Array.isArray(data?.careers) ? data.careers : [],
        }
    } catch {
        filterOptions.value = { campuses: [], modality_types: [], careers: [] }
    }
}

async function loadResults() {
    if (selectedCap.value === null) {
        rows.value = []
        return
    }
    loading.value = true
    error.value = ''
    try {
        const params: Record<string, string | number> = {}
        if (campusId.value !== null)       params.campus_id = campusId.value
        if (modalityTypeId.value !== null) params.modality_type_id = modalityTypeId.value
        if (careerId.value !== null)       params.career_id = careerId.value
        if (search.value.trim() !== '')    params.search = search.value.trim()

        const { data } = await api.get(API.EVD_API.admin.results(selectedCap.value), { params })
        rows.value = Array.isArray(data?.data) ? data.data : []
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudieron cargar los resultados.'
        rows.value = []
    } finally {
        loading.value = false
    }
}

// Cambiar de periodo limpia la segmentación y recarga catálogos + resultados.
async function onPeriodChange() {
    campusId.value = null
    modalityTypeId.value = null
    careerId.value = null
    syncUrl()
    await loadFilterOptions()
    await loadResults()
}

watch([campusId, modalityTypeId, careerId], () => {
    syncUrl()
    loadResults()
})

let searchT: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
    if (searchT) clearTimeout(searchT)
    searchT = setTimeout(loadResults, 350)
})


function avgClass(avg: number | null): string {
    if (avg === null) return 'text-slate-400'
    if (avg >= 4.75) return 'text-emerald-700 font-bold'
    if (avg >= 4.25) return 'text-emerald-600 font-bold'
    if (avg >= 3.75) return 'text-blue-600 font-bold'
    if (avg >= 3.25) return 'text-amber-600 font-bold'
    return 'text-rose-600 font-bold'
}

function levelFromAvg(avg: number | null): EvdLevel {
    if (avg === null) return null
    if (avg >= 4.75) return 'EXCELENTE'
    if (avg >= 4.25) return 'NOTABLE'
    if (avg >= 3.75) return 'BUENO'
    if (avg >= 3.25) return 'SUFICIENTE'
    return 'INSUFICIENTE'
}

function goToTeacher(r: EvdTeacherResultRow) {
    router.push({
        name: 'evd.admin.teacher-detail',
        params: { teacherId: r.teacher.id },
        query: {
            cap:           selectedCap.value ?? undefined,
            // Se prioriza el campus/modalidad de la fila (más preciso que el filtro global).
            campus_id:     (r.campus_id ?? campusId.value) ?? undefined,
            modality_type: (r.modality_type_id ?? modalityTypeId.value) ?? undefined,
            career_id:     careerId.value ?? undefined,
        },
    })
}

onMounted(async () => {
    await loadCaps()
    // Restaura el estado de filtros desde la URL (volver desde el detalle).
    const cap = queryNum('cap')
    if (cap !== null && caPeriods.value.some(p => p.id === cap)) {
        selectedCap.value    = cap
        campusId.value       = queryNum('campus_id')
        modalityTypeId.value = queryNum('modality_type')
        careerId.value       = queryNum('career_id')
        await loadFilterOptions()
        await loadResults()
    }
})
</script>

<template>
    <div class="space-y-4">
        <div class="flex items-start justify-between gap-3 flex-wrap">
            <div>
                <h1 class="text-xl font-semibold text-slate-800 uppercase">Resultados de Evaluación</h1>
                <p class="text-xs text-slate-500 mt-0.5">
                    Promedio general en escala Likert (1–5). Selecciona un periodo y, si lo deseas,
                    segmenta por campus, modalidad o carrera.
                </p>
            </div>
            <button
                :disabled="!hasPeriod"
                class="px-4 py-2 text-sm rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 shrink-0"
                title="Concentrado de todos los docentes por modalidad y ubicación"
                @click="openGeneralReport"
            >
                Reporte general
            </button>
        </div>

        <div v-if="error" class="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded px-3 py-2">{{ error }}</div>

        <!-- Filtros -->
        <div class="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-end gap-3">
            <EvdPeriodSelect v-model="selectedCap" :periods="caPeriods" :disabled="loadingCaps"
                             label="Periodo *" @change="onPeriodChange" />
            <div class="flex flex-col gap-1 min-w-[170px]">
                <label for="evd-res-campus" class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Campus</label>
                <select id="evd-res-campus" v-model.number="campusId" :disabled="!hasPeriod"
                        class="border border-slate-300 rounded px-2 py-1.5 text-sm disabled:bg-slate-50">
                    <option :value="null">Todos</option>
                    <option v-for="c in filterOptions.campuses" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
            </div>
            <div class="flex flex-col gap-1 min-w-[170px]">
                <label for="evd-res-modality" class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tipo de modalidad</label>
                <select id="evd-res-modality" v-model.number="modalityTypeId" :disabled="!hasPeriod"
                        class="border border-slate-300 rounded px-2 py-1.5 text-sm disabled:bg-slate-50">
                    <option :value="null">Todas</option>
                    <option v-for="m in filterOptions.modality_types" :key="m.id" :value="m.id">{{ m.name }}</option>
                </select>
            </div>
            <div class="flex flex-col gap-1 min-w-[190px]">
                <label for="evd-res-career" class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Carrera</label>
                <select id="evd-res-career" v-model.number="careerId" :disabled="!hasPeriod"
                        class="border border-slate-300 rounded px-2 py-1.5 text-sm disabled:bg-slate-50">
                    <option :value="null">Todas</option>
                    <option v-for="c in filterOptions.careers" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
            </div>
            <div class="flex flex-col gap-1 flex-1 min-w-[200px]">
                <label for="evd-res-search" class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Buscar docente</label>
                <input id="evd-res-search" v-model="search" :disabled="!hasPeriod" type="text" placeholder="Nombre o ID"
                       class="border border-slate-300 rounded px-2 py-1.5 text-sm disabled:bg-slate-50" />
            </div>
        </div>

        <!-- Sin periodo -->
        <div v-if="!hasPeriod"
             class="bg-white border border-dashed border-slate-300 rounded-lg px-4 py-12 text-center">
            <p class="text-sm text-slate-500">Selecciona un periodo para ver los resultados.</p>
        </div>

        <!-- Tabla -->
        <template v-else>
            <SkeletonTable v-if="loading" :rows="5" :cols="8" />
            <DataTable v-else :columns="columns" :rows="rows" hide-search
                       caption="Resultados de evaluación"
                       empty-text="No hay resultados para los filtros seleccionados.">
                <template #cell-teacher="{ row: r }">
                    <div class="font-bold text-slate-700 uppercase">{{ r.teacher.name }}</div>
                    <div class="text-[10px] font-mono text-slate-400">{{ r.teacher.custom_id ?? '—' }}</div>
                </template>
                <template #cell-campus="{ row: r }">
                    <span class="text-xs text-slate-600">{{ r.campus_name ?? '—' }}</span>
                </template>
                <template #cell-modality="{ row: r }">
                    <span class="text-xs text-slate-600">{{ r.modality_type_name ?? '—' }}</span>
                </template>
                <template #cell-areas="{ row: r }">
                    <span class="text-xs text-slate-600 tabular-nums">{{ r.areas_count }}</span>
                </template>
                <template #cell-responses="{ row: r }">
                    <span class="text-xs text-slate-600 tabular-nums">{{ r.total_responses }}</span>
                </template>
                <template #cell-average="{ row: r }">
                    <span class="tabular-nums" :class="avgClass(r.overall_avg)">
                        {{ r.overall_avg !== null ? r.overall_avg.toFixed(2) : '—' }}
                    </span>
                </template>
                <template #cell-level="{ row: r }">
                    <span v-if="r.overall_avg !== null"
                          class="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                          :class="avgClass(r.overall_avg) + ' bg-slate-50'">
                        {{ levelFromAvg(r.overall_avg) }}
                    </span>
                </template>
                <template #cell-actions="{ row: r }">
                    <span class="whitespace-nowrap">
                        <button class="text-xs px-2.5 py-1 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 mr-1" @click="openReport(r)">
                            Reporte
                        </button>
                        <button class="text-blue-600 hover:underline text-sm" @click="goToTeacher(r)">
                            Detalle →
                        </button>
                    </span>
                </template>
            </DataTable>
        </template>

        <EvdReportDrawer
            :open="reportDrawer.open"
            :report-code="reportDrawer.code"
            :params="reportDrawer.params"
            :title="reportDrawer.title"
            :filename="reportDrawer.filename"
            @close="reportDrawer.open = false"
        />
    </div>
</template>
