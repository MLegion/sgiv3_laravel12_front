<template>
    <div class="space-y-4">
        <h1 class="text-xl font-semibold text-slate-800 uppercase">Asignar Docente a Vacante</h1>

        <!-- Periodo (compartido, auto-restaura) -->
        <div class="flex items-center gap-3">
            <PeriodSelector v-if="!periodLocked" ref="periodSelectorRef" v-model="selectedPeriodId" @update:model-value="onPeriodChange" label="" placeholder="SELECCIONE UN PERIODO" class="flex-1" />
            <div v-else class="flex-1 border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold uppercase bg-slate-50 text-slate-700">{{ lockedPeriodName }}</div>
            <button class="w-12 h-[46px] border-2 rounded-xl flex items-center justify-center transition"
                :class="periodLocked ? 'border-slate-300 bg-slate-50 text-slate-500 hover:bg-slate-100' : 'border-blue-500 bg-blue-50 text-blue-600 hover:bg-blue-100'"
                :disabled="!selectedPeriodId && !periodLocked" @click="toggleLock" :title="periodLocked ? 'Desbloquear' : 'Bloquear'">
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

            <!-- Cargando -->
            <div v-if="loadingVacancies" class="flex justify-center py-12">
                <div class="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>

            <!-- Sin config -->
            <div v-else-if="configError" class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                <p class="text-sm text-amber-700 font-semibold uppercase">{{ configError }}</p>
            </div>

            <!-- Vacantes -->
            <div v-else-if="configId && vacancies.length > 0" class="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div class="bg-red-50 border-b px-4 py-3 flex items-center justify-between">
                    <h2 class="text-sm font-bold text-red-800 uppercase">Vacantes ({{ vacancies.length }})</h2>
                </div>

                <div class="hidden lg:grid grid-cols-[1fr_80px_100px_1fr_140px] gap-2 px-4 py-2 bg-slate-100 border-b text-[10px] font-black text-slate-500 uppercase">
                    <span>Materia</span>
                    <span class="text-center">Créditos</span>
                    <span>Grupo</span>
                    <span>Asignar a</span>
                    <span class="text-center">Acción</span>
                </div>

                <div class="divide-y max-h-[60vh] overflow-y-auto">
                    <div v-for="v in vacancies" :key="v.id" class="px-4 py-3 hover:bg-slate-50 transition">
                        <div class="grid grid-cols-1 lg:grid-cols-[1fr_80px_100px_1fr_140px] gap-2 items-center">
                            <div>
                                <div class="text-sm font-bold text-slate-800 uppercase">{{ v.subjectName }}</div>
                                <div class="text-[10px] text-slate-400 font-semibold">{{ v.subjectCode }} &middot; {{ v.subjectShort }}</div>
                            </div>
                            <div class="text-center text-sm font-bold text-slate-600">{{ v.credits ?? '—' }}</div>
                            <div class="text-sm font-bold text-slate-600">{{ v.groupName }}</div>
                            <div>
                                <select v-model="selectedTeachers[v.id]"
                                    class="w-full border rounded-lg px-2 py-1.5 text-xs uppercase">
                                    <option :value="undefined">-- Seleccionar docente --</option>
                                    <option v-for="t in realTeachers" :key="t.id" :value="t.id">{{ t.name }}</option>
                                </select>
                            </div>
                            <div class="flex justify-center">
                                <button
                                    class="px-3 py-1.5 text-[10px] font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 uppercase disabled:opacity-40"
                                    :disabled="!selectedTeachers[v.id] || reassigning === v.id"
                                    @click="reassign(v.id)"
                                >
                                    {{ reassigning === v.id ? 'Asignando...' : 'Asignar' }}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Sin vacantes -->
            <div v-else-if="configId && !loadingVacancies" class="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                <svg class="w-10 h-10 mx-auto text-green-400 mb-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                <p class="text-sm font-bold text-green-700 uppercase">No hay vacantes para esta configuración</p>
            </div>

            <p v-if="actionError" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{{ actionError }}</p>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import PeriodSelector from '@/app/components/ui/form/PeriodSelector.vue'

/* ── Period (compartido SCA) ───────────────────────────────────── */
const selectedPeriodId   = ref<number | null>(null)
const periodSelectorRef  = ref<InstanceType<typeof PeriodSelector> | null>(null)
const periodLocked       = ref(false)
const lockedPeriodName   = ref('')
const STORAGE_KEY        = 'sca_period'

function savePeriodToStorage() { localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: selectedPeriodId.value, name: lockedPeriodName.value })) }
function clearPeriodStorage() { localStorage.removeItem(STORAGE_KEY) }
function restorePeriodFromStorage() {
    try { const r = localStorage.getItem(STORAGE_KEY); if (!r) return; const s = JSON.parse(r); if (s?.id) { selectedPeriodId.value = s.id; lockedPeriodName.value = s.name ?? ''; periodLocked.value = true } } catch {}
}
function toggleLock() {
    if (!periodLocked.value) { if (!selectedPeriodId.value) return; lockedPeriodName.value = periodSelectorRef.value?.selectedPeriod?.name ?? 'SIN PERIODO'; periodLocked.value = true; savePeriodToStorage() }
    else { periodLocked.value = false; clearPeriodStorage(); resetAll() }
}
function onPeriodChange() { resetFilters() }

/* ── Contexto + Filtros ────────────────────────────────────────── */
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

/* ── Vacantes ──────────────────────────────────────────────────── */
const vacancies        = ref<any[]>([])
const loadingVacancies = ref(false)
const realTeachers     = ref<any[]>([])
const selectedTeachers = reactive<Record<number, number | undefined>>({})
const reassigning      = ref<number | null>(null)
const actionError      = ref<string | null>(null)

/* ── Cascading ─────────────────────────────────────────────────── */
function onCampusChange() { modalityTypeId.value = null; careerId.value = null; careers.value = []; resetData() }
function onModalityTypeChange() { careerId.value = null; careers.value = []; resetData(); if (resolvedModalityId.value) { fetchCareers(); resolveConfig() } }
function onCareerChange() { resetData(); if (configId.value) fetchVacancies() }
function resetFilters() { campusId.value = null; modalityTypeId.value = null; careerId.value = null; careers.value = []; resetData() }
function resetAll() { resetFilters() }
function resetData() { vacancies.value = []; configId.value = null; configError.value = null; actionError.value = null; Object.keys(selectedTeachers).forEach(k => delete selectedTeachers[Number(k)]) }

/* ── Fetch ─────────────────────────────────────────────────────── */
async function fetchContext() {
    try { const { data } = await api.get(API.SCA_API.myContext); ctx.value = data }
    catch { ctx.value = { isAdmin: false, careerIds: [], modalityIds: [], campusIds: [], modalityTypeIds: [] } }
}
async function fetchCampuses() {
    try { const { data } = await api.get(API.SCHOOL_SERVICES_API.campuses.list, { params: { per_page: 100 } }); allCampuses.value = (data?.items ?? data?.data ?? data ?? []).map((c: any) => ({ id: c.id, name: c.name ?? c.shortName })) } catch { allCampuses.value = [] }
}
async function fetchModalityTypes() {
    try { const { data } = await api.get(API.SUPERADMIN_API.modalityTypes.list, { params: { per_page: 100 } }); allModalityTypes.value = (data?.items ?? data?.data ?? data ?? []).map((mt: any) => ({ id: mt.id, name: mt.name })) } catch { allModalityTypes.value = [] }
}
async function fetchModalities() {
    try { const { data } = await api.get(API.SCHOOL_SERVICES_API.modalities.list, { params: { per_page: 200 } }); allModalities.value = data?.items ?? data?.data ?? data ?? [] } catch { allModalities.value = [] }
}
async function fetchCareers() {
    if (!resolvedModalityId.value) return
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.academicOffers.list, { params: { per_page: 200, search: { modality_id: resolvedModalityId.value } } })
        const offers = data?.items ?? data?.data ?? data ?? []
        const seen = new Set<number>()
        let c = offers.map((o: any) => ({ id: o.id, careerId: o.careerId ?? o.career_id, name: o.career?.name ?? `Carrera #${o.careerId ?? o.career_id}` }))
            .filter((x: any) => { if (seen.has(x.careerId)) return false; seen.add(x.careerId); return true })
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
        fetchVacancies()
        fetchTeachers()
    } catch { configError.value = 'Error al buscar configuración.' }
}

async function fetchVacancies() {
    if (!configId.value) return
    loadingVacancies.value = true
    try {
        const { data } = await api.get(API.SCA_API.teacherAssignments.vacancies(configId.value))
        vacancies.value = Array.isArray(data) ? data : []
    } catch { vacancies.value = [] }
    finally { loadingVacancies.value = false }
}

async function reassign(assignmentId: number, force = false) {
    const teacherId = selectedTeachers[assignmentId]
    if (!teacherId) return
    actionError.value = null
    reassigning.value = assignmentId
    try {
        const { data } = await api.put(API.SCA_API.teacherAssignments.reassign(assignmentId), { teacher_id: teacherId, force })
        const removed = data?.removedSchedules ?? 0
        if (removed > 0) alert(`Docente asignado. Se eliminaron ${removed} horario(s) en conflicto para reasignación.`)
        delete selectedTeachers[assignmentId]
        await fetchVacancies()
    } catch (e: any) {
        const errors = e?.response?.data?.errors
        if (errors?.conflicts && errors?._conflictDetails) {
            const count = (errors._conflictDetails as any[]).length
            if (confirm(`La asignación provocaría ${count} choque(s) de horario.\n\nLos horarios en conflicto serán eliminados para reasignación.\n\n¿Desea continuar?`)) {
                await reassign(assignmentId, true)
                return
            }
            reassigning.value = null
            return
        }
        actionError.value = e?.response?.data?.message ?? 'Error al asignar docente.'
    } finally {
        reassigning.value = null
    }
}

onMounted(() => {
    fetchContext()
    restorePeriodFromStorage()
    fetchCampuses()
    fetchModalityTypes()
    fetchModalities()
})
</script>
