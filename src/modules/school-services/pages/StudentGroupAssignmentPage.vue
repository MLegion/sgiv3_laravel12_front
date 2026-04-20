<template>
    <div class="space-y-4">
        <div>
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Asignación de Grupos</h1>
            <p class="text-sm text-slate-500 mt-1">
                Asigna los estudiantes de nuevo ingreso a los grupos de su primer semestre.
            </p>
        </div>

        <!-- Filtros de cohorte -->
        <div class="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Periodo</label>
                <select v-model="filters.collegeAcademicPeriodId" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    <option :value="null">-- Selecciona --</option>
                    <option v-for="p in periods" :key="p.id" :value="p.id">
                        {{ p.academicPeriod?.name || p.academic_period?.name || `Periodo ${p.id}` }}
                    </option>
                </select>
            </div>
            <div>
                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Plan de Estudio</label>
                <select v-model="filters.studyPlanId" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    <option :value="null">-- Selecciona --</option>
                    <option v-for="sp in studyPlans" :key="sp.id" :value="sp.id">{{ sp.name }}</option>
                </select>
            </div>
            <div>
                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Modalidad</label>
                <select v-model="filters.modalityId" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    <option :value="null">-- Selecciona --</option>
                    <option v-for="m in modalities" :key="m.id" :value="m.id">
                        {{ (m.campus?.name ?? '') + ' — ' + (m.modalityType?.name ?? '') }}
                    </option>
                </select>
            </div>
            <div>
                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Semestre</label>
                <select v-model.number="filters.semester" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    <option v-for="n in 9" :key="n" :value="n">{{ n }}</option>
                </select>
            </div>
            <div class="flex items-end">
                <button
                    :disabled="!canLoad || loading"
                    class="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
                    @click="loadCohort"
                >{{ loading ? 'Cargando...' : 'Cargar Cohorte' }}</button>
            </div>
        </div>

        <div v-if="banner.message" class="text-sm px-4 py-3 rounded-lg border"
            :class="banner.ok ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'">
            {{ banner.message }}
        </div>

        <!-- Contenido principal cuando hay cohorte cargada -->
        <div v-if="cohortLoaded" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <!-- Estudiantes pendientes -->
            <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div class="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div>
                        <h2 class="text-sm font-black text-slate-600 uppercase tracking-widest">Estudiantes Pendientes</h2>
                        <p class="text-xs text-slate-500 mt-0.5">{{ students.length }} total · {{ selectedIds.length }} seleccionados</p>
                    </div>
                    <label class="inline-flex items-center gap-2 text-xs text-slate-600">
                        <input type="checkbox" v-model="onlyUnassigned" @change="loadCohort" class="rounded border-slate-300" />
                        Solo sin asignar
                    </label>
                </div>
                <div class="max-h-[560px] overflow-y-auto">
                    <table class="w-full text-sm">
                        <thead class="bg-slate-50 text-slate-500 sticky top-0">
                            <tr>
                                <th class="px-3 py-2 text-left w-8">
                                    <input type="checkbox" :checked="allSelected" @change="toggleAllSelection" class="rounded border-slate-300" />
                                </th>
                                <th class="px-3 py-2 text-left text-[10px] font-black uppercase tracking-widest">No. CONTROL</th>
                                <th class="px-3 py-2 text-left text-[10px] font-black uppercase tracking-widest">NOMBRE</th>
                                <th class="px-3 py-2 text-center text-[10px] font-black uppercase tracking-widest">GRUPOS</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="s in students" :key="s.id"
                                class="border-t border-slate-100 hover:bg-slate-50/60"
                                :class="{ 'bg-indigo-50/40': selectedIds.includes(s.id) }">
                                <td class="px-3 py-2">
                                    <input type="checkbox" :value="s.id" v-model="selectedIds" class="rounded border-slate-300" />
                                </td>
                                <td class="px-3 py-2 font-mono text-xs">{{ s.num_control || '—' }}</td>
                                <td class="px-3 py-2">{{ s.full_name }}</td>
                                <td class="px-3 py-2 text-center">
                                    <span class="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase rounded-full"
                                        :class="s.assigned_groups_count > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'">
                                        {{ s.assigned_groups_count }}
                                    </span>
                                </td>
                            </tr>
                            <tr v-if="!students.length">
                                <td colspan="4" class="px-3 py-8 text-center text-sm text-slate-400 italic">
                                    Sin estudiantes pendientes para esta cohorte.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Grupos disponibles -->
            <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div class="px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <h2 class="text-sm font-black text-slate-600 uppercase tracking-widest">Grupos de la Cohorte</h2>
                    <p class="text-xs text-slate-500 mt-0.5">Semestre {{ filters.semester }} · {{ groups.length }} grupos</p>
                </div>

                <!-- Aviso cuando la carga no está finalizada -->
                <div v-if="!loadState.finalized" class="m-3 p-3 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-800">
                    <p class="font-semibold">
                        <template v-if="!loadState.exists">No hay carga académica configurada</template>
                        <template v-else>La carga académica aún no está finalizada</template>
                    </p>
                    <p class="text-xs mt-1 text-amber-700">
                        <template v-if="!loadState.exists">
                            Aún no se ha creado una configuración de carga académica para esta combinación de periodo y modalidad.
                        </template>
                        <template v-else>
                            Los horarios deben estar publicados (última fase de carga académica) antes de asignar estudiantes a los grupos.
                        </template>
                    </p>
                </div>

                <div v-else class="max-h-[560px] overflow-y-auto p-3 space-y-3">
                    <div v-for="g in groups" :key="g.id"
                        class="border border-slate-200 rounded-xl p-3 hover:shadow-sm transition"
                        :class="{ 'opacity-60': g.is_full }"
                    >
                        <div class="flex items-center justify-between gap-2">
                            <div class="min-w-0">
                                <div class="flex items-center gap-2">
                                    <h3 class="font-bold text-slate-800 text-base">{{ g.name }}</h3>
                                    <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">T: {{ g.shift }}</span>
                                </div>
                                <p class="text-[11px] text-slate-500 mt-0.5">
                                    {{ g.subjects.length }} materias
                                </p>
                            </div>
                            <div class="text-right flex-shrink-0">
                                <div class="text-sm font-bold" :class="occColor(g)">
                                    {{ g.occupancy }} / {{ g.capacity }}
                                </div>
                                <p class="text-[10px] text-slate-400">{{ g.available }} disponibles</p>
                            </div>
                        </div>
                        <!-- barra de progreso -->
                        <div class="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div class="h-full transition-all"
                                :class="barColor(g)"
                                :style="{ width: percent(g) + '%' }"></div>
                        </div>

                        <div class="mt-3 flex items-center justify-between gap-2 flex-wrap">
                            <button
                                type="button"
                                class="text-[11px] font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
                                @click="toggleGroupDetails(g.id)"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                                    class="w-3.5 h-3.5 transition-transform"
                                    :class="{ 'rotate-180': expandedGroupId === g.id }">
                                    <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
                                </svg>
                                {{ expandedGroupId === g.id ? 'Ocultar estudiantes' : 'Ver estudiantes asignados' }}
                            </button>
                            <button
                                :disabled="!selectedIds.length || g.is_full || assigning === g.id"
                                class="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                                @click="assignSelection(g)"
                            >
                                {{ assigning === g.id ? 'Asignando...' : `Asignar ${selectedIds.length || 0} aquí` }}
                            </button>
                        </div>

                        <!-- Lista expandible de estudiantes en este grupo -->
                        <div v-if="expandedGroupId === g.id" class="mt-3 pt-3 border-t border-slate-100">
                            <div v-if="loadingStudentsOfGroup" class="text-xs text-slate-400 italic py-2">Cargando...</div>
                            <div v-else-if="!groupStudents[g.id]?.length" class="text-xs text-slate-400 italic py-2">
                                Aún no hay estudiantes asignados a este grupo.
                            </div>
                            <ul v-else class="space-y-1">
                                <li
                                    v-for="s in groupStudents[g.id]"
                                    :key="s.id"
                                    class="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50"
                                >
                                    <div class="min-w-0 flex-1">
                                        <div class="flex items-center gap-2">
                                            <span class="text-xs font-mono text-slate-400">{{ s.num_control || '—' }}</span>
                                            <span class="text-sm text-slate-700 truncate">{{ s.full_name }}</span>
                                        </div>
                                        <span
                                            class="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded mt-0.5 inline-block"
                                            :class="s.source === 'INSCRIPCION' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-700'"
                                        >{{ s.source }}</span>
                                    </div>
                                    <button
                                        :disabled="removingStudentId === s.id"
                                        class="p-1 rounded-md text-red-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 transition"
                                        title="Quitar estudiante del grupo"
                                        @click="removeFromGroup(g, s)"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                                            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                                        </svg>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div v-if="!groups.length" class="text-center text-sm text-slate-400 italic py-8">
                        No hay grupos creados para esta cohorte.
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

interface Student {
    id: number
    num_control: string | null
    full_name: string
    email: string | null
    assigned_groups_count: number
}

interface CohortGroup {
    id: number
    name: string
    capacity: number
    occupancy: number
    available: number
    shift: string
    is_full: boolean
    subjects: { id: number, name: string, short_name: string | null }[]
}

const periods = ref<any[]>([])
const studyPlans = ref<any[]>([])
const modalities = ref<any[]>([])

const filters = reactive({
    collegeAcademicPeriodId: null as number | null,
    studyPlanId:             null as number | null,
    modalityId:              null as number | null,
    semester:                1,
})

const onlyUnassigned = ref(true)
const students = ref<Student[]>([])
const groups = ref<CohortGroup[]>([])
const selectedIds = ref<number[]>([])
const cohortLoaded = ref(false)
const loading = ref(false)
const assigning = ref<number | null>(null)
const banner = reactive({ ok: false, message: '' })

const expandedGroupId = ref<number | null>(null)
const groupStudents = reactive<Record<number, Array<{ id: number, num_control: string | null, full_name: string, source: string }>>>({})
const loadingStudentsOfGroup = ref(false)
const removingStudentId = ref<number | null>(null)

const loadState = reactive({ exists: false, finalized: false })

const canLoad = computed(() =>
    !!filters.collegeAcademicPeriodId && !!filters.studyPlanId && !!filters.modalityId
)

const allSelected = computed(() =>
    students.value.length > 0 && selectedIds.value.length === students.value.length
)

onMounted(async () => {
    const [pRes, spRes, mRes] = await Promise.all([
        api.get(API.SCHOOL_SERVICES_API.collegeAcademicPeriods.list, { params: { per_page: 100 } }).catch(() => ({ data: { items: [] } })),
        api.get(API.SUPERADMIN_API.studyPlans.list, { params: { per_page: 200 } }).catch(() => ({ data: { items: [] } })),
        api.get(API.SCHOOL_SERVICES_API.modalities.list, { params: { per_page: 100 } }).catch(() => ({ data: { items: [] } })),
    ])
    periods.value    = pRes.data.items ?? pRes.data.data ?? []
    studyPlans.value = spRes.data.items ?? spRes.data.data ?? []
    modalities.value = mRes.data.items ?? mRes.data.data ?? []
})

async function loadCohort() {
    if (!canLoad.value) return
    loading.value = true
    banner.message = ''
    try {
        const period = periods.value.find(p => p.id === filters.collegeAcademicPeriodId)
        const entryPeriodId = period?.academicPeriod?.id || period?.academic_period?.id || period?.academic_period_id
        if (!entryPeriodId) throw new Error('No se pudo resolver el periodo académico base.')

        const [pending, cohort] = await Promise.all([
            api.get(API.SCHOOL_SERVICES_API.studentGroups.pendingStudents, {
                params: {
                    entry_period_id:  entryPeriodId,
                    study_plan_id:    filters.studyPlanId,
                    modality_id:      filters.modalityId,
                    only_unassigned:  onlyUnassigned.value,
                },
            }),
            api.get(API.SCHOOL_SERVICES_API.studentGroups.cohortGroups, {
                params: {
                    college_academic_period_id: filters.collegeAcademicPeriodId,
                    study_plan_id:              filters.studyPlanId,
                    modality_id:                filters.modalityId,
                    semester:                   filters.semester,
                },
            }),
        ])

        students.value = pending.data.items ?? []
        groups.value   = cohort.data.items ?? []
        loadState.exists    = !!cohort.data.load_exists
        loadState.finalized = !!cohort.data.load_finalized
        selectedIds.value = []
        cohortLoaded.value = true
    } catch (e: any) {
        banner.ok = false
        banner.message = e.response?.data?.message || e.message || 'No se pudo cargar la cohorte.'
        cohortLoaded.value = false
    } finally {
        loading.value = false
    }
}

function toggleAllSelection() {
    selectedIds.value = allSelected.value ? [] : students.value.map(s => s.id)
}

async function assignSelection(g: CohortGroup) {
    if (!selectedIds.value.length) return
    assigning.value = g.id
    banner.message = ''
    try {
        const { data } = await api.post(API.SCHOOL_SERVICES_API.studentGroups.bulkAssign, {
            student_ids: selectedIds.value,
            group_id:    g.id,
            source:      'INSCRIPCION',
        })
        banner.ok = true
        const parts = [`${data.assigned} asignados al grupo ${g.name}`]
        if (data.failed > 0) parts.push(`${data.failed} fallaron (revisa capacidad / modalidad)`)
        banner.message = parts.join(' · ')
        await loadCohort()
    } catch (e: any) {
        banner.ok = false
        banner.message = e.response?.data?.message || 'No se pudo asignar.'
    } finally {
        assigning.value = null
    }
}

async function toggleGroupDetails(groupId: number) {
    if (expandedGroupId.value === groupId) {
        expandedGroupId.value = null
        return
    }
    expandedGroupId.value = groupId
    await loadStudentsOfGroup(groupId)
}

async function loadStudentsOfGroup(groupId: number) {
    loadingStudentsOfGroup.value = true
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.studentGroups.studentsInGroup(groupId))
        groupStudents[groupId] = data.items ?? []
    } catch {
        groupStudents[groupId] = []
    } finally {
        loadingStudentsOfGroup.value = false
    }
}

async function removeFromGroup(g: CohortGroup, s: { id: number, full_name: string }) {
    if (!confirm(`¿Quitar a "${s.full_name}" del grupo ${g.name}?`)) return
    removingStudentId.value = s.id
    banner.message = ''
    try {
        await api.delete(API.SCHOOL_SERVICES_API.studentGroups.remove, {
            data: { student_id: s.id, group_id: g.id },
        })
        banner.ok = true
        banner.message = `"${s.full_name}" fue removido del grupo ${g.name}.`
        await Promise.all([loadStudentsOfGroup(g.id), loadCohort()])
    } catch (e: any) {
        banner.ok = false
        banner.message = e.response?.data?.message || 'No se pudo quitar al estudiante.'
    } finally {
        removingStudentId.value = null
    }
}

function percent(g: CohortGroup): number {
    if (!g.capacity) return 0
    return Math.min(100, Math.round((g.occupancy / g.capacity) * 100))
}

function occColor(g: CohortGroup): string {
    const p = percent(g)
    if (g.is_full) return 'text-red-600'
    if (p >= 85)   return 'text-amber-600'
    return 'text-emerald-600'
}

function barColor(g: CohortGroup): string {
    const p = percent(g)
    if (g.is_full) return 'bg-red-500'
    if (p >= 85)   return 'bg-amber-500'
    return 'bg-emerald-500'
}
</script>
