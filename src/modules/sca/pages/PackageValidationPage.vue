<template>
    <div class="space-y-4">
        <!-- Periodo arriba -->
        <div class="flex items-center gap-3">
            <PeriodSelector v-if="!periodLocked" ref="periodSelectorRef" v-model="selectedPeriodId" @update:model-value="onPeriodChange" label="" placeholder="SELECCIONE UN PERIODO" class="flex-1" />
            <div v-else class="flex-1 border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold uppercase bg-slate-50 text-slate-700">
                {{ lockedPeriodName }}
            </div>
            <button
                class="w-12 h-[46px] border-2 rounded-xl flex items-center justify-center transition"
                :class="periodLocked ? 'border-slate-300 bg-slate-50 text-slate-500 hover:bg-slate-100' : 'border-blue-500 bg-blue-50 text-blue-600 hover:bg-blue-100'"
                :disabled="!selectedPeriodId && !periodLocked"
                @click="toggleLock"
                :title="periodLocked ? 'Desbloquear periodo' : 'Bloquear periodo'"
            >
                <svg v-if="periodLocked" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg>
                <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z"/></svg>
            </button>
            <div v-if="selectedPeriodId"
                class="h-[46px] border-2 rounded-xl px-4 flex items-center text-xs font-black uppercase tracking-wider whitespace-nowrap"
                :class="periodStatusClass">
                {{ currentPeriodStatusLabel }}
            </div>
        </div>

        <template v-if="periodLocked">

        <!-- Filtros: Campus + Tipo Modalidad + Plan de Estudio -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">CAMPUS</label>
                <select v-model="selectedCampusId" @change="onCampusOrTypeChange"
                    class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none uppercase">
                    <option :value="null">-- SELECCIONAR --</option>
                    <option v-for="c in campuses" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
            </div>
            <div>
                <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">TIPO MODALIDAD</label>
                <select v-model="selectedModalityTypeId" @change="onCampusOrTypeChange"
                    class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none uppercase">
                    <option :value="null">-- SELECCIONAR --</option>
                    <option v-for="mt in modalityTypes" :key="mt.id" :value="mt.id">{{ mt.name }}</option>
                </select>
            </div>
            <div>
                <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">PLAN DE ESTUDIO</label>
                <select v-model="selectedStudyPlanId" @change="onStudyPlanChange"
                    class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none uppercase"
                    :disabled="!resolvedModalityId">
                    <option :value="null">-- TODOS --</option>
                    <optgroup v-for="(plans, careerName) in studyPlansByCareer" :key="careerName" :label="String(careerName)">
                        <option v-for="sp in plans" :key="sp.id" :value="sp.id">
                            {{ sp.officialCode }}
                        </option>
                    </optgroup>
                </select>
            </div>
        </div>

        <!-- Alerta si no hay config -->
        <div v-if="configError" class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <p class="text-sm text-amber-700 font-semibold uppercase">{{ configError }}</p>
        </div>

        <!-- Contenido principal -->
        <template v-if="resolvedConfigId && !configError">

            <!-- Estado: cargando -->
            <div v-if="loadingSummary" class="flex justify-center py-12">
                <div class="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>

            <!-- Vista de resumen (sin plan seleccionado o "TODOS") -->
            <template v-else-if="!expandedPlanId">
                <div v-if="filteredSummary.length === 0" class="bg-white border rounded-xl shadow-sm p-12 text-center">
                    <p class="text-sm text-slate-400 uppercase font-bold">No hay paquetes de materias para validar</p>
                </div>

                <div v-else class="space-y-3">
                    <!-- Stats globales -->
                    <div class="bg-white border rounded-xl shadow-sm p-4">
                        <div class="flex items-center justify-between">
                            <h2 class="text-sm font-bold text-slate-700 uppercase">Resumen de Validación</h2>
                            <div class="flex items-center gap-4 text-xs font-bold">
                                <span class="text-slate-500">{{ globalStats.total }} materias</span>
                                <span class="text-green-600">{{ globalStats.approved }} aprobadas</span>
                                <span class="text-amber-600">{{ globalStats.pending }} pendientes</span>
                            </div>
                        </div>
                        <div class="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div class="h-full bg-green-500 transition-all duration-500 rounded-full"
                                :style="{ width: globalStats.total ? (globalStats.approved / globalStats.total * 100) + '%' : '0%' }">
                            </div>
                        </div>
                    </div>

                    <!-- Cards por plan -->
                    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        <div v-for="plan in filteredSummary" :key="plan.studyPlanId"
                            class="bg-white border-2 rounded-xl shadow-sm overflow-hidden cursor-pointer transition-all hover:shadow-md hover:border-blue-300 group"
                            @click="expandPlan(plan)">
                            <div class="p-4">
                                <div class="flex items-start justify-between mb-2">
                                    <div class="flex-1 min-w-0">
                                        <h3 class="text-sm font-black text-slate-800 uppercase truncate">{{ plan.careerName }}</h3>
                                        <p class="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{{ plan.officialCode }} &middot; {{ plan.planLabel }}</p>
                                    </div>
                                    <div class="ml-3 flex-shrink-0">
                                        <span v-if="plan.pending === 0"
                                            class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black bg-green-100 text-green-700">
                                            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                                            COMPLETO
                                        </span>
                                        <span v-else
                                            class="inline-flex items-center px-2 py-1 rounded-full text-[9px] font-black bg-amber-100 text-amber-600">
                                            {{ plan.pending }} PENDIENTES
                                        </span>
                                    </div>
                                </div>

                                <!-- Barra de progreso -->
                                <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                                    <div class="h-full rounded-full transition-all duration-500"
                                        :class="plan.pending === 0 ? 'bg-green-500' : 'bg-blue-500'"
                                        :style="{ width: plan.total ? (plan.approved / plan.total * 100) + '%' : '0%' }">
                                    </div>
                                </div>

                                <div class="flex items-center justify-between text-[10px] font-bold text-slate-400">
                                    <span>{{ plan.approved }}/{{ plan.total }} aprobadas</span>
                                    <span class="text-blue-500 group-hover:text-blue-700 uppercase">Revisar →</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>

            <!-- Vista detalle de un plan -->
            <template v-else>
                <div class="bg-white border rounded-xl shadow-sm overflow-hidden">
                    <!-- Header con info del plan y acciones masivas -->
                    <div class="bg-slate-50 border-b px-4 py-3">
                        <div class="flex items-center justify-between">
                            <div>
                                <button @click="collapsePlan" class="text-blue-600 hover:text-blue-800 text-xs font-bold uppercase mb-1">
                                    ← Volver al Resumen
                                </button>
                                <h2 class="text-sm font-black text-slate-800 uppercase">{{ expandedPlanInfo?.careerName }}</h2>
                                <p class="text-[10px] text-slate-400 font-bold uppercase">{{ expandedPlanInfo?.officialCode }} &middot; {{ expandedPlanInfo?.planLabel }}</p>
                            </div>
                            <div class="flex items-center gap-2">
                                <div class="flex items-center gap-3 mr-4">
                                    <span class="text-[10px] font-bold text-green-600">{{ detailStats.approved }} aprobadas</span>
                                    <span class="text-[10px] font-bold text-amber-600">{{ detailStats.pending }} pendientes</span>
                                </div>
                                <template v-if="!isViewOnly">
                                    <button v-if="detailStats.pending > 0"
                                        class="px-3 py-1.5 text-[10px] font-bold rounded-lg bg-green-600 text-white hover:bg-green-700 uppercase disabled:opacity-50"
                                        :disabled="bulkApproving"
                                        @click="approveAll">
                                        {{ bulkApproving ? 'Aprobando...' : 'Aprobar Todo' }}
                                    </button>
                                    <button v-if="detailStats.approved > 0"
                                        class="px-3 py-1.5 text-[10px] font-bold rounded-lg border border-red-200 text-red-500 hover:bg-red-50 uppercase disabled:opacity-50"
                                        :disabled="bulkApproving"
                                        @click="revokeAll">
                                        Revocar Todo
                                    </button>
                                </template>
                                <span v-else class="text-[10px] font-bold text-slate-400 uppercase">Solo lectura</span>
                            </div>
                        </div>
                        <!-- Barra de progreso -->
                        <div class="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div class="h-full bg-green-500 transition-all duration-500 rounded-full"
                                :style="{ width: detailStats.total ? (detailStats.approved / detailStats.total * 100) + '%' : '0%' }">
                            </div>
                        </div>
                    </div>

                    <!-- Header de tabla -->
                    <div class="hidden lg:grid grid-cols-[1fr_80px_80px_100px_1fr_120px] gap-2 px-4 py-2 bg-slate-100 border-b text-[10px] font-black text-slate-500 uppercase">
                        <span>Materia</span>
                        <span class="text-center">Semestre</span>
                        <span class="text-center">Grupos</span>
                        <span class="text-center">Estado</span>
                        <span>Comentario</span>
                        <span class="text-center">Acción</span>
                    </div>

                    <!-- Loading detalle -->
                    <div v-if="loadingDetail" class="flex justify-center py-12">
                        <div class="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>

                    <!-- Lista de materias -->
                    <div v-else class="divide-y max-h-[65vh] overflow-y-auto">
                        <template v-for="(section, sectionKey) in groupedDetailItems" :key="sectionKey">
                            <div class="px-4 py-2 text-[10px] font-black uppercase tracking-wider sticky top-0 z-10"
                                :class="{
                                    'bg-slate-100 text-slate-500': sectionKey === 'common',
                                    'bg-sky-50 text-sky-600 border-l-4 border-sky-400': String(sectionKey).startsWith('specialty:'),
                                    'bg-purple-50 text-purple-600 border-l-4 border-purple-400': String(sectionKey).startsWith('optional:'),
                                }">
                                {{ section.label }} ({{ section.items.length }})
                            </div>

                            <div v-for="item in section.items" :key="item.id"
                                class="px-4 py-3 transition"
                                :class="item.directorApproval ? 'bg-green-50/50' : 'hover:bg-slate-50'">
                                <div class="grid grid-cols-1 lg:grid-cols-[1fr_80px_80px_100px_1fr_120px] gap-2 items-center">
                                    <!-- Materia -->
                                    <div>
                                        <div class="flex items-center gap-2">
                                            <span class="text-sm font-bold text-slate-800 uppercase">{{ item.subject?.name ?? '—' }}</span>
                                            <span v-if="item.isRepeat" class="text-[8px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 font-black">REPETIDA</span>
                                        </div>
                                        <div class="text-[10px] text-slate-400 font-semibold space-x-2">
                                            <span>{{ item.subject?.officialCode }}</span>
                                            <span>|</span>
                                            <span class="text-orange-500 font-bold">Demanda: {{ item.demand }}</span>
                                        </div>
                                    </div>
                                    <!-- Semestre -->
                                    <div class="text-center text-sm font-bold text-slate-600">{{ item.targetSemester }}</div>
                                    <!-- Grupos -->
                                    <div class="text-center text-sm font-bold text-slate-600">{{ item.numGroups }}</div>
                                    <!-- Estado -->
                                    <div class="flex justify-center">
                                        <span v-if="item.directorApproval"
                                            class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                                            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                                            VoBo
                                        </span>
                                        <span v-else
                                            class="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-600">
                                            Pendiente
                                        </span>
                                    </div>
                                    <!-- Comentario -->
                                    <div>
                                        <input type="text"
                                            :value="item.directorNotes ?? ''"
                                            :placeholder="isViewOnly ? '' : 'Agregar comentario...'"
                                            :disabled="isViewOnly"
                                            class="w-full border rounded-lg px-2 py-1 text-xs text-slate-600 placeholder:text-slate-300 disabled:bg-slate-50"
                                            @change="!isViewOnly && approveItem(item.id, item.directorApproval, ($event.target as HTMLInputElement).value)"
                                        />
                                    </div>
                                    <!-- Acción -->
                                    <div class="flex justify-center gap-1">
                                        <template v-if="!isViewOnly">
                                            <button v-if="!item.directorApproval"
                                                class="px-2.5 py-1.5 text-[10px] font-bold rounded-lg bg-green-600 text-white hover:bg-green-700 uppercase disabled:opacity-50"
                                                :disabled="approvingId === item.id"
                                                @click="approveItem(item.id, true, item.directorNotes)">
                                                Aprobar
                                            </button>
                                            <button v-else
                                                class="px-2.5 py-1.5 text-[10px] font-bold rounded-lg border border-red-200 text-red-500 hover:bg-red-50 uppercase disabled:opacity-50"
                                                :disabled="approvingId === item.id"
                                                @click="approveItem(item.id, false, item.directorNotes)">
                                                Revocar
                                            </button>
                                        </template>
                                        <span v-else class="text-[10px] text-slate-400">—</span>
                                    </div>
                                </div>
                            </div>
                        </template>

                        <div v-if="detailItems.length === 0" class="px-4 py-8 text-center text-xs text-slate-400 uppercase font-bold">
                            No hay materias en este paquete
                        </div>
                    </div>
                </div>
            </template>

        </template>

        <!-- Placeholder antes de filtros -->
        <div v-else-if="!configError" class="bg-white border rounded-xl shadow-sm p-12 text-center">
            <p class="text-sm text-slate-400 uppercase font-bold">
                Completa los filtros para validar los paquetes de materias
            </p>
        </div>

        </template><!-- fin periodLocked -->
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import PeriodSelector from '@/app/components/ui/form/PeriodSelector.vue'

/* ── State: Filtros ──────────────────────────────────────────────── */
const selectedPeriodId       = ref<number | null>(null)
const selectedCampusId       = ref<number | null>(null)
const selectedModalityTypeId = ref<number | null>(null)
const selectedStudyPlanId    = ref<number | null>(null)

const allCampuses      = ref<any[]>([])
const allModalityTypes = ref<any[]>([])
const modalities       = ref<any[]>([])
const studyPlans       = ref<any[]>([])

interface ScaContext { isAdmin: boolean; careerIds: number[]|null; modalityIds: number[]|null; campusIds: number[]|null; modalityTypeIds: number[]|null }
const ctx = ref<ScaContext | null>(null)

const isViewOnly = computed(() => ctx.value !== null && !ctx.value.isAdmin)

const campuses = computed(() => {
    if (!ctx.value) return allCampuses.value
    if (ctx.value.isAdmin || !ctx.value.campusIds) return allCampuses.value
    return allCampuses.value.filter(c => ctx.value!.campusIds!.includes(c.id))
})

const modalityTypes = computed(() => {
    let types = allModalityTypes.value
    if (ctx.value && !ctx.value.isAdmin && ctx.value.modalityTypeIds) {
        types = types.filter(mt => ctx.value!.modalityTypeIds!.includes(mt.id))
    }
    if (selectedCampusId.value) {
        const typesInCampus = modalities.value
            .filter((m: any) => (m.campusId ?? m.campus_id) === selectedCampusId.value)
            .map((m: any) => m.modalityTypeId ?? m.modality_type_id)
        types = types.filter(mt => typesInCampus.includes(mt.id))
    }
    return types
})

const periodSelectorRef  = ref<InstanceType<typeof PeriodSelector> | null>(null)
const periodLocked       = ref(false)
const lockedPeriodName   = ref('')
const lockedPeriodStatus = ref('')

const resolvedModalityId = ref<number | null>(null)
const resolvedConfigId   = ref<number | null>(null)
const resolvedConfig     = ref<any>(null)
const configError        = ref<string | null>(null)

const STORAGE_KEY = 'sca_period'

/* ── State: Datos ────────────────────────────────────────────────── */
const summaryData   = ref<any[]>([])
const loadingSummary = ref(false)
const expandedPlanId = ref<number | null>(null)
const detailItems    = ref<any[]>([])
const loadingDetail  = ref(false)
const approvingId    = ref<number | null>(null)
const bulkApproving  = ref(false)

/* ── Period lock ─────────────────────────────────────────────────── */
function savePeriodToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        id: selectedPeriodId.value,
        name: lockedPeriodName.value,
        status: lockedPeriodStatus.value,
    }))
}

function clearPeriodStorage() {
    localStorage.removeItem(STORAGE_KEY)
}

function restorePeriodFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return
        const saved = JSON.parse(raw)
        if (saved?.id) {
            selectedPeriodId.value = saved.id
            lockedPeriodName.value = saved.name ?? ''
            lockedPeriodStatus.value = saved.status ?? '—'
            periodLocked.value = true
        }
    } catch { /* corrupted data, ignore */ }
}

function toggleLock() {
    if (!periodLocked.value) {
        if (!selectedPeriodId.value) return
        const p = periodSelectorRef.value?.selectedPeriod
        lockedPeriodName.value = p?.name ?? 'SIN PERIODO'
        lockedPeriodStatus.value = p?.statusLabel ?? '—'
        periodLocked.value = true
        savePeriodToStorage()
    } else {
        periodLocked.value = false
        clearPeriodStorage()
        resetAll()
    }
}

const currentPeriodStatusLabel = computed(() => {
    if (periodLocked.value) return lockedPeriodStatus.value
    return periodSelectorRef.value?.selectedPeriod?.statusLabel ?? '—'
})

const periodStatusClass = computed(() => {
    const status = currentPeriodStatusLabel.value.toLowerCase()
    if (status.includes('activo'))     return 'border-green-300 bg-green-50 text-green-700'
    if (status.includes('planeaci'))   return 'border-amber-300 bg-amber-50 text-amber-700'
    if (status.includes('planeado'))   return 'border-blue-300 bg-blue-50 text-blue-700'
    if (status.includes('cerrado') || status.includes('finalizado')) return 'border-slate-300 bg-slate-100 text-slate-500'
    return 'border-slate-200 bg-slate-50 text-slate-600'
})

/* ── Computed ────────────────────────────────────────────────────── */
const studyPlansByCareer = computed(() => {
    const groups: Record<string, any[]> = {}
    for (const sp of studyPlans.value) {
        const career = sp.careerName ?? sp.name ?? 'SIN CARRERA'
        if (!groups[career]) groups[career] = []
        groups[career].push(sp)
    }
    return groups
})

const filteredSummary = computed(() => {
    if (!selectedStudyPlanId.value) return summaryData.value
    return summaryData.value.filter((s: any) => s.studyPlanId === selectedStudyPlanId.value)
})

const globalStats = computed(() => {
    const data = filteredSummary.value
    const total = data.reduce((s: number, p: any) => s + p.total, 0)
    const approved = data.reduce((s: number, p: any) => s + p.approved, 0)
    return { total, approved, pending: total - approved }
})

const expandedPlanInfo = computed(() => {
    return summaryData.value.find((s: any) => s.studyPlanId === expandedPlanId.value) ?? null
})

const detailStats = computed(() => {
    const total = detailItems.value.length
    const approved = detailItems.value.filter((i: any) => i.directorApproval).length
    return { total, approved, pending: total - approved }
})

const groupedDetailItems = computed(() => {
    const sections: Record<string, { label: string; items: any[] }> = {}

    for (const item of detailItems.value) {
        const specId = item.curriculum?.specialtyId
        const optId = item.curriculum?.optionalGroupId

        if (specId) {
            const key = `specialty:${specId}`
            if (!sections[key]) {
                sections[key] = {
                    label: `Especialidad: ${item.curriculum?.specialtyName ?? 'Sin nombre'}`,
                    items: [],
                }
            }
            sections[key].items.push(item)
        } else if (optId) {
            const key = `optional:${optId}`
            if (!sections[key]) {
                sections[key] = {
                    label: `Optativas: ${item.curriculum?.optionalGroupName ?? 'Sin nombre'}`,
                    items: [],
                }
            }
            sections[key].items.push(item)
        } else {
            if (!sections['common']) {
                sections['common'] = { label: 'Materias Comunes', items: [] }
            }
            sections['common'].items.push(item)
        }
    }

    const sorted: Record<string, { label: string; items: any[] }> = {}
    if (sections['common']) sorted['common'] = sections['common']
    for (const [k, v] of Object.entries(sections)) {
        if (k.startsWith('specialty:')) sorted[k] = v
    }
    for (const [k, v] of Object.entries(sections)) {
        if (k.startsWith('optional:')) sorted[k] = v
    }
    return sorted
})

/* ── Fetch data ──────────────────────────────────────────────────── */
async function fetchContext() {
    try {
        const { data } = await api.get(API.SCA_API.myContext)
        ctx.value = data
    } catch { ctx.value = { isAdmin: false, careerIds: [], modalityIds: [], campusIds: [], modalityTypeIds: [] } }
}

async function fetchCampuses() {
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.campuses.list, { params: { per_page: 100, status: 1 } })
        allCampuses.value = (data?.items ?? data?.data ?? data ?? []).map((c: any) => ({ id: c.id, name: c.name ?? c.shortName ?? `Campus #${c.id}` }))
    } catch { allCampuses.value = [] }
}

async function fetchModalityTypes() {
    try {
        const { data } = await api.get(API.SUPERADMIN_API.modalityTypes.list, { params: { per_page: 100 } })
        allModalityTypes.value = (data?.items ?? data?.data ?? data ?? []).map((mt: any) => ({ id: mt.id, name: mt.name ?? `Tipo #${mt.id}` }))
    } catch { allModalityTypes.value = [] }
}

async function fetchModalities() {
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.modalities.list, { params: { per_page: 200 } })
        modalities.value = data?.items ?? data?.data ?? data ?? []
    } catch { modalities.value = [] }
}

function resolveModality() {
    resolvedModalityId.value = null
    selectedStudyPlanId.value = null
    studyPlans.value = []
    configError.value = null
    resolvedConfigId.value = null
    summaryData.value = []
    expandedPlanId.value = null
    detailItems.value = []

    if (!selectedCampusId.value || !selectedModalityTypeId.value) return

    const match = modalities.value.find((m: any) =>
        (m.campusId === selectedCampusId.value || m.campus_id === selectedCampusId.value) &&
        (m.modalityTypeId === selectedModalityTypeId.value || m.modality_type_id === selectedModalityTypeId.value)
    )

    if (match) {
        resolvedModalityId.value = match.id
        fetchStudyPlans()
        resolveConfig()
    }
}

async function fetchStudyPlans() {
    if (!resolvedModalityId.value) return
    try {
        const { data } = await api.get(API.SCA_API.subjectPackages.allowedAcademicOffers, {
            params: { modality_id: resolvedModalityId.value }
        })
        const aoItems = Array.isArray(data) ? data : (data?.items ?? data?.data ?? [])

        const plans: any[] = []
        for (const ao of aoItems) {
            const aoStudyPlans = ao.studyPlans ?? ao.study_plans ?? []
            for (const aosp of aoStudyPlans) {
                // Solo study plans activos
                const linkActive = aosp.status === true || aosp.status === 1
                const sp = aosp.studyPlan ?? aosp.study_plan ?? aosp
                const planActive = sp?.is_active !== false && sp?.isActive !== false
                if (!linkActive || !planActive) continue

                const spId = sp.id ?? aosp.studyPlanId ?? aosp.study_plan_id
                if (spId && !plans.find((p: any) => p.id === spId)) {
                    plans.push({
                        id: spId,
                        name: sp.name ?? '',
                        officialCode: sp.officialCode ?? sp.official_code ?? '',
                        careerName: ao.career?.name ?? sp.career?.name ?? null,
                    })
                }
            }
        }
        studyPlans.value = plans
    } catch { studyPlans.value = [] }
}

async function resolveConfig() {
    resolvedConfigId.value = null
    resolvedConfig.value = null
    configError.value = null

    if (!selectedPeriodId.value || !resolvedModalityId.value) return

    try {
        const { data } = await api.get(API.SCA_API.academicLoadConfigs.list, {
            params: {
                per_page: 1,
                search: {
                    college_academic_period_id: selectedPeriodId.value,
                    modality_id: resolvedModalityId.value,
                },
            },
        })
        const items = data?.items ?? data?.data ?? []
        if (items.length === 0) {
            configError.value = 'No existe una configuración de carga académica para este periodo y modalidad.'
            return
        }
        const config = items[0]
        const validationPhase = config.phasePackageValidation ?? config.phase_package_validation
        if (!validationPhase) {
            configError.value = 'La fase de Validación de Paquete no está habilitada en la configuración de carga.'
            return
        }
        resolvedConfigId.value = config.id
        resolvedConfig.value = config
        fetchSummary()
    } catch {
        configError.value = 'Error al buscar la configuración de carga académica.'
    }
}

async function fetchSummary() {
    if (!resolvedConfigId.value) return
    loadingSummary.value = true
    try {
        const { data } = await api.get(API.SCA_API.subjectPackages.summary(resolvedConfigId.value))
        summaryData.value = Array.isArray(data) ? data : []
    } catch { summaryData.value = [] }
    finally { loadingSummary.value = false }
}

async function fetchDetailItems(studyPlanId: number) {
    if (!resolvedConfigId.value) return
    loadingDetail.value = true
    try {
        const { data } = await api.get(
            API.SCA_API.subjectPackages.list(resolvedConfigId.value, studyPlanId)
        )
        detailItems.value = data ?? []
    } catch { detailItems.value = [] }
    finally { loadingDetail.value = false }
}

/* ── Navigation ──────────────────────────────────────────────────── */
function expandPlan(plan: any) {
    expandedPlanId.value = plan.studyPlanId
    fetchDetailItems(plan.studyPlanId)
}

function collapsePlan() {
    expandedPlanId.value = null
    detailItems.value = []
    fetchSummary()
}

/* ── Approval actions ────────────────────────────────────────────── */
async function approveItem(id: number, approved: boolean, notes?: string) {
    approvingId.value = id
    try {
        await api.patch(API.SCA_API.subjectPackages.approve(id), { approved, notes: notes ?? null })
        await fetchDetailItems(expandedPlanId.value!)
    } catch (e: any) {
        console.error('Error al aprobar:', e?.response?.data?.message ?? e)
    } finally {
        approvingId.value = null
    }
}

async function approveAll() {
    bulkApproving.value = true
    const pending = detailItems.value.filter((i: any) => !i.directorApproval)
    for (const item of pending) {
        await api.patch(API.SCA_API.subjectPackages.approve(item.id), { approved: true, notes: null })
    }
    await fetchDetailItems(expandedPlanId.value!)
    bulkApproving.value = false
}

async function revokeAll() {
    bulkApproving.value = true
    const approved = detailItems.value.filter((i: any) => i.directorApproval)
    for (const item of approved) {
        await api.patch(API.SCA_API.subjectPackages.approve(item.id), { approved: false, notes: null })
    }
    await fetchDetailItems(expandedPlanId.value!)
    bulkApproving.value = false
}

/* ── Filter events ───────────────────────────────────────────────── */
function resetAll() {
    selectedCampusId.value = null
    selectedModalityTypeId.value = null
    selectedStudyPlanId.value = null
    resolvedModalityId.value = null
    resolvedConfigId.value = null
    resolvedConfig.value = null
    configError.value = null
    summaryData.value = []
    studyPlans.value = []
    expandedPlanId.value = null
    detailItems.value = []
}

function onPeriodChange() {
    resolvedConfigId.value = null
    configError.value = null
    summaryData.value = []
    expandedPlanId.value = null
    detailItems.value = []
    if (selectedPeriodId.value && resolvedModalityId.value) {
        resolveConfig()
    }
}

function onCampusOrTypeChange() {
    selectedStudyPlanId.value = null
    summaryData.value = []
    expandedPlanId.value = null
    detailItems.value = []
    resolveModality()
}

function onStudyPlanChange() {
    expandedPlanId.value = null
    detailItems.value = []
}

/* ── Init ────────────────────────────────────────────────────────── */
onMounted(() => {
    fetchContext()
    restorePeriodFromStorage()
    fetchCampuses()
    fetchModalityTypes()
    fetchModalities()
})
</script>
