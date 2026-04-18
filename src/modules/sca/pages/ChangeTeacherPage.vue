<template>
    <div class="space-y-4">
        <h1 class="text-xl font-semibold text-slate-800 uppercase">Cambiar Docente de Asignatura</h1>

        <!-- Periodo compartido -->
        <div class="flex items-center gap-3">
            <PeriodSelector v-if="!periodLocked" ref="periodSelectorRef" v-model="selectedPeriodId" @update:model-value="onPeriodChange" label="" placeholder="SELECCIONE UN PERIODO" class="flex-1" />
            <div v-else class="flex-1 border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold uppercase bg-slate-50 text-slate-700">{{ lockedPeriodName }}</div>
            <button class="w-12 h-[46px] border-2 rounded-xl flex items-center justify-center transition"
                :class="periodLocked ? 'border-slate-300 bg-slate-50 text-slate-500 hover:bg-slate-100' : 'border-blue-500 bg-blue-50 text-blue-600 hover:bg-blue-100'"
                :disabled="!selectedPeriodId && !periodLocked" @click="toggleLock">
                <svg v-if="periodLocked" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg>
                <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z"/></svg>
            </button>
        </div>

        <template v-if="periodLocked">
            <!-- Filtros -->
            <div class="bg-white border rounded-xl shadow-sm p-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Campus</label>
                        <select v-model="campusId" @change="onCampusChange" class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 outline-none uppercase">
                            <option :value="null">-- SELECCIONAR --</option>
                            <option v-for="c in filteredCampuses" :key="c.id" :value="c.id">{{ c.name }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Tipo Modalidad</label>
                        <select v-model="modalityTypeId" @change="onModalityTypeChange" class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 outline-none uppercase">
                            <option :value="null">-- SELECCIONAR --</option>
                            <option v-for="mt in filteredModalityTypes" :key="mt.id" :value="mt.id">{{ mt.name }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Carrera</label>
                        <select v-model="careerId" @change="onCareerChange" :disabled="!resolvedModalityId"
                            class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 outline-none uppercase">
                            <option :value="null">-- TODAS --</option>
                            <option v-for="c in careers" :key="c.id" :value="c.id">{{ c.name }}</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Loading -->
            <div v-if="loadingAssigned" class="flex justify-center py-12">
                <div class="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>

            <!-- Config error -->
            <div v-else-if="configError" class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                <p class="text-sm text-amber-700 font-semibold uppercase">{{ configError }}</p>
            </div>

            <!-- Tabla de asignaciones -->
            <div v-else-if="configId && assignments.length > 0" class="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div class="bg-blue-50 border-b px-4 py-3 flex items-center justify-between">
                    <h2 class="text-sm font-bold text-blue-800 uppercase">Asignaciones ({{ assignments.length }})</h2>
                    <div class="relative w-56">
                        <input v-model="searchQuery" type="text" placeholder="Buscar materia o docente..."
                            class="w-full border rounded-lg pl-8 pr-3 py-1.5 text-xs focus:border-blue-500 outline-none" />
                        <svg class="w-4 h-4 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    </div>
                </div>

                <div class="hidden lg:grid grid-cols-[1fr_80px_100px_1fr_1fr_140px] gap-2 px-4 py-2 bg-slate-100 border-b text-[10px] font-black text-slate-500 uppercase">
                    <span>Materia</span>
                    <span class="text-center">Créditos</span>
                    <span>Grupo</span>
                    <span>Docente Actual</span>
                    <span>Nuevo Docente</span>
                    <span class="text-center">Acción</span>
                </div>

                <div class="divide-y max-h-[60vh] overflow-y-auto">
                    <div v-for="a in filteredAssignments" :key="a.id" class="px-4 py-3 hover:bg-slate-50 transition">
                        <div class="grid grid-cols-1 lg:grid-cols-[1fr_80px_100px_1fr_1fr_140px] gap-2 items-center">
                            <div>
                                <div class="text-sm font-bold text-slate-800 uppercase">{{ a.subjectName }}</div>
                                <div class="text-[10px] text-slate-400 font-semibold">{{ a.subjectCode }}</div>
                            </div>
                            <div class="text-center text-sm font-bold text-slate-600">{{ a.credits ?? '—' }}</div>
                            <div class="text-sm font-bold text-slate-600">{{ a.groupName }}</div>
                            <div class="text-sm text-slate-700 font-semibold uppercase">{{ a.teacherName }}</div>
                            <div>
                                <select v-model="selectedTeachers[a.id]" class="w-full border rounded-lg px-2 py-1.5 text-xs uppercase">
                                    <option :value="undefined">-- Seleccionar --</option>
                                    <option v-for="t in realTeachers.filter(t => t.id !== a.teacherId)" :key="t.id" :value="t.id">{{ t.name }}</option>
                                </select>
                            </div>
                            <div class="flex justify-center">
                                <button
                                    class="px-3 py-1.5 text-[10px] font-bold rounded-lg bg-amber-600 text-white hover:bg-amber-700 uppercase disabled:opacity-40"
                                    :disabled="!selectedTeachers[a.id] || changing === a.id"
                                    @click="changeTeacher(a.id)"
                                >
                                    {{ changing === a.id ? 'Cambiando...' : 'Cambiar' }}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Sin asignaciones -->
            <div v-else-if="configId && !loadingAssigned" class="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
                <p class="text-sm text-slate-500 font-bold uppercase">No hay asignaciones con docente para esta configuración</p>
            </div>

            <p v-if="actionError" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{{ actionError }}</p>
            <p v-if="actionSuccess" class="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-4 py-2">{{ actionSuccess }}</p>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import PeriodSelector from '@/app/components/ui/form/PeriodSelector.vue'

/* ── Period ─────────────────────────────────────────────────────── */
const selectedPeriodId   = ref<number | null>(null)
const periodSelectorRef  = ref<InstanceType<typeof PeriodSelector> | null>(null)
const periodLocked       = ref(false)
const lockedPeriodName   = ref('')
const STORAGE_KEY        = 'sca_period'

function savePeriodToStorage() { localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: selectedPeriodId.value, name: lockedPeriodName.value })) }
function clearPeriodStorage() { localStorage.removeItem(STORAGE_KEY) }
function restorePeriodFromStorage() { try { const r = localStorage.getItem(STORAGE_KEY); if (!r) return; const s = JSON.parse(r); if (s?.id) { selectedPeriodId.value = s.id; lockedPeriodName.value = s.name ?? ''; periodLocked.value = true } } catch {} }
function toggleLock() {
    if (!periodLocked.value) { if (!selectedPeriodId.value) return; lockedPeriodName.value = periodSelectorRef.value?.selectedPeriod?.name ?? 'SIN PERIODO'; periodLocked.value = true; savePeriodToStorage() }
    else { periodLocked.value = false; clearPeriodStorage(); resetAll() }
}
function onPeriodChange() { resetFilters() }

/* ── Context + Filters ──────────────────────────────────────────── */
interface ScaContext { isAdmin: boolean; careerIds: number[]|null; modalityIds: number[]|null; campusIds: number[]|null; modalityTypeIds: number[]|null }
const ctx = ref<ScaContext | null>(null)
const campusId       = ref<number | null>(null)
const modalityTypeId = ref<number | null>(null)
const careerId       = ref<number | null>(null)
const allCampuses      = ref<any[]>([])
const allModalityTypes = ref<any[]>([])
const allModalities    = ref<any[]>([])
const careers          = ref<any[]>([])
const configId      = ref<number | null>(null)
const configError   = ref<string | null>(null)

const filteredCampuses = computed(() => {
    if (!ctx.value) return allCampuses.value
    if (ctx.value.isAdmin || !ctx.value.campusIds) return allCampuses.value
    return allCampuses.value.filter(c => ctx.value!.campusIds!.includes(c.id))
})
const filteredModalityTypes = computed(() => {
    let types = allModalityTypes.value
    if (ctx.value && !ctx.value.isAdmin && ctx.value.modalityTypeIds) types = types.filter(mt => ctx.value!.modalityTypeIds!.includes(mt.id))
    if (campusId.value) {
        const t = allModalities.value.filter((m: any) => (m.campusId ?? m.campus_id) === campusId.value).map((m: any) => m.modalityTypeId ?? m.modality_type_id)
        types = types.filter(mt => t.includes(mt.id))
    }
    return types
})
const resolvedModalityId = computed(() => {
    if (!campusId.value || !modalityTypeId.value) return null
    return allModalities.value.find((m: any) => (m.campusId ?? m.campus_id) === campusId.value && (m.modalityTypeId ?? m.modality_type_id) === modalityTypeId.value)?.id ?? null
})

/* ── Data ───────────────────────────────────────────────────────── */
const assignments      = ref<any[]>([])
const loadingAssigned  = ref(false)
const realTeachers     = ref<any[]>([])
const selectedTeachers = reactive<Record<number, number | undefined>>({})
const changing         = ref<number | null>(null)
const actionError      = ref<string | null>(null)
const actionSuccess    = ref<string | null>(null)
const searchQuery      = ref('')

const filteredAssignments = computed(() => {
    if (!searchQuery.value) return assignments.value
    const q = searchQuery.value.toLowerCase()
    return assignments.value.filter((a: any) =>
        (a.subjectName ?? '').toLowerCase().includes(q) ||
        (a.teacherName ?? '').toLowerCase().includes(q) ||
        (a.groupName ?? '').toLowerCase().includes(q)
    )
})

/* ── Cascading ──────────────────────────────────────────────────── */
function onCampusChange() { modalityTypeId.value = null; careerId.value = null; careers.value = []; resetData() }
function onModalityTypeChange() { careerId.value = null; careers.value = []; resetData(); if (resolvedModalityId.value) { fetchCareers(); resolveConfig() } }
function onCareerChange() { resetData(); if (configId.value) fetchAssigned() }
function resetFilters() { campusId.value = null; modalityTypeId.value = null; careerId.value = null; careers.value = []; resetData() }
function resetAll() { resetFilters() }
function resetData() { assignments.value = []; configId.value = null; configError.value = null; actionError.value = null; actionSuccess.value = null; Object.keys(selectedTeachers).forEach(k => delete selectedTeachers[Number(k)]) }

/* ── Fetch ──────────────────────────────────────────────────────── */
async function fetchContext() { try { const { data } = await api.get(API.SCA_API.myContext); ctx.value = data } catch { ctx.value = { isAdmin: false, careerIds: [], modalityIds: [], campusIds: [], modalityTypeIds: [] } } }
async function fetchCampuses() { try { const { data } = await api.get(API.SCHOOL_SERVICES_API.campuses.list, { params: { per_page: 100 } }); allCampuses.value = (data?.items ?? data?.data ?? data ?? []).map((c: any) => ({ id: c.id, name: c.name ?? c.shortName })) } catch { allCampuses.value = [] } }
async function fetchModalityTypes() { try { const { data } = await api.get(API.SUPERADMIN_API.modalityTypes.list, { params: { per_page: 100 } }); allModalityTypes.value = (data?.items ?? data?.data ?? data ?? []).map((mt: any) => ({ id: mt.id, name: mt.name })) } catch { allModalityTypes.value = [] } }
async function fetchModalities() { try { const { data } = await api.get(API.SCHOOL_SERVICES_API.modalities.list, { params: { per_page: 200 } }); allModalities.value = data?.items ?? data?.data ?? data ?? [] } catch { allModalities.value = [] } }
async function fetchCareers() {
    if (!resolvedModalityId.value) return
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.academicOffers.list, { params: { per_page: 200, search: { modality_id: resolvedModalityId.value } } })
        const offers = data?.items ?? data?.data ?? data ?? []
        const seen = new Set<number>()
        let c = offers.map((o: any) => ({ id: o.id, careerId: o.careerId ?? o.career_id, name: o.career?.name ?? `Carrera #${o.careerId ?? o.career_id}` })).filter((x: any) => { if (seen.has(x.careerId)) return false; seen.add(x.careerId); return true })
        if (!ctx.value?.isAdmin && ctx.value?.careerIds) c = c.filter((x: any) => ctx.value!.careerIds!.includes(x.careerId))
        careers.value = c
    } catch { careers.value = [] }
}
async function fetchTeachers() {
    try { const { data } = await api.get(API.SCA_API.teachers.list, { params: { per_page: 500 } }); const items = data?.items ?? data?.data ?? data ?? []; realTeachers.value = items.filter((t: any) => (t.employeeId ?? t.employee_id) !== null).map((t: any) => ({ id: t.id, name: t.employeeName ?? t.employee_name ?? t.name })) } catch { realTeachers.value = [] }
}

async function resolveConfig() {
    configId.value = null; configError.value = null
    if (!selectedPeriodId.value || !resolvedModalityId.value) return
    try {
        const { data } = await api.get(API.SCA_API.academicLoadConfigs.list, { params: { per_page: 1, search: { college_academic_period_id: selectedPeriodId.value, modality_id: resolvedModalityId.value } } })
        const items = data?.items ?? data?.data ?? []
        if (items.length === 0) { configError.value = 'No hay configuración de carga para este periodo y modalidad.'; return }
        configId.value = items[0].id
        fetchAssigned()
        fetchTeachers()
    } catch { configError.value = 'Error al buscar configuración.' }
}

async function fetchAssigned() {
    if (!configId.value) return
    loadingAssigned.value = true
    try {
        const { data } = await api.get(API.SCA_API.teacherAssignments.assigned(configId.value))
        assignments.value = Array.isArray(data) ? data : []
    } catch { assignments.value = [] }
    finally { loadingAssigned.value = false }
}

async function changeTeacher(assignmentId: number) {
    const teacherId = selectedTeachers[assignmentId]
    if (!teacherId) return
    actionError.value = null; actionSuccess.value = null
    changing.value = assignmentId
    try {
        const { data } = await api.put(API.SCA_API.teacherAssignments.changeTeacher(assignmentId), { teacher_id: teacherId })
        actionSuccess.value = data?.message ?? 'Docente cambiado correctamente.'
        delete selectedTeachers[assignmentId]
        await fetchAssigned()
        setTimeout(() => { actionSuccess.value = null }, 3000)
    } catch (e: any) {
        actionError.value = e?.response?.data?.message ?? 'Error al cambiar docente.'
    } finally {
        changing.value = null
    }
}

onMounted(() => { fetchContext(); restorePeriodFromStorage(); fetchCampuses(); fetchModalityTypes(); fetchModalities() })
</script>
