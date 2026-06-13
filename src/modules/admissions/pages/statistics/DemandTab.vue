<template>
    <div class="space-y-4">
        <div v-if="loading" class="py-12 text-center text-slate-400 text-sm">Cargando...</div>
        <div v-else-if="!data || data.careers.length === 0" class="py-16 text-center text-slate-400 text-sm">
            No hay aspirantes con oferta seleccionada en este filtro.
        </div>
        <template v-else>
            <p class="text-sm text-slate-500">
                Carreras ordenadas por demanda como <strong>1ª opción</strong>. Se muestran también las elecciones como 2ª y 3ª.
            </p>

            <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm" :style="{ height: chartHeight + 'px' }">
                <Bar :data="chartData" :options="chartOptions" />
            </div>

            <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table class="w-full text-sm">
                    <thead class="bg-slate-100 border-b border-slate-200">
                        <tr>
                            <th scope="col" class="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Carrera</th>
                            <th scope="col" class="px-4 py-2 text-right text-xs font-semibold text-slate-500 uppercase">1ª opción</th>
                            <th scope="col" class="px-4 py-2 text-right text-xs font-semibold text-slate-500 uppercase">2ª opción</th>
                            <th scope="col" class="px-4 py-2 text-right text-xs font-semibold text-slate-500 uppercase">3ª opción</th>
                            <th scope="col" class="px-4 py-2 text-right text-xs font-semibold text-slate-500 uppercase">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="c in data.careers" :key="c.careerId" class="border-t border-slate-100">
                            <td class="px-4 py-2 font-medium text-slate-700">{{ c.name }}</td>
                            <td class="px-4 py-2 text-right tabular-nums">{{ c.opt1 }}</td>
                            <td class="px-4 py-2 text-right tabular-nums">{{ c.opt2 }}</td>
                            <td class="px-4 py-2 text-right tabular-nums">{{ c.opt3 }}</td>
                            <td class="px-4 py-2 text-right tabular-nums font-semibold text-slate-700">{{ c.total }}</td>
                        </tr>
                    </tbody>
                </table>
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

interface CareerRow { careerId: number; name: string; opt1: number; opt2: number; opt3: number; total: number }
interface DemandResponse { careers: CareerRow[] }

const props = defineProps<{ periodId: number | null }>()

const loading = ref(false)
const data    = ref<DemandResponse | null>(null)

async function load() {
    loading.value = true
    try {
        const params = new URLSearchParams()
        if (props.periodId) params.set('academic_period_id', String(props.periodId))
        const { data: res } = await api.get<DemandResponse>(API.ADMISSIONS_API.statistics.offerDemand(params.toString()))
        data.value = res
    } finally {
        loading.value = false
    }
}

watch(() => props.periodId, load, { immediate: true })

const chartHeight = computed(() => Math.max(280, (data.value?.careers.length ?? 0) * 36 + 80))

const chartData = computed(() => ({
    labels: data.value?.careers.map(c => c.name) ?? [],
    datasets: [
        { label: '1ª opción', data: data.value?.careers.map(c => c.opt1) ?? [], backgroundColor: 'rgba(37, 99, 235, 0.85)' },
        { label: '2ª opción', data: data.value?.careers.map(c => c.opt2) ?? [], backgroundColor: 'rgba(99, 102, 241, 0.7)' },
        { label: '3ª opción', data: data.value?.careers.map(c => c.opt3) ?? [], backgroundColor: 'rgba(168, 85, 247, 0.55)' },
    ],
}))

const chartOptions = computed(() => ({
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const } },
    scales: {
        x: { stacked: true, beginAtZero: true, ticks: { precision: 0 } },
        y: { stacked: true },
    },
}))
</script>
