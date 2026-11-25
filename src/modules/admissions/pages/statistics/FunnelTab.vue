<template>
    <div class="space-y-4">
        <template v-if="loading">
            <SkeletonChart :height="360" />
            <SkeletonTable :rows="5" :cols="4" />
        </template>

        <div v-else-if="!data || data.total === 0" class="py-16 text-center text-slate-400 text-sm">
            No hay aspirantes registrados para este filtro.
        </div>

        <template v-else>
            <!-- Header con total -->
            <div class="flex items-baseline gap-3">
                <p class="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800">{{ data.total }}</p>
                <p class="text-sm text-slate-500">aspirantes registrados</p>
            </div>

            <!-- Gráfica de barras -->
            <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm" style="height: 360px;">
                <Bar :data="chartData" :options="chartOptions" />
            </div>

            <!-- Tabla con porcentajes -->
            <DataTable
                :columns="columns"
                :rows="data.stages"
                hide-search
                caption="Embudo de admisión"
            >
                <template #cell-label="{ row }">
                    <span class="font-medium text-slate-700">{{ row.label }}</span>
                </template>
                <template #cell-count="{ row }">
                    <span class="tabular-nums">{{ row.count }}</span>
                </template>
                <template #cell-percentage="{ row }">
                    <span class="tabular-nums">{{ row.percentage.toFixed(2) }}%</span>
                </template>
                <template #cell-conversion="{ index }">
                    <span class="tabular-nums text-slate-500">{{ index === 0 ? '—' : conversionFromPrev(index) }}</span>
                </template>
            </DataTable>
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

interface Stage { key: string; label: string; count: number; reached: number; percentage: number }
interface FunnelResponse { stages: Stage[]; total: number }

const columns: DataTableColumn<Stage>[] = [
    { key: 'label', label: 'Etapa' },
    { key: 'count', label: 'Aspirantes en esta etapa', align: 'right' },
    { key: 'percentage', label: '% del total', align: 'right' },
    { key: 'conversion', label: 'Conversión vs etapa anterior', align: 'right' },
]

const props = defineProps<{ periodId: number | null }>()

const loading = ref(false)
const data    = ref<FunnelResponse | null>(null)

async function load() {
    loading.value = true
    try {
        const params = new URLSearchParams()
        if (props.periodId) params.set('academic_period_id', String(props.periodId))
        const { data: res } = await api.get<FunnelResponse>(API.ADMISSIONS_API.statistics.funnel(params.toString()))
        data.value = res
    } finally {
        loading.value = false
    }
}

watch(() => props.periodId, load, { immediate: true })

const chartData = computed(() => ({
    labels: data.value?.stages.map(s => s.label) ?? [],
    datasets: [{
        label: 'Aspirantes',
        data: data.value?.stages.map(s => s.count) ?? [],
        backgroundColor: [
            'rgba(99, 102, 241, 0.85)',
            'rgba(168, 85, 247, 0.85)',
            'rgba(59, 130, 246, 0.85)',
            'rgba(245, 158, 11, 0.85)',
            'rgba(16, 185, 129, 0.85)',
            'rgba(20, 184, 166, 0.85)',
        ],
        borderRadius: 6,
    }],
}))

const chartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        tooltip: {
            callbacks: {
                label: (ctx: any) => {
                    const stage = data.value?.stages[ctx.dataIndex]
                    if (!stage) return ''
                    return `${stage.count} en esta etapa (${stage.percentage.toFixed(2)}% del total)`
                },
            },
        },
    },
    scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } },
    },
}))

// Conversión = retención entre etapas, calculada sobre el ACUMULADO (reached):
// qué proporción de quienes llegaron a la etapa anterior alcanzó también ésta.
function conversionFromPrev(idx: number): string {
    if (!data.value) return '—'
    const prev = data.value.stages[idx - 1]?.reached ?? 0
    const cur  = data.value.stages[idx]?.reached ?? 0
    if (prev === 0) return '—'
    return ((cur / prev) * 100).toFixed(2) + '%'
}
</script>
