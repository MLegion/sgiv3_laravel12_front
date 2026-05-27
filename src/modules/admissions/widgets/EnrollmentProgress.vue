<template>
    <!-- MODO SETTINGS -->
    <div v-if="view === 'settings'" class="h-full flex flex-col text-xs space-y-3 overflow-y-auto">
        <div>
            <label class="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                Periodo
            </label>
            <select
                v-model="periodChoice"
                class="w-full text-xs bg-white border border-slate-200 rounded px-2 py-1.5"
                @change="emitParams"
            >
                <option value="">{{ data?.currentPeriod?.shortName ? `(auto: ${data.currentPeriod.shortName})` : '(actual auto)' }}</option>
                <option v-for="p in (data?.availablePeriods ?? [])" :key="p.id" :value="String(p.id)">
                    {{ p.shortName ?? p.name }}
                </option>
            </select>
        </div>

        <div v-if="data?.canChooseScope">
            <label class="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                Vista
            </label>
            <div class="inline-flex bg-slate-100 rounded-lg p-0.5 w-full">
                <button class="flex-1 px-2 py-1 text-xs rounded-md transition"
                        :class="scopeChoice === 'campus' ? activeBtn : inactiveBtn"
                        @click="setScope('campus')">Campus</button>
                <button class="flex-1 px-2 py-1 text-xs rounded-md transition"
                        :class="scopeChoice === 'career' ? activeBtn : inactiveBtn"
                        @click="setScope('career')">Mi carrera</button>
            </div>
        </div>

        <div v-if="(data?.availableCampuses?.length ?? 0) > 1">
            <label class="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                Campus
            </label>
            <select
                v-model="campusChoice"
                class="w-full text-xs bg-white border border-slate-200 rounded px-2 py-1.5"
                @change="emitParams"
            >
                <option value="">Todos</option>
                <option v-for="c in (data?.availableCampuses ?? [])" :key="c.id" :value="String(c.id)">
                    {{ c.name }}
                </option>
            </select>
        </div>

        <div v-if="(data?.availableCareers?.length ?? 0) > 0">
            <label class="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                Carrera
            </label>
            <select
                v-model="careerChoice"
                class="w-full text-xs bg-white border border-slate-200 rounded px-2 py-1.5"
                @change="emitParams"
            >
                <option value="">Todas</option>
                <option v-for="c in (data?.availableCareers ?? [])" :key="c.id" :value="String(c.id)">
                    {{ c.name }}
                </option>
            </select>
        </div>

        <div v-if="(data?.availableModalityTypes?.length ?? 0) > 1">
            <label class="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                Modalidad
            </label>
            <select
                v-model="modalityTypeChoice"
                class="w-full text-xs bg-white border border-slate-200 rounded px-2 py-1.5"
                @change="emitParams"
            >
                <option value="">Todas</option>
                <option v-for="m in (data?.availableModalityTypes ?? [])" :key="m.id" :value="String(m.id)">
                    {{ m.name }}
                </option>
            </select>
        </div>

        <button
            v-if="hasAnyFilter"
            class="text-[10px] text-slate-500 hover:text-rose-600 underline self-start"
            @click="clearFilters"
        >Quitar filtros</button>

        <div class="text-[10px] text-slate-400 mt-auto">
            Cambios aplican al cerrar la configuración.
        </div>
    </div>

    <!-- MODO DATA -->
    <div v-else class="h-full flex flex-col text-xs">
        <div class="flex items-center gap-1 text-slate-500 mb-1 flex-wrap">
            <span class="font-medium text-slate-700">{{ data?.currentPeriod?.shortName ?? '—' }}</span>
            <span
                v-if="data?.canChooseScope"
                class="ml-auto text-[10px] px-1.5 py-0.5 rounded"
                :class="data?.currentScope === 'career' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'"
            >
                {{ data?.currentScope === 'career' ? 'Mi carrera' : 'Campus' }}
            </span>
        </div>

        <div v-if="hasAppliedFilters" class="flex flex-wrap gap-1 mb-2">
            <span v-if="data?.appliedCampusName" class="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                {{ data.appliedCampusName }}
            </span>
            <span v-if="data?.appliedCareerName" class="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 truncate max-w-full">
                {{ data.appliedCareerName }}
            </span>
            <span v-if="data?.appliedModalityTypeName" class="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-700">
                {{ data.appliedModalityTypeName }}
            </span>
        </div>

        <div v-if="loading && !data" class="text-slate-400 italic">Cargando…</div>

        <div v-else-if="admittedTotal === 0" class="text-slate-400 italic">
            Aún no hay admitidos en este periodo.
        </div>

        <div v-else class="flex-1 flex flex-col gap-2">
            <!-- Barra de progreso -->
            <div class="relative h-8 bg-slate-100 rounded overflow-hidden">
                <div
                    class="absolute inset-y-0 left-0 bg-emerald-400 transition-all duration-300"
                    :style="{ width: pct + '%' }"
                />
                <div class="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700">
                    {{ pct.toFixed(0) }}%
                </div>
            </div>

            <div class="grid grid-cols-2 gap-2 text-center">
                <div>
                    <div class="text-lg font-bold text-emerald-700 leading-none">{{ formatNum(inscritos) }}</div>
                    <div class="text-[10px] uppercase text-slate-500">Inscritos</div>
                </div>
                <div>
                    <div class="text-lg font-bold leading-none" :class="pending > 0 ? 'text-amber-600' : 'text-slate-400'">{{ formatNum(pending) }}</div>
                    <div class="text-[10px] uppercase text-slate-500">Pendientes</div>
                </div>
            </div>

            <div class="text-[10px] text-slate-400 text-center mt-auto">
                Total admitidos: {{ formatNum(admittedTotal) }}
            </div>
        </div>

        <div v-if="error" class="mt-2 text-rose-600">No se pudo cargar.</div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface PeriodRef  { id: number; name: string; shortName: string | null }
interface CatalogRef { id: number; name: string }
interface Payload {
    currentPeriod:           PeriodRef | null
    pending:                 number
    inscritos:               number
    admittedTotal:           number
    currentScope:            'campus' | 'career'
    canChooseScope:          boolean
    availablePeriods:        PeriodRef[]
    availableCampuses:       CatalogRef[]
    availableCareers:        CatalogRef[]
    availableModalityTypes:  CatalogRef[]
    appliedCampusId:         number | null
    appliedCareerId:         number | null
    appliedModalityTypeId:   number | null
    appliedCampusName:       string | null
    appliedCareerName:       string | null
    appliedModalityTypeName: string | null
}

const props = defineProps<{
    data:    Payload | null
    loading: boolean
    error:   unknown
    view?:   'data' | 'settings'
}>()

const emit = defineEmits<{
    (e: 'params', p: Record<string, string | number | null>): void
}>()

const periodChoice       = ref('')
const scopeChoice        = ref<'campus' | 'career'>('campus')
const campusChoice       = ref('')
const careerChoice       = ref('')
const modalityTypeChoice = ref('')

watch(() => props.data?.currentScope, (s) => {
    if (s) scopeChoice.value = s
}, { immediate: true })

watch(() => props.data?.appliedCampusId,       (id) => { campusChoice.value       = id ? String(id) : '' }, { immediate: true })
watch(() => props.data?.appliedCareerId,       (id) => { careerChoice.value       = id ? String(id) : '' }, { immediate: true })
watch(() => props.data?.appliedModalityTypeId, (id) => { modalityTypeChoice.value = id ? String(id) : '' }, { immediate: true })

const activeBtn   = 'bg-white shadow text-slate-800'
const inactiveBtn = 'text-slate-500 hover:text-slate-700'

const pending       = computed(() => props.data?.pending ?? 0)
const inscritos     = computed(() => props.data?.inscritos ?? 0)
const admittedTotal = computed(() => props.data?.admittedTotal ?? 0)
const pct = computed(() => admittedTotal.value > 0
    ? Math.min(100, (inscritos.value / admittedTotal.value) * 100)
    : 0)

const hasAnyFilter = computed(() =>
    campusChoice.value !== '' || careerChoice.value !== '' || modalityTypeChoice.value !== '')

const hasAppliedFilters = computed(() => Boolean(
    props.data?.appliedCampusName || props.data?.appliedCareerName || props.data?.appliedModalityTypeName,
))

function formatNum(n: number): string {
    return (n ?? 0).toLocaleString('es-MX')
}

function emitParams(): void {
    emit('params', {
        period_id:        periodChoice.value,
        scope:            props.data?.canChooseScope ? scopeChoice.value : null,
        campus_id:        campusChoice.value,
        career_id:        careerChoice.value,
        modality_type_id: modalityTypeChoice.value,
    })
}

function setScope(s: 'campus' | 'career'): void {
    scopeChoice.value = s
    emitParams()
}

function clearFilters(): void {
    campusChoice.value       = ''
    careerChoice.value       = ''
    modalityTypeChoice.value = ''
    emitParams()
}
</script>
