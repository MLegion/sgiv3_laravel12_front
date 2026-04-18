<template>
    <div class="space-y-4">
        <h1 class="text-xl font-semibold text-slate-800 uppercase">Apertura Tardía</h1>

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

            <!-- CAREER_MANAGER: crear solicitud -->
            <div v-if="!isAdmin" class="bg-white border rounded-xl shadow-sm p-5 space-y-4">
                <h2 class="text-sm font-bold text-slate-700 uppercase">Nueva solicitud de apertura tardía</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Campus</label>
                        <select v-model="form.campusId" @change="onFormCampusChange"
                            class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 outline-none uppercase">
                            <option :value="null">-- SELECCIONAR --</option>
                            <option v-for="c in filteredCampuses" :key="c.id" :value="c.id">{{ c.name }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Tipo Modalidad</label>
                        <select v-model="form.modalityTypeId" @change="onFormModalityTypeChange"
                            class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 outline-none uppercase">
                            <option :value="null">-- SELECCIONAR --</option>
                            <option v-for="mt in filteredModalityTypes" :key="mt.id" :value="mt.id">{{ mt.name }}</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Motivo de la solicitud</label>
                    <textarea v-model="form.reason" rows="3" :disabled="!formConfigId"
                        placeholder="Describa el motivo por el cual necesita apertura tardía (mínimo 10 caracteres)..."
                        class="w-full border-2 rounded-xl px-4 py-2.5 text-sm border-slate-200 focus:border-blue-500 outline-none resize-y disabled:bg-slate-50"></textarea>
                </div>
                <div class="flex items-center gap-3">
                    <button
                        class="px-5 py-2 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 uppercase disabled:opacity-40"
                        :disabled="!formConfigId || form.reason.length < 10 || submitting"
                        @click="submitRequest"
                    >{{ submitting ? 'Enviando...' : 'Enviar solicitud' }}</button>
                    <p v-if="formError" class="text-xs text-red-600">{{ formError }}</p>
                    <p v-if="formSuccess" class="text-xs text-green-600">{{ formSuccess }}</p>
                </div>
            </div>

            <!-- Lista de solicitudes -->
            <div class="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div class="bg-slate-50 border-b px-4 py-3 flex items-center justify-between">
                    <h2 class="text-sm font-bold text-slate-700 uppercase">
                        {{ isAdmin ? 'Solicitudes de Apertura Tardía' : 'Mis Solicitudes' }}
                    </h2>
                    <div class="flex gap-1">
                        <button v-for="s in statusFilters" :key="s.value"
                            class="px-2.5 py-1 text-[10px] font-bold rounded-full uppercase transition"
                            :class="statusFilter === s.value ? s.activeClass : 'bg-slate-100 text-slate-400 hover:bg-slate-200'"
                            @click="statusFilter = s.value; fetchRequests()">
                            {{ s.label }}
                        </button>
                    </div>
                </div>

                <div v-if="loadingRequests" class="flex justify-center py-12">
                    <div class="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>

                <div v-else-if="requests.length === 0" class="px-4 py-8 text-center text-xs text-slate-400 uppercase font-bold">
                    No hay solicitudes {{ statusFilter ? 'con este estado' : '' }}
                </div>

                <div v-else class="divide-y">
                    <div v-for="r in requests" :key="r.id" class="px-4 py-4 hover:bg-slate-50 transition space-y-2">
                        <div class="flex items-start justify-between gap-3">
                            <div class="min-w-0">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <span class="text-sm font-bold text-slate-800 uppercase">{{ r.periodName }}</span>
                                    <span class="text-[10px] text-slate-500 font-semibold">{{ r.modalityName }}</span>
                                    <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase"
                                        :class="statusBadge(r.status)">
                                        {{ statusLabel(r.status) }}
                                    </span>
                                    <span v-if="r.isActive" class="px-2 py-0.5 rounded-full text-[9px] font-black bg-green-100 text-green-700 uppercase">ACCESO ACTIVO</span>
                                </div>
                                <p v-if="isAdmin" class="text-[10px] text-slate-400 mt-0.5">Solicitante: <strong>{{ r.requesterName }}</strong> ({{ r.requesterEmail }})</p>
                                <p class="text-xs text-slate-600 mt-1">{{ r.reason }}</p>
                                <p v-if="r.directorNotes" class="text-xs text-indigo-600 mt-1 italic">Nota del director: {{ r.directorNotes }}</p>
                                <p v-if="r.expiresAt" class="text-[10px] text-amber-600 mt-0.5">Expira: {{ new Date(r.expiresAt).toLocaleString('es-MX') }}</p>
                            </div>
                            <div class="flex items-center gap-2 flex-shrink-0">
                                <!-- Admin: aprobar/rechazar pendientes -->
                                <template v-if="isAdmin && r.status === 'pending'">
                                    <button class="px-3 py-1.5 text-[10px] font-bold rounded-lg bg-green-600 text-white hover:bg-green-700 uppercase disabled:opacity-40"
                                        :disabled="acting === r.id" @click="approveRequest(r.id)">Aprobar</button>
                                    <button class="px-3 py-1.5 text-[10px] font-bold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 uppercase disabled:opacity-40"
                                        :disabled="acting === r.id" @click="rejectRequest(r.id)">Rechazar</button>
                                </template>
                                <!-- Career Manager: completar aprobadas -->
                                <button v-if="!isAdmin && r.status === 'approved' && r.isActive"
                                    class="px-3 py-1.5 text-[10px] font-bold rounded-lg bg-slate-600 text-white hover:bg-slate-700 uppercase disabled:opacity-40"
                                    :disabled="acting === r.id" @click="completeRequest(r.id)">
                                    Marcar completada
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
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
    if (!periodLocked.value) { if (!selectedPeriodId.value) return; lockedPeriodName.value = periodSelectorRef.value?.selectedPeriod?.name ?? 'SIN PERIODO'; periodLocked.value = true; savePeriodToStorage(); fetchRequests() }
    else { periodLocked.value = false; clearPeriodStorage() }
}
function onPeriodChange() { requests.value = [] }

/* ── Context ────────────────────────────────────────────────────── */
interface ScaContext { isAdmin: boolean; careerIds: number[]|null; modalityIds: number[]|null; campusIds: number[]|null; modalityTypeIds: number[]|null }
const ctx     = ref<ScaContext | null>(null)
const isAdmin = computed(() => ctx.value?.isAdmin ?? false)

const allCampuses      = ref<any[]>([])
const allModalityTypes = ref<any[]>([])
const allModalities    = ref<any[]>([])

const filteredCampuses = computed(() => {
    if (!ctx.value || ctx.value.isAdmin || !ctx.value.campusIds) return allCampuses.value
    return allCampuses.value.filter(c => ctx.value!.campusIds!.includes(c.id))
})
const filteredModalityTypes = computed(() => {
    let types = allModalityTypes.value
    if (ctx.value && !ctx.value.isAdmin && ctx.value.modalityTypeIds) types = types.filter(mt => ctx.value!.modalityTypeIds!.includes(mt.id))
    if (form.campusId) {
        const t = allModalities.value.filter((m: any) => (m.campusId ?? m.campus_id) === form.campusId).map((m: any) => m.modalityTypeId ?? m.modality_type_id)
        types = types.filter(mt => t.includes(mt.id))
    }
    return types
})

/* ── Form (Career Manager) ──────────────────────────────────────── */
const form = reactive({ campusId: null as number|null, modalityTypeId: null as number|null, reason: '' })
const formConfigId = ref<number | null>(null)
const submitting   = ref(false)
const formError    = ref<string | null>(null)
const formSuccess  = ref<string | null>(null)

function onFormCampusChange() { form.modalityTypeId = null; formConfigId.value = null }
function onFormModalityTypeChange() { formConfigId.value = null; resolveFormConfig() }

async function resolveFormConfig() {
    if (!form.campusId || !form.modalityTypeId || !selectedPeriodId.value) return
    const match = allModalities.value.find((m: any) => (m.campusId ?? m.campus_id) === form.campusId && (m.modalityTypeId ?? m.modality_type_id) === form.modalityTypeId)
    if (!match) return
    try {
        const { data } = await api.get(API.SCA_API.academicLoadConfigs.list, { params: { per_page: 1, search: { college_academic_period_id: selectedPeriodId.value, modality_id: match.id } } })
        const items = data?.items ?? data?.data ?? []
        formConfigId.value = items.length > 0 ? items[0].id : null
    } catch { formConfigId.value = null }
}

async function submitRequest() {
    if (!formConfigId.value) return
    formError.value = null; formSuccess.value = null; submitting.value = true
    try {
        await api.post(API.SCA_API.lateOpening.create, { academic_load_config_id: formConfigId.value, reason: form.reason })
        formSuccess.value = 'Solicitud enviada correctamente.'
        form.reason = ''; form.campusId = null; form.modalityTypeId = null; formConfigId.value = null
        fetchRequests()
        setTimeout(() => { formSuccess.value = null }, 3000)
    } catch (e: any) {
        formError.value = e?.response?.data?.message ?? 'Error al enviar.'
    } finally { submitting.value = false }
}

/* ── Requests list ──────────────────────────────────────────────── */
const requests        = ref<any[]>([])
const loadingRequests = ref(false)
const statusFilter    = ref<string>('')
const acting          = ref<number | null>(null)
const actionError     = ref<string | null>(null)

const statusFilters = [
    { value: '',          label: 'Todas',       activeClass: 'bg-slate-700 text-white' },
    { value: 'pending',   label: 'Pendientes',  activeClass: 'bg-amber-500 text-white' },
    { value: 'approved',  label: 'Aprobadas',   activeClass: 'bg-green-600 text-white' },
    { value: 'rejected',  label: 'Rechazadas',  activeClass: 'bg-red-500 text-white' },
    { value: 'completed', label: 'Completadas', activeClass: 'bg-blue-500 text-white' },
]

function statusBadge(s: string) {
    if (s === 'pending')   return 'bg-amber-100 text-amber-700'
    if (s === 'approved')  return 'bg-green-100 text-green-700'
    if (s === 'rejected')  return 'bg-red-100 text-red-700'
    if (s === 'completed') return 'bg-blue-100 text-blue-700'
    return 'bg-slate-100 text-slate-500'
}
function statusLabel(s: string) {
    if (s === 'pending')   return 'Pendiente'
    if (s === 'approved')  return 'Aprobada'
    if (s === 'rejected')  return 'Rechazada'
    if (s === 'completed') return 'Completada'
    return s
}

async function fetchRequests() {
    loadingRequests.value = true
    try {
        const params: Record<string, any> = {}
        if (statusFilter.value) params.status = statusFilter.value
        const { data } = await api.get(API.SCA_API.lateOpening.list, { params })
        requests.value = Array.isArray(data) ? data : []
    } catch { requests.value = [] }
    finally { loadingRequests.value = false }
}

async function approveRequest(id: number) {
    const hours = prompt('Horas de vigencia (default: 72):', '72')
    if (hours === null) return
    const notes = prompt('Notas (opcional):')
    acting.value = id; actionError.value = null
    try {
        await api.put(API.SCA_API.lateOpening.approve(id), { expires_hours: parseInt(hours) || 72, notes })
        fetchRequests()
    } catch (e: any) { actionError.value = e?.response?.data?.message ?? 'Error.' }
    finally { acting.value = null }
}

async function rejectRequest(id: number) {
    const notes = prompt('Motivo del rechazo (opcional):')
    if (notes === null) return
    acting.value = id; actionError.value = null
    try {
        await api.put(API.SCA_API.lateOpening.reject(id), { notes })
        fetchRequests()
    } catch (e: any) { actionError.value = e?.response?.data?.message ?? 'Error.' }
    finally { acting.value = null }
}

async function completeRequest(id: number) {
    if (!confirm('¿Marcar esta solicitud como completada? Se revocará el acceso temporal.')) return
    acting.value = id; actionError.value = null
    try {
        await api.put(API.SCA_API.lateOpening.complete(id), {})
        fetchRequests()
    } catch (e: any) { actionError.value = e?.response?.data?.message ?? 'Error.' }
    finally { acting.value = null }
}

/* ── Fetch ──────────────────────────────────────────────────────── */
async function fetchContext() { try { const { data } = await api.get(API.SCA_API.myContext); ctx.value = data } catch { ctx.value = { isAdmin: false, careerIds: [], modalityIds: [], campusIds: [], modalityTypeIds: [] } } }
async function fetchCampuses() { try { const { data } = await api.get(API.SCHOOL_SERVICES_API.campuses.list, { params: { per_page: 100 } }); allCampuses.value = (data?.items ?? data?.data ?? data ?? []).map((c: any) => ({ id: c.id, name: c.name ?? c.shortName })) } catch { allCampuses.value = [] } }
async function fetchModalityTypes() { try { const { data } = await api.get(API.SUPERADMIN_API.modalityTypes.list, { params: { per_page: 100 } }); allModalityTypes.value = (data?.items ?? data?.data ?? data ?? []).map((mt: any) => ({ id: mt.id, name: mt.name })) } catch { allModalityTypes.value = [] } }
async function fetchModalities() { try { const { data } = await api.get(API.SCHOOL_SERVICES_API.modalities.list, { params: { per_page: 200 } }); allModalities.value = data?.items ?? data?.data ?? data ?? [] } catch { allModalities.value = [] } }

onMounted(async () => {
    await fetchContext()
    restorePeriodFromStorage()
    fetchCampuses()
    fetchModalityTypes()
    fetchModalities()
    if (periodLocked.value) fetchRequests()
})
</script>
