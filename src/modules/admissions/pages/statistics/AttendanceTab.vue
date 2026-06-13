<template>
    <div class="space-y-4">
        <div v-if="loading" class="py-12 text-center text-slate-400 text-sm">Cargando...</div>
        <div v-else-if="!data || data.total === 0" class="py-16 text-center text-slate-400 text-sm">
            No hay asignaciones de examen presencial registradas.
        </div>
        <template v-else>
            <div class="flex items-baseline gap-3">
                <p class="text-3xl font-bold text-slate-800">{{ data.total }}</p>
                <p class="text-sm text-slate-500">asignaciones a examen presencial</p>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm" style="height: 320px;">
                    <Doughnut :data="chartData" :options="chartOptions" />
                </div>
                <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm self-start">
                    <table class="w-full text-sm">
                        <thead class="bg-slate-100 border-b border-slate-200">
                            <tr>
                                <th scope="col" class="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Estado</th>
                                <th scope="col" class="px-4 py-2 text-right text-xs font-semibold text-slate-500 uppercase">Cantidad</th>
                                <th scope="col" class="px-4 py-2 text-right text-xs font-semibold text-slate-500 uppercase">%</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="b in data.buckets" :key="b.key" class="border-t border-slate-100">
                                <td class="px-4 py-2 font-medium text-slate-700">{{ b.label }}</td>
                                <td class="px-4 py-2 text-right tabular-nums">{{ b.count }}</td>
                                <td class="px-4 py-2 text-right tabular-nums">{{ b.percentage.toFixed(2) }}%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Doughnut } from 'vue-chartjs'
import {
    Chart as ChartJS,
    Title, Tooltip, Legend, ArcElement,
} from 'chart.js'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

ChartJS.register(Title, Tooltip, Legend, ArcElement)

interface Bucket { key: string; label: string; count: number; percentage: number }
interface AttendanceResponse { buckets: Bucket[]; total: number }

const props = defineProps<{ periodId: number | null }>()

const loading = ref(false)
const data    = ref<AttendanceResponse | null>(null)

async function load() {
    loading.value = true
    try {
        const params = new URLSearchParams()
        if (props.periodId) params.set('academic_period_id', String(props.periodId))
        const { data: res } = await api.get<AttendanceResponse>(API.ADMISSIONS_API.statistics.examAttendance(params.toString()))
        data.value = res
    } finally {
        loading.value = false
    }
}

watch(() => props.periodId, load, { immediate: true })

const colorMap: Record<string, string> = {
    PRESENT:    'rgba(16, 185, 129, 0.85)',
    ABSENT:     'rgba(239, 68, 68, 0.85)',
    INCOMPLETE: 'rgba(245, 158, 11, 0.85)',
    PENDING:    'rgba(148, 163, 184, 0.85)',
}

const chartData = computed(() => ({
    labels: data.value?.buckets.map(b => b.label) ?? [],
    datasets: [{
        data:            data.value?.buckets.map(b => b.count) ?? [],
        backgroundColor: data.value?.buckets.map(b => colorMap[b.key] ?? 'rgba(100,116,139,0.7)') ?? [],
        borderWidth: 0,
    }],
}))

const chartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { position: 'bottom' as const },
        tooltip: {
            callbacks: {
                label: (ctx: any) => {
                    const b = data.value?.buckets[ctx.dataIndex]
                    return b ? `${b.label}: ${b.count} (${b.percentage.toFixed(2)}%)` : ''
                },
            },
        },
    },
}))
</script>
