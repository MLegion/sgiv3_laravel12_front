<template>
    <div class="space-y-4">
        <div v-if="loading" class="py-12 text-center text-slate-400 text-sm">Cargando...</div>

        <div v-else-if="!data || data.total === 0" class="py-16 text-center text-slate-400 text-sm">
            No hay aspirantes registrados para este filtro.
        </div>

        <template v-else>
            <!-- Header con total -->
            <div class="flex items-baseline gap-3">
                <p class="text-3xl font-bold text-slate-800">{{ data.total }}</p>
                <p class="text-sm text-slate-500">aspirantes registrados</p>
            </div>

            <!-- Gráfica de barras -->
            <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm" style="height: 360px;">
                <Bar :data="chartData" :options="chartOptions" />
            </div>

            <!-- Tabla con porcentajes -->
            <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div class="overflow-x-auto w-full"><table class="w-full text-sm">
                    <thead class="bg-slate-100 border-b border-slate-200">
                        <tr>
                            <th scope="col" class="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Etapa</th>
                            <th scope="col" class="px-4 py-2 text-right text-xs font-semibold text-slate-500 uppercase">Aspirantes</th>
                            <th scope="col" class="px-4 py-2 text-right text-xs font-semibold text-slate-500 uppercase">% acumulado</th>
                            <th scope="col" class="px-4 py-2 text-right text-xs font-semibold text-slate-500 uppercase">Conversión vs etapa anterior</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(s, idx) in data.stages" :key="s.key" class="border-t border-slate-100">
                            <td class="px-4 py-2 font-medium text-slate-700">{{ s.label }}</td>
                            <td class="px-4 py-2 text-right tabular-nums">{{ s.count }}</td>
                            <td class="px-4 py-2 text-right tabular-nums">{{ s.percentage.toFixed(2) }}%</td>
                            <td class="px-4 py-2 text-right tabular-nums text-slate-500">
                                {{ idx === 0 ? '—' : conversionFromPrev(idx) }}
                            </td>
                        </tr>
                    </tbody>
                </table></div>
            </div>
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

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

interface Stage { key: string; label: string; count: number; percentage: number }
interface FunnelResponse { stages: Stage[]; total: number }

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
                    return `${stage.count} (${stage.percentage.toFixed(2)}% del total)`
                },
            },
        },
    },
    scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } },
    },
}))

function conversionFromPrev(idx: number): string {
    if (!data.value) return '—'
    const prev = data.value.stages[idx - 1]?.count ?? 0
    const cur  = data.value.stages[idx]?.count ?? 0
    if (prev === 0) return '—'
    return ((cur / prev) * 100).toFixed(2) + '%'
}
</script>
