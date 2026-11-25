<template>
    <div class="space-y-6">
        <template v-if="loading">
            <section><SkeletonTable :rows="5" :cols="3" /></section>
            <section><SkeletonChart :height="320" /></section>
            <section><SkeletonTable :rows="5" :cols="4" /></section>
        </template>

        <template v-else-if="data">
            <!-- Top escuelas -->
            <section>
                <h2 class="text-base font-semibold text-slate-800 mb-2">Top escuelas de procedencia</h2>
                <DataTable
                    :columns="schoolColumns"
                    :rows="data.topSchools"
                    hide-search
                    caption="Top escuelas de procedencia"
                    empty-text="Sin datos."
                >
                    <template #cell-rank="{ index }">
                        <span class="text-xs text-slate-400 font-mono">{{ index + 1 }}</span>
                    </template>
                    <template #cell-name="{ row }">
                        <span class="font-medium text-slate-700">{{ row.name }}</span>
                    </template>
                    <template #cell-count="{ row }">
                        <span class="tabular-nums font-semibold">{{ row.count }}</span>
                    </template>
                </DataTable>
            </section>

            <!-- Por estado -->
            <section>
                <h2 class="text-base font-semibold text-slate-800 mb-2">Distribución por estado de nacimiento</h2>
                <div v-if="data.byState.length === 0" class="text-sm text-slate-400 italic">Sin datos.</div>
                <div v-else class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm" :style="{ height: stateChartHeight + 'px' }">
                    <Bar :data="stateChartData" :options="stateChartOptions" />
                </div>
            </section>

            <!-- Top municipios -->
            <section>
                <h2 class="text-base font-semibold text-slate-800 mb-2">Top municipios de nacimiento</h2>
                <DataTable
                    :columns="municipalityColumns"
                    :rows="data.topMunicipalities"
                    hide-search
                    caption="Top municipios de nacimiento"
                    empty-text="Sin datos."
                >
                    <template #cell-rank="{ index }">
                        <span class="text-xs text-slate-400 font-mono">{{ index + 1 }}</span>
                    </template>
                    <template #cell-name="{ row }">
                        <span class="font-medium text-slate-700">{{ row.name }}</span>
                    </template>
                    <template #cell-stateName="{ row }">
                        <span class="text-slate-500">{{ row.stateName ?? '—' }}</span>
                    </template>
                    <template #cell-count="{ row }">
                        <span class="tabular-nums font-semibold">{{ row.count }}</span>
                    </template>
                </DataTable>
            </section>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Bar } from 'vue-chartjs'
import {
    Chart as ChartJS,
    Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale,
} from 'chart.js'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import SkeletonChart from '@/app/components/ui/SkeletonChart.vue'
import SkeletonTable from '@/app/components/ui/SkeletonTable.vue'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

interface School        { schoolId: number; name: string; count: number }
interface State         { stateId: number; name: string; count: number }
interface Municipality  { municipalityId: number; name: string; stateName: string | null; count: number }
interface OriginResponse {
    topSchools: School[]
    byState:    State[]
    topMunicipalities: Municipality[]
}

const schoolColumns: DataTableColumn<School>[] = [
    { key: 'rank', label: '#', width: '3rem' },
    { key: 'name', label: 'Escuela' },
    { key: 'count', label: 'Aspirantes', align: 'right' },
]
const municipalityColumns: DataTableColumn<Municipality>[] = [
    { key: 'rank', label: '#', width: '3rem' },
    { key: 'name', label: 'Municipio' },
    { key: 'stateName', label: 'Estado' },
    { key: 'count', label: 'Aspirantes', align: 'right' },
]

const props = defineProps<{ periodId: number | null }>()

const loading = ref(false)
const data    = ref<OriginResponse | null>(null)

async function load() {
    loading.value = true
    try {
        const params = new URLSearchParams()
        if (props.periodId) params.set('academic_period_id', String(props.periodId))
        const { data: res } = await api.get<OriginResponse>(API.ADMISSIONS_API.statistics.originDistribution(params.toString()))
        data.value = res
    } finally {
        loading.value = false
    }
}

watch(() => props.periodId, load, { immediate: true })

const stateChartHeight = computed(() => Math.max(280, (data.value?.byState.length ?? 0) * 28 + 80))

const stateChartData = computed(() => ({
    labels: data.value?.byState.map(s => s.name) ?? [],
    datasets: [{
        label: 'Aspirantes',
        data: data.value?.byState.map(s => s.count) ?? [],
        backgroundColor: 'rgba(20, 184, 166, 0.85)',
        borderRadius: 4,
    }],
}))

const stateChartOptions = computed(() => ({
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
}))
</script>
