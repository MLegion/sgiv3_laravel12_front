<template>
    <div class="space-y-4">
        <h1 class="text-xl font-semibold text-slate-800 uppercase">Intercambiar Materias entre Docentes</h1>

        <!-- Periodo -->
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
                        <select v-model="careerId" @change="onCareerChange" :disabled="!resolvedModalityId" class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 outline-none uppercase">
                            <option :value="null">-- TODAS --</option>
                            <option v-for="c in careers" :key="c.id" :value="c.id">{{ c.name }}</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Loading -->
            <div v-if="loading" class="flex justify-center py-12">
                <div class="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>

            <div v-else-if="configError" class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                <p class="text-sm text-amber-700 font-semibold uppercase">{{ configError }}</p>
            </div>

            <!-- Paneles de intercambio -->
            <div v-else-if="configId" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <!-- Panel Docente A -->
                <div class="bg-white border-2 rounded-xl shadow-sm overflow-hidden" :class="selectedA ? 'border-blue-400' : 'border-slate-200'">
                    <div class="bg-blue-50 border-b px-4 py-3">
                        <label class="block text-[10px] font-black text-blue-700 uppercase mb-1.5">Docente A</label>
                        <select v-model="teacherAId" @change="selectedA = null" class="w-full border rounded-lg px-3 py-2 text-sm font-bold uppercase">
                            <option :value="null">-- Seleccionar docente --</option>
                            <option v-for="t in teachers" :key="t.id" :value="t.id" :disabled="t.id === teacherBId">{{ t.name }}</option>
                        </select>
                    </div>
                    <div v-if="teacherAId" class="divide-y max-h-[50vh] overflow-y-auto">
                        <div v-for="a in assignmentsOf(teacherAId)" :key="a.id"
                            class="px-4 py-3 cursor-pointer transition"
                            :class="selectedA === a.id ? 'bg-blue-100 border-l-4 border-blue-500' : 'hover:bg-slate-50'"
                            @click="selectedA = a.id">
                            <div class="text-sm font-bold text-slate-800 uppercase">{{ a.subjectName }}</div>
                            <div class="text-[10px] text-slate-400">{{ a.subjectCode }} &middot; Grupo: {{ a.groupName }}</div>
                        </div>
                        <div v-if="assignmentsOf(teacherAId).length === 0" class="px-4 py-6 text-center text-xs text-slate-400">Sin asignaciones</div>
                    </div>
                </div>

                <!-- Panel Docente B -->
                <div class="bg-white border-2 rounded-xl shadow-sm overflow-hidden" :class="selectedB ? 'border-purple-400' : 'border-slate-200'">
                    <div class="bg-purple-50 border-b px-4 py-3">
                        <label class="block text-[10px] font-black text-purple-700 uppercase mb-1.5">Docente B</label>
                        <select v-model="teacherBId" @change="selectedB = null" class="w-full border rounded-lg px-3 py-2 text-sm font-bold uppercase">
                            <option :value="null">-- Seleccionar docente --</option>
                            <option v-for="t in teachers" :key="t.id" :value="t.id" :disabled="t.id === teacherAId">{{ t.name }}</option>
                        </select>
                    </div>
                    <div v-if="teacherBId" class="divide-y max-h-[50vh] overflow-y-auto">
                        <div v-for="a in assignmentsOf(teacherBId)" :key="a.id"
                            class="px-4 py-3 cursor-pointer transition"
                            :class="selectedB === a.id ? 'bg-purple-100 border-l-4 border-purple-500' : 'hover:bg-slate-50'"
                            @click="selectedB = a.id">
                            <div class="text-sm font-bold text-slate-800 uppercase">{{ a.subjectName }}</div>
                            <div class="text-[10px] text-slate-400">{{ a.subjectCode }} &middot; Grupo: {{ a.groupName }}</div>
                        </div>
                        <div v-if="assignmentsOf(teacherBId).length === 0" class="px-4 py-6 text-center text-xs text-slate-400">Sin asignaciones</div>
                    </div>
                </div>
            </div>

            <!-- Botón intercambiar -->
            <div v-if="selectedA && selectedB" class="flex justify-center">
                <button
                    class="px-8 py-3 text-sm font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 uppercase disabled:opacity-40 flex items-center gap-2"
                    :disabled="swapping"
                    @click="doSwap">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
                    {{ swapping ? 'Intercambiando...' : 'Intercambiar Materias' }}
                </button>
            </div>

            <p v-if="actionError" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{{ actionError }}</p>
            <p v-if="actionSuccess" class="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-4 py-2">{{ actionSuccess }}</p>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import PeriodSelector from '@/app/components/ui/form/PeriodSelector.vue'

/* ── Period ─────────────────────────────────────────────────────── */
const selectedPeriodId = ref<number|null>(null); const periodSelectorRef = ref<any>(null)
const periodLocked = ref(false); const lockedPeriodName = ref(''); const STORAGE_KEY = 'sca_period'
function savePeriodToStorage() { localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: selectedPeriodId.value, name: lockedPeriodName.value })) }
function clearPeriodStorage() { localStorage.removeItem(STORAGE_KEY) }
function restorePeriodFromStorage() { try { const r = localStorage.getItem(STORAGE_KEY); if (!r) return; const s = JSON.parse(r); if (s?.id) { selectedPeriodId.value = s.id; lockedPeriodName.value = s.name ?? ''; periodLocked.value = true } } catch {} }
function toggleLock() { if (!periodLocked.value) { if (!selectedPeriodId.value) return; lockedPeriodName.value = periodSelectorRef.value?.selectedPeriod?.name ?? 'SIN PERIODO'; periodLocked.value = true; savePeriodToStorage() } else { periodLocked.value = false; clearPeriodStorage(); resetAll() } }
function onPeriodChange() { resetFilters() }

/* ── Context + Filters ──────────────────────────────────────────── */
interface ScaContext { isAdmin: boolean; careerIds: number[]|null; modalityIds: number[]|null; campusIds: number[]|null; modalityTypeIds: number[]|null }
const ctx = ref<ScaContext|null>(null)
const campusId = ref<number|null>(null); const modalityTypeId = ref<number|null>(null); const careerId = ref<number|null>(null)
const allCampuses = ref<any[]>([]); const allModalityTypes = ref<any[]>([]); const allModalities = ref<any[]>([]); const careers = ref<any[]>([])
const configId = ref<number|null>(null); const configError = ref<string|null>(null); const loading = ref(false)

const filteredCampuses = computed(() => { if (!ctx.value || ctx.value.isAdmin || !ctx.value.campusIds) return allCampuses.value; return allCampuses.value.filter(c => ctx.value!.campusIds!.includes(c.id)) })
const filteredModalityTypes = computed(() => { let t = allModalityTypes.value; if (ctx.value && !ctx.value.isAdmin && ctx.value.modalityTypeIds) t = t.filter(mt => ctx.value!.modalityTypeIds!.includes(mt.id)); if (campusId.value) { const ids = allModalities.value.filter((m:any) => (m.campusId ?? m.campus_id) === campusId.value).map((m:any) => m.modalityTypeId ?? m.modality_type_id); t = t.filter(mt => ids.includes(mt.id)) } return t })
const resolvedModalityId = computed(() => { if (!campusId.value || !modalityTypeId.value) return null; return allModalities.value.find((m:any) => (m.campusId ?? m.campus_id) === campusId.value && (m.modalityTypeId ?? m.modality_type_id) === modalityTypeId.value)?.id ?? null })

/* ── Swap state ─────────────────────────────────────────────────── */
const assignments = ref<any[]>([]); const teachers = ref<any[]>([])
const teacherAId = ref<number|null>(null); const teacherBId = ref<number|null>(null)
const selectedA = ref<number|null>(null); const selectedB = ref<number|null>(null)
const swapping = ref(false); const actionError = ref<string|null>(null); const actionSuccess = ref<string|null>(null)

function assignmentsOf(teacherId: number) { return assignments.value.filter(a => a.teacherId === teacherId) }

/* ── Cascading ──────────────────────────────────────────────────── */
function onCampusChange() { modalityTypeId.value = null; careerId.value = null; careers.value = []; resetData() }
function onModalityTypeChange() { careerId.value = null; careers.value = []; resetData(); if (resolvedModalityId.value) { fetchCareers(); resolveConfig() } }
function onCareerChange() { resetData(); if (configId.value) fetchAssigned() }
function resetFilters() { campusId.value = null; modalityTypeId.value = null; careerId.value = null; careers.value = []; resetData() }
function resetAll() { resetFilters() }
function resetData() { assignments.value = []; teachers.value = []; teacherAId.value = null; teacherBId.value = null; selectedA.value = null; selectedB.value = null; configId.value = null; configError.value = null; actionError.value = null; actionSuccess.value = null }

/* ── Fetch ──────────────────────────────────────────────────────── */
async function fetchContext() { try { const { data } = await api.get(API.SCA_API.myContext); ctx.value = data } catch { ctx.value = { isAdmin: false, careerIds: [], modalityIds: [], campusIds: [], modalityTypeIds: [] } } }
async function fetchCampuses() { try { const { data } = await api.get(API.SCHOOL_SERVICES_API.campuses.list, { params: { per_page: 100, status: 1 } }); allCampuses.value = (data?.items ?? data?.data ?? data ?? []).map((c:any) => ({ id: c.id, name: c.name ?? c.shortName })) } catch { allCampuses.value = [] } }
async function fetchModalityTypes() { try { const { data } = await api.get(API.SUPERADMIN_API.modalityTypes.list, { params: { per_page: 100 } }); allModalityTypes.value = (data?.items ?? data?.data ?? data ?? []).map((mt:any) => ({ id: mt.id, name: mt.name })) } catch { allModalityTypes.value = [] } }
async function fetchModalities() { try { const { data } = await api.get(API.SCHOOL_SERVICES_API.modalities.list, { params: { per_page: 200 } }); allModalities.value = data?.items ?? data?.data ?? data ?? [] } catch { allModalities.value = [] } }
async function fetchCareers() {
    if (!resolvedModalityId.value) return
    try { const { data } = await api.get(API.SCHOOL_SERVICES_API.academicOffers.list, { params: { per_page: 200, search: { modality_id: resolvedModalityId.value } } })
        const offers = data?.items ?? data?.data ?? data ?? []; const seen = new Set<number>()
        let c = offers.map((o:any) => ({ id: o.id, careerId: o.careerId ?? o.career_id, name: o.career?.name ?? `Carrera #${o.careerId ?? o.career_id}` })).filter((x:any) => { if (seen.has(x.careerId)) return false; seen.add(x.careerId); return true })
        if (!ctx.value?.isAdmin && ctx.value?.careerIds) c = c.filter((x:any) => ctx.value!.careerIds!.includes(x.careerId))
        careers.value = c
    } catch { careers.value = [] }
}

async function resolveConfig() {
    configId.value = null; configError.value = null
    if (!selectedPeriodId.value || !resolvedModalityId.value) return
    try { const { data } = await api.get(API.SCA_API.academicLoadConfigs.list, { params: { per_page: 1, search: { college_academic_period_id: selectedPeriodId.value, modality_id: resolvedModalityId.value } } })
        const items = data?.items ?? data?.data ?? []
        if (items.length === 0) { configError.value = 'No hay configuración de carga.'; return }
        configId.value = items[0].id
        fetchAssigned()
    } catch { configError.value = 'Error al buscar configuración.' }
}

async function fetchAssigned() {
    if (!configId.value) return
    loading.value = true
    try { const { data } = await api.get(API.SCA_API.teacherAssignments.assigned(configId.value)); assignments.value = Array.isArray(data) ? data : []
        const seen = new Map<number, string>()
        for (const a of assignments.value) { if (!seen.has(a.teacherId)) seen.set(a.teacherId, a.teacherName) }
        teachers.value = Array.from(seen.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
    } catch { assignments.value = []; teachers.value = [] }
    finally { loading.value = false }
}

async function doSwap(force = false) {
    if (!selectedA.value || !selectedB.value) return
    swapping.value = true; actionError.value = null; actionSuccess.value = null
    try {
        const { data } = await api.post(API.SCA_API.teacherAssignments.swap, {
            assignment_id_a: selectedA.value, assignment_id_b: selectedB.value, force,
        })
        const removed = data?.removedSchedules ?? 0
        actionSuccess.value = (data?.message ?? 'Materias intercambiadas.') + (removed > 0 ? ` Se eliminaron ${removed} horario(s) en conflicto.` : '')
        selectedA.value = null; selectedB.value = null
        await fetchAssigned()
        setTimeout(() => { actionSuccess.value = null }, 5000)
    } catch (e: any) {
        const errors = e?.response?.data?.errors
        if (errors?.conflicts && errors?._conflictDetails) {
            const count = (errors._conflictDetails as any[]).length
            const msg = `El intercambio provocaría ${count} choque(s) de horario.\n\nLos horarios en conflicto serán eliminados para reasignación posterior.\n\n¿Desea continuar?`
            if (confirm(msg)) {
                await doSwap(true)
                return
            }
            swapping.value = false
            return
        }
        actionError.value = e?.response?.data?.message ?? errors?.assignment?.[0] ?? 'Error al intercambiar.'
    } finally { swapping.value = false }
}

onMounted(() => { fetchContext(); restorePeriodFromStorage(); fetchCampuses(); fetchModalityTypes(); fetchModalities() })
</script>
