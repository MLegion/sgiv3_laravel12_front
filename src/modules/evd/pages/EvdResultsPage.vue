<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type {
    EvdLevel,
    EvdResultsFilterOptions,
    EvdTeacherResultRow,
} from '@/modules/evd/types/evd.type'

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

function periodOptionLabel(p: CollegeAcademicPeriodOption): string {
    const name  = p.academicPeriod?.name      ?? ''
    const short = p.academicPeriod?.shortName ?? ''
    if (name && short) return `${name} (${short})`
    return name || short || `Periodo #${p.id}`
}

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
            campus_id:     campusId.value ?? undefined,
            modality_type: modalityTypeId.value ?? undefined,
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
        <div>
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Resultados de Evaluación</h1>
            <p class="text-xs text-slate-500 mt-0.5">
                Promedio general en escala Likert (1–5). Selecciona un periodo y, si lo deseas,
                segmenta por campus, modalidad o carrera.
            </p>
        </div>

        <div v-if="error" class="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded px-3 py-2">{{ error }}</div>

        <!-- Filtros -->
        <div class="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-end gap-3">
            <div class="flex flex-col gap-1 min-w-[240px]">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Periodo *</label>
                <select v-model.number="selectedCap" :disabled="loadingCaps" @change="onPeriodChange"
                        class="border border-slate-300 rounded px-2 py-1.5 text-sm">
                    <option :value="null" disabled>Selecciona un periodo…</option>
                    <option v-for="p in caPeriods" :key="p.id" :value="p.id">
                        {{ periodOptionLabel(p) }}
                    </option>
                </select>
            </div>
            <div class="flex flex-col gap-1 min-w-[170px]">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Campus</label>
                <select v-model.number="campusId" :disabled="!hasPeriod"
                        class="border border-slate-300 rounded px-2 py-1.5 text-sm disabled:bg-slate-50">
                    <option :value="null">Todos</option>
                    <option v-for="c in filterOptions.campuses" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
            </div>
            <div class="flex flex-col gap-1 min-w-[170px]">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tipo de modalidad</label>
                <select v-model.number="modalityTypeId" :disabled="!hasPeriod"
                        class="border border-slate-300 rounded px-2 py-1.5 text-sm disabled:bg-slate-50">
                    <option :value="null">Todas</option>
                    <option v-for="m in filterOptions.modality_types" :key="m.id" :value="m.id">{{ m.name }}</option>
                </select>
            </div>
            <div class="flex flex-col gap-1 min-w-[190px]">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Carrera</label>
                <select v-model.number="careerId" :disabled="!hasPeriod"
                        class="border border-slate-300 rounded px-2 py-1.5 text-sm disabled:bg-slate-50">
                    <option :value="null">Todas</option>
                    <option v-for="c in filterOptions.careers" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
            </div>
            <div class="flex flex-col gap-1 flex-1 min-w-[200px]">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Buscar docente</label>
                <input v-model="search" :disabled="!hasPeriod" type="text" placeholder="Nombre o ID"
                       class="border border-slate-300 rounded px-2 py-1.5 text-sm disabled:bg-slate-50" />
            </div>
        </div>

        <!-- Sin periodo -->
        <div v-if="!hasPeriod"
             class="bg-white border border-dashed border-slate-300 rounded-lg px-4 py-12 text-center">
            <p class="text-sm text-slate-500">Selecciona un periodo para ver los resultados.</p>
        </div>

        <!-- Tabla -->
        <div v-else class="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <table class="w-full text-sm">
                <thead class="bg-slate-50 text-slate-600 text-[10px] uppercase tracking-wider">
                    <tr>
                        <th scope="col" class="text-left px-4 py-2">DOCENTE</th>
                        <th scope="col" class="text-right px-4 py-2 w-24">ÁREAS</th>
                        <th scope="col" class="text-right px-4 py-2 w-28">RESPUESTAS</th>
                        <th scope="col" class="text-right px-4 py-2 w-28">PROMEDIO</th>
                        <th scope="col" class="text-left px-4 py-2 w-32">NIVEL</th>
                        <th scope="col" class="text-right px-4 py-2 w-20"></th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    <tr v-if="loading"><td colspan="6" class="px-4 py-6 text-center text-sm text-slate-400">Cargando…</td></tr>
                    <tr v-else-if="!rows.length">
                        <td colspan="6" class="px-4 py-6 text-center text-sm text-slate-400 italic">
                            No hay resultados para los filtros seleccionados.
                        </td>
                    </tr>
                    <tr v-for="r in rows" :key="r.teacher.id" class="hover:bg-slate-50">
                        <td class="px-4 py-2">
                            <div class="font-bold text-slate-700 uppercase">{{ r.teacher.name }}</div>
                            <div class="text-[10px] font-mono text-slate-400">{{ r.teacher.custom_id ?? '—' }}</div>
                        </td>
                        <td class="px-4 py-2 text-right text-xs text-slate-600 tabular-nums">{{ r.areas_count }}</td>
                        <td class="px-4 py-2 text-right text-xs text-slate-600 tabular-nums">{{ r.total_responses }}</td>
                        <td class="px-4 py-2 text-right tabular-nums" :class="avgClass(r.overall_avg)">
                            {{ r.overall_avg !== null ? r.overall_avg.toFixed(2) : '—' }}
                        </td>
                        <td class="px-4 py-2">
                            <span v-if="r.overall_avg !== null"
                                  class="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                                  :class="avgClass(r.overall_avg) + ' bg-slate-50'">
                                {{ levelFromAvg(r.overall_avg) }}
                            </span>
                        </td>
                        <td class="px-4 py-2 text-right">
                            <button class="text-blue-600 hover:underline text-sm" @click="goToTeacher(r)">
                                Detalle →
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
