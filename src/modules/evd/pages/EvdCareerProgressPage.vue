<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

interface CapOption { id: number; academicPeriod?: { name?: string | null; shortName?: string | null } | null }
interface Career { id: number; name: string; short_name: string | null }
interface GroupRow {
    teacher_assignment_id: number
    subject: { id: number; name: string; official_code: string | null }
    group: { id: number; name: string | null; shift: string | null }
    teacher: { id: number; name: string | null } | null
    career: { id: number; name: string; short_name: string | null }
    campus: { id: number; name: string } | null
    modality_type: { id: number; name: string } | null
    total_assignments: number
    completed_assignments: number
    pending_assignments: number
    progress_pct: number
}
interface Summary { total: number; completed: number; pending: number; progress_pct: number; groups_count: number }
interface StudentRow {
    assignment_id: number
    student_id: number
    num_control: string | null
    name: string
    status: string
    started_at: string | null
    completed_at: string | null
}

const caps        = ref<CapOption[]>([])
const selectedCap = ref<number | null>(null)
const loadingCaps = ref(true)

const careers     = ref<Career[]>([])
const summary     = ref<Summary>({ total: 0, completed: 0, pending: 0, progress_pct: 0, groups_count: 0 })
const groups      = ref<GroupRow[]>([])
const careerFilter = ref<number | null>(null)   // null = todas
const search      = ref('')
const loading     = ref(false)
const error       = ref('')
const noActivePeriod = ref(false)   // no hay EVD abierta → vista informativa

// detalle de estudiantes por asignación (lazy, cacheado)
const expanded   = reactive<Record<number, boolean>>({})
const students   = reactive<Record<number, StudentRow[]>>({})
const loadingStudents = reactive<Record<number, boolean>>({})

const periodLabel = (c: CapOption) => c.academicPeriod?.shortName ?? c.academicPeriod?.name ?? `Periodo ${c.id}`

async function loadCaps() {
    loadingCaps.value = true
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.collegeAcademicPeriods.list, {
            params: { per_page: 50, order_by: 'id', order_dir: 'desc' },
        })
        caps.value = Array.isArray(data?.items) ? data.items : []
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudieron cargar los periodos.'
    } finally {
        loadingCaps.value = false
    }
}

/**
 * Selección por defecto: el periodo de EVD ACTIVO (TEP abierto). Si no hay
 * activo, cae al CAP más reciente y se marca noActivePeriod para la vista.
 */
async function resolveDefaultCap() {
    try {
        const { data } = await api.get(API.EVD_API.admin.activeEvdCap)
        if (data?.has_active && data?.cap_id) {
            noActivePeriod.value = false
            selectedCap.value = Number(data.cap_id)
            return
        }
    } catch { /* sin permiso o error → fallback */ }
    noActivePeriod.value = true
    selectedCap.value = caps.value.length ? caps.value[0].id : null
}

async function load() {
    if (selectedCap.value === null) return
    loading.value = true
    error.value = ''
    try {
        const params: Record<string, string> = {}
        if (careerFilter.value !== null) params.career_id = String(careerFilter.value)
        if (search.value.trim() !== '') params.search = search.value.trim()
        const { data } = await api.get(API.EVD_API.admin.myCareerProgress(selectedCap.value), { params })
        careers.value = Array.isArray(data?.careers) ? data.careers : []
        summary.value = data?.summary ?? summary.value
        groups.value  = Array.isArray(data?.groups) ? data.groups : []
        // reset detalle al recargar
        for (const k of Object.keys(expanded)) delete expanded[Number(k)]
        for (const k of Object.keys(students)) delete students[Number(k)]
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudo cargar el avance.'
    } finally {
        loading.value = false
    }
}

async function toggleGroup(g: GroupRow) {
    const id = g.teacher_assignment_id
    expanded[id] = !expanded[id]
    if (expanded[id] && students[id] === undefined) {
        loadingStudents[id] = true
        try {
            const { data } = await api.get(API.EVD_API.admin.assignmentStudents(id))
            students[id] = Array.isArray(data?.students) ? data.students : []
        } catch {
            students[id] = []
        } finally {
            loadingStudents[id] = false
        }
    }
}

function barColor(pct: number): string {
    if (pct >= 80) return 'bg-emerald-500'
    if (pct >= 50) return 'bg-amber-500'
    return 'bg-rose-500'
}

function statusBadge(status: string): { label: string; cls: string } {
    switch (status) {
        case 'completed':   return { label: 'Completó',    cls: 'bg-emerald-100 text-emerald-700' }
        case 'in_progress': return { label: 'En progreso', cls: 'bg-amber-100 text-amber-700' }
        case 'no_show':     return { label: 'No presentó',  cls: 'bg-rose-100 text-rose-700' }
        default:            return { label: 'Pendiente',    cls: 'bg-slate-100 text-slate-600' }
    }
}

watch(selectedCap, load)
watch(careerFilter, load)
onMounted(async () => {
    await loadCaps()
    await resolveDefaultCap()   // dispara load() vía watch(selectedCap)
})
</script>

<template>
    <div class="space-y-4 max-w-6xl">
        <div class="flex items-center justify-between flex-wrap gap-3">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Avance de Evaluación Docente · Por Grupos</h1>
            <select v-model.number="selectedCap" :disabled="loadingCaps"
                    class="border border-slate-300 rounded px-2 py-1.5 text-sm">
                <option v-for="c in caps" :key="c.id" :value="c.id">{{ periodLabel(c) }}</option>
            </select>
        </div>

        <!-- Aviso: no hay evaluación docente activa -->
        <div v-if="noActivePeriod" class="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-3 flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0 mt-0.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
            </svg>
            <div>
                <span class="font-semibold">No hay evaluación docente activa en este momento.</span>
                Se muestra el periodo más reciente; puedes elegir otro periodo en el selector de arriba para consultar su avance histórico.
            </div>
        </div>

        <!-- Filtro de carrera (solo si tiene más de una) -->
        <div v-if="careers.length > 1" class="flex flex-wrap items-center gap-2">
            <span class="text-xs text-slate-500">Carrera:</span>
            <button type="button"
                class="text-xs px-2.5 py-1 rounded-full border"
                :class="careerFilter === null ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'"
                @click="careerFilter = null">
                Todas
            </button>
            <button v-for="c in careers" :key="c.id" type="button"
                class="text-xs px-2.5 py-1 rounded-full border"
                :class="careerFilter === c.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'"
                @click="careerFilter = c.id">
                {{ c.short_name ?? c.name }}
            </button>
        </div>

        <!-- Resumen -->
        <div class="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-6 flex-wrap">
            <div>
                <div class="text-3xl font-bold tabular-nums text-slate-800">{{ summary.progress_pct }}%</div>
                <div class="text-[10px] uppercase text-slate-500">completado</div>
            </div>
            <div class="flex-1 min-w-[200px]">
                <div class="h-3 bg-slate-100 rounded overflow-hidden">
                    <div class="h-full transition-all" :class="barColor(summary.progress_pct)" :style="{ width: summary.progress_pct + '%' }"></div>
                </div>
                <div class="text-xs text-slate-500 mt-1">
                    <span class="font-semibold text-emerald-600">{{ summary.completed }}</span> completadas ·
                    <span class="font-semibold text-rose-600">{{ summary.pending }}</span> pendientes ·
                    {{ summary.total }} totales · {{ summary.groups_count }} grupos
                </div>
            </div>
            <input v-model="search" @keyup.enter="load" type="text" placeholder="Buscar materia, grupo o docente…"
                   class="border border-slate-300 rounded px-2 py-1.5 text-sm w-64" />
        </div>

        <div v-if="error" class="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded px-3 py-2">{{ error }}</div>
        <div v-if="loading" class="text-center text-sm text-slate-400 py-8">Cargando…</div>

        <div v-else-if="groups.length === 0" class="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-sm text-slate-500">
            No hay grupos con evaluación docente para este periodo y carrera.
        </div>

        <!-- Grupos -->
        <ul v-else class="space-y-2">
            <li v-for="g in groups" :key="g.teacher_assignment_id" class="bg-white border border-slate-200 rounded-lg">
                <button type="button" class="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-slate-50"
                        @click="toggleGroup(g)">
                    <span class="text-xs text-slate-400">{{ expanded[g.teacher_assignment_id] ? '▾' : '▸' }}</span>
                    <div class="min-w-0 flex-1">
                        <div class="font-semibold text-slate-800 truncate">{{ g.subject.name }}</div>
                        <div class="text-xs text-slate-500">
                            <span class="font-mono">{{ g.subject.official_code ?? '—' }}</span>
                            <span class="mx-1.5">·</span>Grupo {{ g.group.name ?? '—' }}
                            <span class="mx-1.5">·</span>{{ g.teacher?.name ?? '— sin docente —' }}
                            <template v-if="careers.length > 1"><span class="mx-1.5">·</span>{{ g.career.short_name ?? g.career.name }}</template>
                            <template v-if="g.modality_type"><span class="mx-1.5">·</span>{{ g.modality_type.name }}</template>
                        </div>
                    </div>
                    <div class="text-right shrink-0 w-40">
                        <div class="flex items-center gap-2 justify-end">
                            <div class="h-2 w-20 bg-slate-100 rounded overflow-hidden">
                                <div class="h-full" :class="barColor(g.progress_pct)" :style="{ width: g.progress_pct + '%' }"></div>
                            </div>
                            <span class="text-sm font-bold tabular-nums text-slate-700">{{ g.progress_pct }}%</span>
                        </div>
                        <div class="text-[10px] text-slate-500">{{ g.completed_assignments }}/{{ g.total_assignments }} · {{ g.pending_assignments }} faltan</div>
                    </div>
                </button>

                <!-- Lista de estudiantes -->
                <div v-if="expanded[g.teacher_assignment_id]" class="border-t border-slate-100 px-4 py-3">
                    <div v-if="loadingStudents[g.teacher_assignment_id]" class="text-xs text-slate-400 italic">Cargando estudiantes…</div>
                    <div v-else-if="(students[g.teacher_assignment_id] ?? []).length === 0" class="text-xs text-slate-500 italic">
                        Sin estudiantes en esta materia.
                    </div>
                    <table v-else class="w-full text-sm">
                        <thead class="text-[10px] uppercase tracking-wider text-slate-400 border-b">
                            <tr>
                                <th class="text-left py-1.5 w-28">N° Control</th>
                                <th class="text-left py-1.5">Estudiante</th>
                                <th class="text-left py-1.5 w-32">Estado</th>
                                <th class="text-left py-1.5 w-36">Fecha</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-50">
                            <tr v-for="s in students[g.teacher_assignment_id]" :key="s.assignment_id">
                                <td class="py-1.5 font-mono text-xs text-slate-500">{{ s.num_control ?? '—' }}</td>
                                <td class="py-1.5 text-slate-700">{{ s.name }}</td>
                                <td class="py-1.5">
                                    <span class="text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5"
                                          :class="statusBadge(s.status).cls">
                                        {{ statusBadge(s.status).label }}
                                    </span>
                                </td>
                                <td class="py-1.5 text-xs text-slate-500">{{ s.completed_at ?? '—' }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </li>
        </ul>
    </div>
</template>
