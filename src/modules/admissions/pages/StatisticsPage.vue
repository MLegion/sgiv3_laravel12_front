<template>
    <div class="space-y-6">

        <!-- Encabezado -->
        <div>
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Reportes Estadísticos</h1>
            <p class="mt-1 text-sm text-slate-500">
                Indicadores del proceso de admisión por período académico.
            </p>
        </div>

        <!-- Selector de periodo -->
        <div class="max-w-sm">
            <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Período Académico</label>
            <FormRemoteSelect
                v-model="periodId"
                :endpoint="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.list"
                :endpoint-by-id="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.resolveByPeriodId"
                :params="{ order_by: 'actual_start_date', order_dir: 'desc' }"
                item-label="name"
                item-value="academicPeriodId"
                placeholder="Selecciona un período..."
            />
            <p class="text-[11px] text-slate-400 mt-1 italic">
                Vacío = todos los aspirantes históricos del plantel.
            </p>
        </div>

        <!-- Tabs (scroll horizontal en pantallas chicas) -->
        <div class="flex gap-1 border-b border-slate-200 overflow-x-auto">
            <button
                v-for="t in tabs"
                :key="t.key"
                type="button"
                class="tab-btn whitespace-nowrap"
                :class="tab === t.key ? 'tab-active' : 'tab-inactive'"
                @click="tab = t.key"
            >
                {{ t.label }}
            </button>
        </div>

        <!-- Contenido del tab activo -->
        <div>
            <FunnelTab     v-if="tab === 'funnel'"     :period-id="periodId" />
            <ScoresTab     v-else-if="tab === 'scores'"     :period-id="periodId" />
            <DemandTab     v-else-if="tab === 'demand'"     :period-id="periodId" />
            <AttendanceTab v-else-if="tab === 'attendance'" :period-id="periodId" />
            <AgeModeTab    v-else-if="tab === 'ageMode'"    :period-id="periodId" />
            <OriginTab     v-else-if="tab === 'origin'"     :period-id="periodId" />
            <InclusionTab  v-else-if="tab === 'inclusion'"  :period-id="periodId" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import FunnelTab     from './statistics/FunnelTab.vue'
import ScoresTab     from './statistics/ScoresTab.vue'
import DemandTab     from './statistics/DemandTab.vue'
import AttendanceTab from './statistics/AttendanceTab.vue'
import AgeModeTab    from './statistics/AgeModeTab.vue'
import OriginTab     from './statistics/OriginTab.vue'
import InclusionTab  from './statistics/InclusionTab.vue'

type Tab = 'funnel' | 'scores' | 'demand' | 'attendance' | 'ageMode' | 'origin' | 'inclusion'

interface StatsContext {
    examMode: 'online' | 'presencial' | 'mixto'
    hasInPersonExam: boolean
}

const allTabs: { key: Tab; label: string; requires?: 'inPersonExam' }[] = [
    { key: 'funnel',     label: 'Embudo' },
    { key: 'scores',     label: 'Calificaciones' },
    { key: 'demand',     label: 'Demanda por carrera' },
    { key: 'attendance', label: 'Asistencia al examen', requires: 'inPersonExam' },
    { key: 'ageMode',    label: 'Edad y modalidad' },
    { key: 'origin',     label: 'Procedencia' },
    { key: 'inclusion',  label: 'Inclusión' },
]

const ctx      = ref<StatsContext | null>(null)
const tab      = ref<Tab>('funnel')
const periodId = ref<number | null>(null)

const tabs = computed(() => allTabs.filter(t => {
    if (t.requires === 'inPersonExam') return ctx.value?.hasInPersonExam ?? false
    return true
}))

onMounted(async () => {
    const [ctxRes, periodsRes] = await Promise.all([
        api.get<StatsContext>(API.ADMISSIONS_API.statistics.context),
        api.get<{ items: { academicPeriodId: number }[] }>(
            API.SCHOOL_SERVICES_API.collegeAcademicPeriods.list,
            { params: { order_by: 'actual_start_date', order_dir: 'desc', per_page: 1 } },
        ),
    ])
    ctx.value = ctxRes.data
    // Pre-selecciona el periodo más reciente para que los reportes carguen sin
    // que el usuario tenga que elegir manualmente. Puede limpiarlo para ver
    // datos históricos (vacío = todos).
    const first = periodsRes.data.items?.[0]
    if (first?.academicPeriodId) {
        periodId.value = first.academicPeriodId
    }
})
</script>

<style scoped>
.tab-btn {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    border-bottom: 2px solid transparent;
    transition: color 0.15s, border-color 0.15s;
}
.tab-active {
    color: rgb(37 99 235);
    border-bottom-color: rgb(37 99 235);
}
.tab-inactive {
    color: rgb(100 116 139);
}
.tab-inactive:hover {
    color: rgb(51 65 85);
}
</style>
