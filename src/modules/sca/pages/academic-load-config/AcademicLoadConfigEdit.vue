<template>
    <div class="min-h-screen bg-slate-50">
        <!-- Loading -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-32">
            <div class="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <span class="text-sm text-slate-500 font-bold uppercase">CARGANDO...</span>
        </div>

        <!-- Error banner -->
        <Transition enter-active-class="transition-opacity" leave-active-class="transition-opacity" enter-from-class="opacity-0" leave-to-class="opacity-0">
            <div v-if="errorMsg" class="fixed top-4 right-4 z-[10000] p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 shadow-lg max-w-sm">
                {{ errorMsg }}
            </div>
        </Transition>

        <template v-if="!loading && config">
            <!-- HEADER -->
            <div class="sticky top-0 z-10 bg-white border-b shadow-sm px-6 py-3">
                <div class="flex flex-wrap items-center justify-between gap-4">
                    <div class="flex items-center gap-3">
                        <h1 class="text-sm font-black uppercase text-slate-800 tracking-wider">Configuración de Carga Académica</h1>
                        <button class="px-3 py-1.5 text-[10px] font-bold border rounded-lg hover:bg-slate-50 uppercase" @click="router.back()">
                            REGRESAR
                        </button>
                    </div>

                    <div class="flex flex-wrap items-center gap-2 text-xs">
                        <span class="font-semibold text-slate-700">{{ config.collegeAcademicPeriod?.academicPeriod?.name ?? '—' }}</span>
                        <span class="text-slate-300">|</span>
                        <span class="text-slate-500">{{ config.modality?.modalityType?.name ?? '—' }}</span>
                        <span class="px-2 py-0.5 text-[10px] font-bold rounded-full" :class="periodStatusClass(periodStatus)">
                            PERIODO: {{ periodStatus.toUpperCase() }}
                        </span>

                        <!-- Config status selector -->
                        <div class="flex items-center gap-1">
                            <span class="text-[10px] font-bold text-slate-400 uppercase">CONFIG:</span>
                            <select
                                v-model="config.status"
                                class="text-[10px] font-bold rounded-full border-0 px-2 py-0.5 cursor-pointer focus:ring-2 focus:ring-blue-300"
                                :class="configStatusClass(config.status)"
                                :disabled="updatingStatus"
                                @change="onChangeStatus"
                            >
                                <option v-for="opt in STATUS_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                            </select>
                        </div>

                        <span class="text-slate-300">|</span>

                        <button
                            type="button"
                            class="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                            :disabled="syncing"
                            @click="syncFromCalendar"
                        >
                            <ArrowPathIcon class="w-3.5 h-3.5" :class="syncing ? 'animate-spin' : ''" />
                            SINCRONIZAR CALENDARIO
                        </button>

                        <button
                            type="button"
                            class="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                            :disabled="generatingDates"
                            @click="generateScheduleDates"
                        >
                            <CalendarDaysIcon class="w-3.5 h-3.5" :class="generatingDates ? 'animate-spin' : ''" />
                            GENERAR FECHAS
                        </button>

                        <button
                            type="button"
                            class="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg border hover:bg-slate-50"
                            @click="showHistoryDrawer = true"
                        >
                            <ClockIcon class="w-3.5 h-3.5" />
                            HISTORIAL
                        </button>
                    </div>
                </div>
                <div v-if="config.lastSyncedAt" class="text-[10px] text-slate-400 mt-1">
                    Última sincronización: {{ formatDateTime(config.lastSyncedAt) }}
                </div>
            </div>

            <!-- PHASES GRID -->
            <div class="p-6">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div
                        v-for="phase in PHASES"
                        :key="phase.key"
                        class="bg-white border rounded-xl shadow-sm p-5 space-y-3"
                    >
                        <div class="flex items-start justify-between gap-3">
                            <div class="flex-1">
                                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">FASE {{ phase.order }}</p>
                                <h3 class="text-sm font-black text-slate-800 uppercase mt-0.5">{{ phase.label }}</h3>
                            </div>

                            <!-- Toggle switch -->
                            <button type="button"
                                :class="['relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors',
                                         getPhaseValue(phase.key) ? 'bg-green-500' : 'bg-slate-300']"
                                @click="onTogglePhase(phase.key, !getPhaseValue(phase.key))"
                            >
                                <span :class="['inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow',
                                               getPhaseValue(phase.key) ? 'translate-x-6' : 'translate-x-1']" />
                            </button>
                        </div>

                        <!-- Calendar suggestion indicator -->
                        <div v-if="suggestedPhases[phase.key] !== null && suggestedPhases[phase.key] !== undefined" class="text-[10px] flex items-center gap-1.5">
                            <template v-if="suggestedPhases[phase.key] === getPhaseValue(phase.key)">
                                <CheckCircleIcon class="w-3.5 h-3.5 text-green-500" />
                                <span class="text-green-600 font-bold uppercase">Coincide con calendario</span>
                            </template>
                            <template v-else>
                                <ExclamationTriangleIcon class="w-3.5 h-3.5 text-amber-500" />
                                <span class="text-amber-600 font-bold uppercase">
                                    Calendario sugiere {{ suggestedPhases[phase.key] ? 'ABRIR' : 'CERRAR' }}
                                </span>
                            </template>
                        </div>
                        <div v-else class="text-[10px] text-slate-300 italic">Sin evento de calendario configurado</div>

                        <!-- Last change info -->
                        <div v-if="lastChangeFor(phase.key)" class="text-[10px] text-slate-500 border-t pt-2">
                            Último cambio: {{ formatDateTime(lastChangeFor(phase.key)?.createdAt) }}
                            <span v-if="lastChangeFor(phase.key)?.changedByUser?.name">por {{ lastChangeFor(phase.key)?.changedByUser?.name }}</span>
                            <span v-if="lastChangeFor(phase.key)?.isExceptional" class="ml-1 px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded text-[8px] font-bold">EXCEPCIONAL</span>
                        </div>
                    </div>
                </div>

                <!-- SCHEDULE DATES SECTION -->
                <div v-if="hasScheduleDates" class="mt-6">
                    <div class="bg-white border rounded-xl shadow-sm overflow-hidden">
                        <div class="px-5 py-3 bg-indigo-50 border-b flex items-center justify-between">
                            <div>
                                <h2 class="text-sm font-black uppercase text-indigo-800 tracking-wider">Fechas para Modalidad</h2>
                                <p class="text-[10px] text-indigo-500 mt-0.5">
                                    {{ enabledCount() }} de {{ config!.scheduleDates!.length }} fechas habilitadas
                                </p>
                            </div>
                            <button
                                type="button"
                                class="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                                :disabled="savingDates"
                                @click="saveScheduleDates"
                            >
                                <span v-if="savingDates" class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                GUARDAR FECHAS
                            </button>
                        </div>

                        <div class="max-h-[500px] overflow-y-auto">
                            <table class="w-full text-xs">
                                <thead class="bg-slate-50 sticky top-0">
                                    <tr>
                                        <th class="px-4 py-2 text-left text-[10px] font-black text-slate-400 uppercase w-16">SESIÓN</th>
                                        <th class="px-4 py-2 text-left text-[10px] font-black text-slate-400 uppercase">FECHA</th>
                                        <th class="px-4 py-2 text-left text-[10px] font-black text-slate-400 uppercase w-20">DÍA</th>
                                        <th class="px-4 py-2 text-center text-[10px] font-black text-slate-400 uppercase w-24">HABILITADA</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr
                                        v-for="(sd, idx) in config!.scheduleDates!"
                                        :key="sd.session"
                                        class="border-t hover:bg-slate-50 cursor-pointer"
                                        :class="!sd.enabled ? 'bg-red-50/50 text-slate-400' : ''"
                                        @click="toggleScheduleDate(idx)"
                                    >
                                        <td class="px-4 py-2 font-bold">{{ sd.session }}</td>
                                        <td class="px-4 py-2">{{ formatDateShort(sd.date) }}</td>
                                        <td class="px-4 py-2">
                                            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold"
                                                :class="sd.enabled ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-500'">
                                                {{ DAY_NAMES[sd.dayOfWeek] ?? sd.dayOfWeek }}
                                            </span>
                                        </td>
                                        <td class="px-4 py-2 text-center">
                                            <button
                                                type="button"
                                                class="relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors"
                                                :class="sd.enabled ? 'bg-green-500' : 'bg-slate-300'"
                                                @click.stop="toggleScheduleDate(idx)"
                                            >
                                                <span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow"
                                                    :class="sd.enabled ? 'translate-x-4' : 'translate-x-0.5'" />
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <!-- HISTORY DRAWER -->
        <Teleport to="body">
            <div v-if="showHistoryDrawer" class="fixed inset-0" style="z-index: 99998;">
                <!-- Backdrop -->
                <div class="absolute inset-0 bg-black/30" @click="showHistoryDrawer = false"></div>

                <!-- Drawer panel -->
                <Transition appear enter-active-class="transition-transform duration-300" leave-active-class="transition-transform duration-300" enter-from-class="translate-x-full" leave-to-class="translate-x-full">
                <div class="absolute inset-y-0 right-0 w-96 max-w-full bg-white shadow-2xl flex flex-col" style="z-index: 99999;">
                    <div class="px-4 py-3 bg-slate-100 border-b flex items-center justify-between flex-shrink-0">
                        <h2 class="text-sm font-black uppercase text-slate-700">Historial de Cambios</h2>
                        <button type="button" class="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200" @click="showHistoryDrawer = false">
                            <XMarkIcon class="w-5 h-5" />
                        </button>
                    </div>

                    <div class="flex-1 overflow-y-auto p-3 space-y-2">
                        <div v-if="!history.length" class="text-center text-[10px] text-slate-400 py-12 uppercase">Sin cambios registrados</div>

                        <div v-for="h in history" :key="h.id" class="border rounded-lg p-3 space-y-1.5"
                            :class="h.isExceptional ? 'border-orange-200 bg-orange-50' : 'border-slate-200'">
                            <div class="flex items-center justify-between gap-2">
                                <span class="text-[10px] font-black uppercase text-slate-600">{{ phaseLabel(h.phase) }}</span>
                                <span class="text-[9px] text-slate-400">{{ formatDateTime(h.createdAt) }}</span>
                            </div>
                            <div class="flex items-center gap-2 text-[10px]">
                                <span class="px-1.5 py-0.5 rounded font-bold" :class="h.oldValue ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'">
                                    {{ h.oldValue ? 'ON' : 'OFF' }}
                                </span>
                                <ArrowRightIcon class="w-3 h-3 text-slate-400" />
                                <span class="px-1.5 py-0.5 rounded font-bold" :class="h.newValue ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'">
                                    {{ h.newValue ? 'ON' : 'OFF' }}
                                </span>
                                <span class="ml-auto text-[9px] px-1.5 py-0.5 rounded font-bold"
                                    :class="h.source === 'manual' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'">
                                    {{ h.source === 'manual' ? 'MANUAL' : 'AUTO' }}
                                </span>
                                <span v-if="h.isExceptional" class="text-[9px] px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded font-bold">⚠ EXCEPCIONAL</span>
                            </div>
                            <div class="text-[10px] text-slate-500">
                                <span v-if="h.changedByUser?.name">{{ h.changedByUser.name }}</span>
                                <span v-else class="italic">Sistema</span>
                            </div>
                            <div v-if="h.reason" class="text-[10px] text-slate-700 bg-white border-l-2 border-orange-400 pl-2 py-1 italic">
                                "{{ h.reason }}"
                            </div>
                        </div>
                    </div>
                </div>
                </Transition>
            </div>
        </Teleport>

        <!-- REASON MODAL (excepcional) -->
        <Teleport to="body">
            <div v-if="reasonModal.visible" class="fixed inset-0 flex items-center justify-center bg-black/40 p-4" style="z-index: 99999;">
                <div class="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
                    <div class="px-5 py-3 bg-orange-50 border-b border-orange-200 flex items-center gap-2">
                        <ExclamationTriangleIcon class="w-5 h-5 text-orange-600" />
                        <h3 class="text-sm font-black uppercase text-orange-700">Acción Excepcional</h3>
                    </div>
                    <div class="p-5 space-y-3">
                        <p class="text-xs text-slate-600">
                            Esta acción es inusual para el estado actual del periodo (<strong class="uppercase">{{ periodStatus }}</strong>).
                            Por favor proporciona una justificación.
                        </p>
                        <div>
                            <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">RAZÓN / JUSTIFICACIÓN</label>
                            <textarea
                                v-model="reasonModal.reason"
                                rows="4"
                                class="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
                                placeholder="Ej: Sustitución del docente X por baja médica..."
                            />
                            <p v-if="reasonModal.reason.length > 0 && reasonModal.reason.length < 10" class="text-[10px] text-red-500 mt-1">
                                Mínimo 10 caracteres ({{ reasonModal.reason.length }}/10)
                            </p>
                        </div>
                    </div>
                    <div class="px-5 py-3 bg-slate-50 border-t flex justify-end gap-2">
                        <button class="px-3 py-1.5 text-xs font-bold border rounded-lg hover:bg-white uppercase" @click="reasonModal.visible = false">
                            CANCELAR
                        </button>
                        <button
                            class="px-3 py-1.5 text-xs font-bold rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-60 uppercase"
                            :disabled="reasonModal.reason.length < 10"
                            @click="confirmExceptionalToggle"
                        >
                            CONFIRMAR
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
    ArrowPathIcon, ClockIcon, XMarkIcon, ArrowRightIcon,
    CheckCircleIcon, ExclamationTriangleIcon, CalendarDaysIcon,
} from '@heroicons/vue/24/outline'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { AcademicLoadConfig, AcademicLoadConfigHistory, PhaseKey, ScheduleDate } from '@/modules/sca/types/academicLoadConfig.type'
import { PHASES, STATUS_OPTIONS } from '@/modules/sca/types/academicLoadConfig.type'

const router = useRouter()
const route = useRoute()
const id = route.params.id as string

const config = ref<AcademicLoadConfig | null>(null)
const suggestedPhases = ref<Record<string, boolean | null>>({})
const history = ref<AcademicLoadConfigHistory[]>([])
const loading = ref(true)
const syncing = ref(false)
const generatingDates = ref(false)
const savingDates = ref(false)
const updatingStatus = ref(false)
const errorMsg = ref('')
const showHistoryDrawer = ref(false)

const reasonModal = reactive({
    visible: false,
    phase: '' as string,
    newValue: false,
    reason: '',
})

const periodStatus = computed(() => config.value?.collegeAcademicPeriod?.status ?? 'draft')

const PLANNING_PHASES = ['phase_package','phase_package_validation','phase_request','phase_assignment','phase_schedule']

function getPhaseValue(key: string): boolean {
    if (!config.value) return false
    return ({
        phase_package:             config.value.phasePackage,
        phase_package_validation:  config.value.phasePackageValidation,
        phase_request:             config.value.phaseRequest,
        phase_assignment:          config.value.phaseAssignment,
        phase_schedule:            config.value.phaseSchedule,
        phase_schedule_published:  config.value.phaseSchedulePublished,
    } as Record<string, boolean>)[key] ?? false
}

function isExceptional(phase: string, newValue: boolean): boolean {
    const status = periodStatus.value
    // Periodos de planeación (draft + planned): todo natural
    if (status === 'draft' || status === 'planned') return false
    // En active: solo es excepcional reabrir una fase de planeación
    if (status === 'active') return newValue && PLANNING_PHASES.includes(phase)
    // closed/archived: cualquier cambio es excepcional
    if (['closed','archived'].includes(status)) return true
    return false
}

function lastChangeFor(phase: string): AcademicLoadConfigHistory | null {
    return history.value.find(h => h.phase === phase) ?? null
}

function phaseLabel(key: string): string {
    return PHASES.find(p => p.key === key)?.label ?? key
}

function statusLabel(status: string): string {
    return ({ draft: 'BORRADOR', active: 'ACTIVO', closed: 'CERRADO' } as Record<string, string>)[status] ?? status.toUpperCase()
}

function configStatusClass(status: string): string {
    return ({
        draft:  'bg-slate-100 text-slate-600',
        active: 'bg-green-100 text-green-700',
        closed: 'bg-yellow-100 text-yellow-700',
    } as Record<string, string>)[status] ?? 'bg-slate-100 text-slate-600'
}

function periodStatusClass(status: string): string {
    return ({
        draft:    'bg-gray-100 text-gray-600',
        planned:  'bg-blue-100 text-blue-700',
        active:   'bg-green-100 text-green-700',
        closed:   'bg-yellow-100 text-yellow-700',
        archived: 'bg-slate-200 text-slate-600',
    } as Record<string, string>)[status] ?? 'bg-slate-100 text-slate-600'
}

function formatDateTime(s: string | null | undefined): string {
    if (!s) return '—'
    return new Date(s).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function showError(msg: string) {
    errorMsg.value = msg
    setTimeout(() => errorMsg.value = '', 4000)
}

const hasScheduleDates = computed(() => config.value?.scheduleDates !== null && config.value?.scheduleDates !== undefined)

const DAY_NAMES: Record<number, string> = {
    1: 'LUN', 2: 'MAR', 3: 'MIÉ', 4: 'JUE', 5: 'VIE', 6: 'SÁB', 7: 'DOM',
}

function formatDateShort(s: string): string {
    const d = new Date(s + 'T12:00:00')
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function enabledCount(): number {
    return config.value?.scheduleDates?.filter(d => d.enabled).length ?? 0
}

function toggleScheduleDate(index: number) {
    if (!config.value?.scheduleDates) return
    config.value.scheduleDates[index].enabled = !config.value.scheduleDates[index].enabled
}

async function generateScheduleDates() {
    generatingDates.value = true
    errorMsg.value = ''
    try {
        await api.post(API.SCA_API.academicLoadConfigs.generateScheduleDates(id))
        await loadConfig()
    } catch (e: any) {
        showError(e?.response?.data?.message ?? 'Error al generar fechas.')
    } finally {
        generatingDates.value = false
    }
}

async function saveScheduleDates() {
    if (!config.value?.scheduleDates) return
    savingDates.value = true
    errorMsg.value = ''
    try {
        await api.put(API.SCA_API.academicLoadConfigs.updateScheduleDates(id), {
            schedule_dates: config.value.scheduleDates,
        })
    } catch (e: any) {
        showError(e?.response?.data?.message ?? 'Error al guardar fechas.')
    } finally {
        savingDates.value = false
    }
}

// ───────── Actions ─────────
function onTogglePhase(phase: PhaseKey, newValue: boolean) {
    if (isExceptional(phase, newValue)) {
        reasonModal.phase = phase
        reasonModal.newValue = newValue
        reasonModal.reason = ''
        reasonModal.visible = true
        return
    }
    applyToggle(phase, newValue, null)
}

async function confirmExceptionalToggle() {
    if (reasonModal.reason.length < 10) return
    await applyToggle(reasonModal.phase as PhaseKey, reasonModal.newValue, reasonModal.reason)
    reasonModal.visible = false
}

async function applyToggle(phase: string, newValue: boolean, reason: string | null) {
    try {
        await api.patch(API.SCA_API.academicLoadConfigs.togglePhase(id), {
            phase, new_value: newValue, reason,
        })
        await loadAll()
    } catch (e: any) {
        showError(e?.response?.data?.message ?? 'Error al cambiar fase.')
    }
}

async function onChangeStatus() {
    if (!config.value) return
    updatingStatus.value = true
    errorMsg.value = ''
    try {
        await api.put(API.SCA_API.academicLoadConfigs.update(id), {
            college_academic_period_id: config.value.collegeAcademicPeriodId,
            modality_id:                config.value.modalityId,
            status:                     config.value.status,
            phase_package:              config.value.phasePackage,
            phase_package_validation:   config.value.phasePackageValidation,
            phase_request:              config.value.phaseRequest,
            phase_assignment:           config.value.phaseAssignment,
            phase_schedule:             config.value.phaseSchedule,
            phase_schedule_published:   config.value.phaseSchedulePublished,
        })
    } catch (e: any) {
        showError(e?.response?.data?.message ?? 'Error al actualizar estado.')
        await loadConfig()
    } finally {
        updatingStatus.value = false
    }
}

async function syncFromCalendar() {
    syncing.value = true
    errorMsg.value = ''
    try {
        await api.post(API.SCA_API.academicLoadConfigs.syncFromCalendar(id))
        await loadAll()
    } catch (e: any) {
        showError(e?.response?.data?.message ?? 'Error al sincronizar.')
    } finally {
        syncing.value = false
    }
}

// ───────── Data loading ─────────
async function loadConfig() {
    const res = await api.get(API.SCA_API.academicLoadConfigs.byId(id))
    config.value = res.data
}

async function loadSuggested() {
    try {
        const res = await api.get(API.SCA_API.academicLoadConfigs.suggestedPhases(id))
        suggestedPhases.value = res.data ?? {}
    } catch { /* silent */ }
}

async function loadHistory() {
    try {
        const res = await api.get(API.SCA_API.academicLoadConfigs.history(id))
        const data = res.data
        history.value = data?.items ?? data?.data ?? (Array.isArray(data) ? data : [])
    } catch { /* silent */ }
}

async function loadAll() {
    await loadConfig()
    await Promise.all([loadSuggested(), loadHistory()])
}

onMounted(async () => {
    loading.value = true
    try {
        await loadAll()
    } catch {
        showError('NO SE PUDO CARGAR LA CONFIGURACIÓN.')
    } finally {
        loading.value = false
    }
})
</script>
