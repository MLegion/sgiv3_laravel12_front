<template>
    <div class="space-y-4">
        <div v-if="loading" class="py-12 text-center text-slate-400 text-sm">Cargando...</div>

        <div v-else-if="!data || data.stats.count === 0" class="py-16 text-center text-slate-400 text-sm">
            No hay calificaciones cargadas para este filtro.
        </div>

        <template v-else>
            <!-- Estadísticas -->
            <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <StatCard label="Total" :value="data.stats.count" color="slate" />
                <StatCard label="Mínima" :value="data.stats.min" color="red" />
                <StatCard label="Máxima" :value="data.stats.max" color="green" />
                <StatCard label="Promedio" :value="data.stats.avg" color="blue" />
                <StatCard label="Mediana" :value="data.stats.median" color="purple" />
            </div>

            <!-- Histograma -->
            <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm" style="height: 360px;">
                <Bar :data="chartData" :options="chartOptions" />
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
import StatCard from './StatCard.vue'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

interface Bin { label: string; from: number; to: number; count: number }
interface Stats { count: number; min: number | null; max: number | null; avg: number | null; median: number | null }
interface ScoreResponse { bins: Bin[]; stats: Stats }

const props = defineProps<{ periodId: number | null }>()

const loading = ref(false)
const data    = ref<ScoreResponse | null>(null)

async function load() {
    loading.value = true
    try {
        const params = new URLSearchParams()
        if (props.periodId) params.set('academic_period_id', String(props.periodId))
        const { data: res } = await api.get<ScoreResponse>(API.ADMISSIONS_API.statistics.scoreDistribution(params.toString()))
        data.value = res
    } finally {
        loading.value = false
    }
}

watch(() => props.periodId, load, { immediate: true })

const chartData = computed(() => ({
    labels: data.value?.bins.map(b => b.label) ?? [],
    datasets: [{
        label: 'Aspirantes',
        data: data.value?.bins.map(b => b.count) ?? [],
        backgroundColor: 'rgba(59, 130, 246, 0.75)',
        borderRadius: 4,
    }],
}))

const chartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        tooltip: {
            callbacks: {
                title: (items: any[]) => `Rango ${items[0].label}`,
                label:  (ctx: any)    => `${ctx.parsed.y} aspirantes`,
            },
        },
    },
    scales: {
        x: { title: { display: true, text: 'Calificación' } },
        y: { beginAtZero: true, ticks: { precision: 0 }, title: { display: true, text: 'Aspirantes' } },
    },
}))
</script>
