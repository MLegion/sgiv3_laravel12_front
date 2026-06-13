<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { EvdSubjectProgressRow } from '@/modules/evd/types/evd.type'

interface CollegeAcademicPeriodOption {
    id: number
    academicPeriod?: { name?: string | null; shortName?: string | null } | null
}

// El backend autoriza por `evd.assignment.toggle-visibility` (solo EVD_MANAGER).
// El frontend asume editable y baja el flag a `false` ante el primer 403, para
// dejar los switches en lectura sin necesidad de duplicar la matriz de roles.
const canToggle   = ref(true)

const caPeriods   = ref<CollegeAcademicPeriodOption[]>([])
const selectedCap = ref<number | null>(null)
const rows        = ref<EvdSubjectProgressRow[]>([])
const loading     = ref(false)
const loadingCaps = ref(true)
const error       = ref('')
const okMsg       = ref('')
const search      = ref('')
const togglingId  = ref<number | null>(null)

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
        const { data } = await api.get(API.EVD_API.admin.subjectsProgress(selectedCap.value), { params })
        rows.value = Array.isArray(data?.data) ? data.data : []
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudo cargar el avance por materia.'
    } finally {
        loading.value = false
    }
}

async function toggleVisibility(row: EvdSubjectProgressRow, field: 'visible_for_students' | 'visible_in_consolidated_report') {
    if (!canToggle.value) return
    togglingId.value = row.teacher_assignment_id
    error.value = ''
    okMsg.value = ''
    const original = row[field]
    const next = !original
    row[field] = next
    try {
        await api.patch(API.EVD_API.admin.toggleVisibility(row.teacher_assignment_id), { [field]: next })
        okMsg.value = next
            ? (field === 'visible_for_students'
                ? 'Materia visible para los alumnos.'
                : 'Materia incluida en el reporte conjunto.')
            : (field === 'visible_for_students'
                ? 'Materia oculta para los alumnos.'
                : 'Materia excluida del reporte conjunto.')
        setTimeout(() => okMsg.value = '', 3000)
    } catch (e: any) {
        row[field] = original
        if (e?.response?.status === 403) {
            canToggle.value = false
            error.value = 'No tienes permiso para modificar visibilidad. Esta acción está reservada al Encargado de Evaluación Docente.'
        } else {
            error.value = e?.response?.data?.message ?? 'No se pudo actualizar la visibilidad.'
        }
    } finally {
        togglingId.value = null
    }
}

function periodOptionLabel(p: CollegeAcademicPeriodOption): string {
    const name  = p.academicPeriod?.name      ?? ''
    const short = p.academicPeriod?.shortName ?? ''
    if (name && short) return `${name} (${short})`
    return name || short || `Periodo #${p.id}`
}

watch([selectedCap], () => { loadRows() })
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
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Avance por Grupos · EVD</h1>
            <span v-if="!canToggle"
                  class="text-[10px] text-slate-400 italic">
                (modo lectura · solo el Encargado de Evaluación Docente edita visibilidad)
            </span>
        </div>

        <div v-if="error" class="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded px-3 py-2">{{ error }}</div>
        <div v-if="okMsg" class="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded px-3 py-2">{{ okMsg }}</div>

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
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Buscar (materia / código / docente)</label>
                <input v-model="search" type="text" placeholder="Empieza a escribir…"
                       class="border border-slate-300 rounded px-2 py-1.5 text-sm" />
            </div>
        </div>

        <!-- Tabla -->
        <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <table class="w-full text-sm">
                <thead class="bg-slate-50 text-slate-600 text-[10px] uppercase tracking-wider">
                    <tr>
                        <th scope="col" class="text-left  px-3 py-2">MATERIA</th>
                        <th scope="col" class="text-left  px-3 py-2 w-28">GRUPO</th>
                        <th scope="col" class="text-left  px-3 py-2">DOCENTE</th>
                        <th scope="col" class="text-left  px-3 py-2 w-32">MODALIDAD</th>
                        <th scope="col" class="text-right px-3 py-2 w-36">AVANCE</th>
                        <th scope="col" class="text-center px-3 py-2 w-32">VISIBLE<br/>ALUMNOS</th>
                        <th scope="col" class="text-center px-3 py-2 w-32">EN REPORTE<br/>CONJUNTO</th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    <tr v-if="loading">
                        <td colspan="7" class="px-3 py-6 text-center text-sm text-slate-400">Cargando…</td>
                    </tr>
                    <tr v-else-if="!rows.length">
                        <td colspan="7" class="px-3 py-6 text-center text-sm text-slate-400 italic">
                            No hay assignments en este periodo.
                        </td>
                    </tr>
                    <tr v-for="r in rows" :key="r.teacher_assignment_id" class="hover:bg-slate-50">
                        <td class="px-3 py-2">
                            <div class="font-bold text-slate-700 uppercase">{{ r.subject.name }}</div>
                            <div class="text-[10px] font-mono text-slate-400">{{ r.subject.official_code ?? '—' }}</div>
                        </td>
                        <td class="px-3 py-2 font-mono text-xs text-slate-700">
                            {{ r.group.name ?? '—' }}
                            <span v-if="r.group.shift" class="text-[10px] text-slate-400 ml-1">{{ r.group.shift }}</span>
                        </td>
                        <td class="px-3 py-2 text-xs text-slate-600">{{ r.teacher?.name ?? '— por asignar —' }}</td>
                        <td class="px-3 py-2 text-xs uppercase text-slate-500">{{ r.modality?.name ?? '—' }}</td>
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
                        <td class="px-3 py-2 text-center">
                            <label class="inline-flex items-center cursor-pointer"
                                   :class="{ 'cursor-not-allowed opacity-60': !canToggle || togglingId === r.teacher_assignment_id }">
                                <input type="checkbox"
                                       :checked="r.visible_for_students"
                                       :disabled="!canToggle || togglingId === r.teacher_assignment_id"
                                       class="w-4 h-4 accent-blue-600"
                                       @change="toggleVisibility(r, 'visible_for_students')" />
                            </label>
                        </td>
                        <td class="px-3 py-2 text-center">
                            <label class="inline-flex items-center cursor-pointer"
                                   :class="{ 'cursor-not-allowed opacity-60': !canToggle || togglingId === r.teacher_assignment_id }">
                                <input type="checkbox"
                                       :checked="r.visible_in_consolidated_report"
                                       :disabled="!canToggle || togglingId === r.teacher_assignment_id"
                                       class="w-4 h-4 accent-emerald-600"
                                       @change="toggleVisibility(r, 'visible_in_consolidated_report')" />
                            </label>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
