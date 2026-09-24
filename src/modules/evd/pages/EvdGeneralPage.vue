<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import EvdPeriodSelect from '@/modules/evd/components/EvdPeriodSelect.vue'
import EvdReportDrawer from '@/modules/evd/components/EvdReportDrawer.vue'
import { ReportCode } from '@/modules/reports/types/reportCodes'

interface PeriodOption { id: number; status?: string | null; academicPeriod?: { name?: string | null; shortName?: string | null } | null }
interface GeneralRow {
    teacher_id: number; docente: string
    a: number|null; b: number|null; c: number|null; d: number|null; e: number|null
    f: number|null; g: number|null; h: number|null; i: number|null; j: number|null
    promedio: number|null; nivel: string|null
}

const caPeriods   = ref<PeriodOption[]>([])
const loadingCaps = ref(true)
const selectedCap = ref<number | null>(null)
const campusId    = ref<number | null>(null)
const modalityTypeId = ref<number | null>(null)

const filterOptions = ref<{ campuses: any[]; modality_types: any[] }>({ campuses: [], modality_types: [] })
const rows = ref<GeneralRow[]>([])
const distribution = ref<Record<string, number>>({})
const totalDocentes = ref(0)
const promedioGlobal = ref<number | null>(null)
const loading = ref(false)
const error = ref('')

const hasPeriod = computed(() => selectedCap.value !== null)
const AREAS = ['a','b','c','d','e','f','g','h','i','j'] as const

const drawer = ref({ open: false })
function openReport() { drawer.value.open = true }
const reportParams = computed(() => ({
    cap: selectedCap.value,
    modality_type_id: modalityTypeId.value ?? undefined,
    campus_id: campusId.value ?? undefined,
}))

async function loadCaps() {
    loadingCaps.value = true
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.collegeAcademicPeriods.list, { params: { per_page: 50, order_by: 'id', order_dir: 'desc' } })
        caPeriods.value = Array.isArray(data?.items) ? data.items : []
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudieron cargar los periodos.'
    } finally { loadingCaps.value = false }
}

async function loadFilters() {
    if (selectedCap.value === null) { filterOptions.value = { campuses: [], modality_types: [] }; return }
    try {
        const { data } = await api.get(API.EVD_API.admin.resultsFilters(selectedCap.value))
        filterOptions.value = { campuses: data?.campuses ?? [], modality_types: data?.modality_types ?? [] }
    } catch { filterOptions.value = { campuses: [], modality_types: [] } }
}

async function loadData() {
    if (selectedCap.value === null) { rows.value = []; return }
    loading.value = true; error.value = ''
    try {
        const params: Record<string, number> = {}
        if (campusId.value !== null) params.campus_id = campusId.value
        if (modalityTypeId.value !== null) params.modality_type_id = modalityTypeId.value
        const { data } = await api.get(API.EVD_API.admin.general(selectedCap.value), { params })
        rows.value = Array.isArray(data?.rows) ? data.rows : []
        distribution.value = data?.distribution ?? {}
        totalDocentes.value = data?.total_docentes ?? 0
        promedioGlobal.value = data?.promedio_global ?? null
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudo cargar el concentrado.'
        rows.value = []
    } finally { loading.value = false }
}

async function onPeriodChange() {
    campusId.value = null; modalityTypeId.value = null
    await loadFilters()
    await loadData()
}
watch([campusId, modalityTypeId], loadData)

function levelBadge(nivel: string | null): string {
    switch (nivel) {
        case 'EXCELENTE':    return 'bg-emerald-100 text-emerald-700'
        case 'NOTABLE':      return 'bg-emerald-50 text-emerald-600'
        case 'BUENO':        return 'bg-blue-50 text-blue-600'
        case 'SUFICIENTE':   return 'bg-amber-50 text-amber-700'
        case 'INSUFICIENTE': return 'bg-rose-50 text-rose-700'
        default:             return 'bg-slate-100 text-slate-500'
    }
}
function cellClass(v: number | null): string {
    if (v === null) return 'text-slate-300'
    if (v < 4.25) return 'text-rose-600 font-semibold'
    return 'text-slate-700'
}

onMounted(loadCaps)
</script>

<template>
    <div class="space-y-4">
        <div class="flex items-start justify-between gap-3 flex-wrap">
            <div>
                <h1 class="text-xl font-semibold text-slate-800 uppercase">Concentrado General</h1>
                <p class="text-xs text-slate-500 mt-0.5">Todos los docentes por modalidad y ubicación (en vivo). Escala Likert 1–5.</p>
            </div>
            <button :disabled="!hasPeriod" class="px-4 py-2 text-sm rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 shrink-0" @click="openReport">
                Reporte PDF
            </button>
        </div>

        <div v-if="error" class="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded px-3 py-2">{{ error }}</div>

        <!-- Filtros -->
        <div class="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-end gap-3">
            <EvdPeriodSelect v-model="selectedCap" :periods="caPeriods" :disabled="loadingCaps" label="Periodo *" @change="onPeriodChange" />
            <div class="flex flex-col gap-1 min-w-[170px]">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Ubicación</label>
                <select v-model.number="campusId" :disabled="!hasPeriod" class="border border-slate-300 rounded px-2 py-1.5 text-sm disabled:bg-slate-50">
                    <option :value="null">Todas</option>
                    <option v-for="c in filterOptions.campuses" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
            </div>
            <div class="flex flex-col gap-1 min-w-[170px]">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tipo de modalidad</label>
                <select v-model.number="modalityTypeId" :disabled="!hasPeriod" class="border border-slate-300 rounded px-2 py-1.5 text-sm disabled:bg-slate-50">
                    <option :value="null">Todas</option>
                    <option v-for="m in filterOptions.modality_types" :key="m.id" :value="m.id">{{ m.name }}</option>
                </select>
            </div>
        </div>

        <!-- Indicadores -->
        <div v-if="hasPeriod && rows.length" class="flex flex-wrap gap-2 text-xs">
            <span class="px-3 py-1.5 rounded-lg bg-white border">Docentes: <b>{{ totalDocentes }}</b></span>
            <span class="px-3 py-1.5 rounded-lg bg-white border">Promedio global: <b>{{ promedioGlobal ?? '—' }}</b></span>
            <span v-for="(n, lvl) in distribution" :key="lvl" class="px-3 py-1.5 rounded-lg" :class="levelBadge(lvl as string)">
                {{ lvl }}: <b>{{ n }}</b>
            </span>
        </div>

        <!-- Tabla -->
        <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div class="overflow-x-auto w-full"><table class="w-full text-sm">
                <thead class="bg-slate-50 text-slate-600 text-[10px] uppercase tracking-wider">
                    <tr>
                        <th class="text-left px-3 py-2 w-10">#</th>
                        <th class="text-left px-3 py-2">DOCENTE</th>
                        <th v-for="a in AREAS" :key="a" class="text-center px-2 py-2 w-12">{{ a.toUpperCase() }}</th>
                        <th class="text-center px-2 py-2 w-16">PROM</th>
                        <th class="text-left px-3 py-2 w-28">NIVEL</th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    <tr v-if="loading"><td colspan="14" class="px-4 py-6 text-center text-slate-400">Cargando…</td></tr>
                    <tr v-else-if="!rows.length"><td colspan="14" class="px-4 py-6 text-center text-slate-400 italic">No hay resultados para los filtros seleccionados.</td></tr>
                    <tr v-for="(r, idx) in rows" :key="r.teacher_id" class="hover:bg-slate-50">
                        <td class="px-3 py-2 text-slate-400 tabular-nums">{{ idx + 1 }}</td>
                        <td class="px-3 py-2 font-semibold text-slate-700 uppercase">{{ r.docente }}</td>
                        <td v-for="a in AREAS" :key="a" class="px-2 py-2 text-center tabular-nums" :class="cellClass(r[a])">{{ r[a] !== null ? r[a]!.toFixed(2) : '—' }}</td>
                        <td class="px-2 py-2 text-center font-bold tabular-nums" :class="cellClass(r.promedio)">{{ r.promedio !== null ? r.promedio.toFixed(2) : '—' }}</td>
                        <td class="px-3 py-2">
                            <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase" :class="levelBadge(r.nivel)">{{ r.nivel ?? '—' }}</span>
                        </td>
                    </tr>
                </tbody>
            </table></div>
        </div>

        <EvdReportDrawer
            :open="drawer.open"
            :report-code="ReportCode.TEACHER_EVALUATION_GENERAL"
            :params="reportParams"
            title="Reporte general por modalidad y ubicación"
            filename="evaluacion-general"
            @close="drawer.open = false"
        />
    </div>
</template>
