<template>
    <div class="space-y-6">
        <div v-if="loading" class="py-12 text-center text-slate-400 text-sm">Cargando...</div>

        <template v-else-if="data">
            <!-- Edad -->
            <section>
                <h2 class="text-base font-semibold text-slate-800 mb-2">Distribución por edad</h2>
                <p class="text-xs text-slate-500 mb-3">
                    Calculada al día de hoy. {{ data.age.totalWithBirthDate }} aspirantes con fecha registrada.
                    <span v-if="data.age.totalMissing > 0" class="text-amber-600">
                        ({{ data.age.totalMissing }} sin fecha de nacimiento.)
                    </span>
                </p>
                <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm" style="height: 320px;">
                    <Bar :data="ageChartData" :options="ageChartOptions" />
                </div>
            </section>

            <!-- Sexo -->
            <section>
                <h2 class="text-base font-semibold text-slate-800 mb-2">Distribución por sexo</h2>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm" style="height: 280px;">
                        <Doughnut :data="sexChartData" :options="sexChartOptions" />
                    </div>
                    <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm self-start">
                        <div class="overflow-x-auto w-full"><table class="w-full text-sm">
                            <thead class="bg-slate-100 border-b border-slate-200">
                                <tr>
                                    <th scope="col" class="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Sexo</th>
                                    <th scope="col" class="px-4 py-2 text-right text-xs font-semibold text-slate-500 uppercase">Cantidad</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="b in data.sex.buckets" :key="b.key" class="border-t border-slate-100">
                                    <td class="px-4 py-2 font-medium text-slate-700">{{ b.label }}</td>
                                    <td class="px-4 py-2 text-right tabular-nums">{{ b.count }}</td>
                                </tr>
                            </tbody>
                        </table></div>
                    </div>
                </div>
            </section>

            <!-- Modalidad de examen -->
            <section>
                <h2 class="text-base font-semibold text-slate-800 mb-2">Modalidad de examen elegida</h2>
                <p class="text-xs text-slate-500 mb-3">
                    Solo aplica cuando el plantel opera en modo <strong>mixto</strong>; en otros modos todos quedan en "No elegida".
                </p>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm" style="height: 280px;">
                        <Doughnut :data="modeChartData" :options="modeChartOptions" />
                    </div>
                    <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm self-start">
                        <div class="overflow-x-auto w-full"><table class="w-full text-sm">
                            <thead class="bg-slate-100 border-b border-slate-200">
                                <tr>
                                    <th scope="col" class="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Modalidad</th>
                                    <th scope="col" class="px-4 py-2 text-right text-xs font-semibold text-slate-500 uppercase">Cantidad</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="b in data.mode.buckets" :key="b.key" class="border-t border-slate-100">
                                    <td class="px-4 py-2 font-medium text-slate-700">{{ b.label }}</td>
                                    <td class="px-4 py-2 text-right tabular-nums">{{ b.count }}</td>
                                </tr>
                            </tbody>
                        </table></div>
                    </div>
                </div>
            </section>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Bar, Doughnut } from 'vue-chartjs'
import {
    Chart as ChartJS,
    Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement,
} from 'chart.js'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement)

interface AgeBucket  { label: string; count: number }
interface SexBucket  { key: string; label: string; count: number }
interface ModeBucket { key: string; label: string; count: number }
interface AgeModeResponse {
    age:  { buckets: AgeBucket[];  totalWithBirthDate: number; totalMissing: number }
    sex:  { buckets: SexBucket[];  total: number }
    mode: { buckets: ModeBucket[]; total: number }
}

const props = defineProps<{ periodId: number | null }>()

const loading = ref(false)
const data    = ref<AgeModeResponse | null>(null)

async function load() {
    loading.value = true
    try {
        const params = new URLSearchParams()
        if (props.periodId) params.set('academic_period_id', String(props.periodId))
        const { data: res } = await api.get<AgeModeResponse>(API.ADMISSIONS_API.statistics.ageAndMode(params.toString()))
        data.value = res
    } finally {
        loading.value = false
    }
}

watch(() => props.periodId, load, { immediate: true })

const ageChartData = computed(() => ({
    labels: data.value?.age.buckets.map(b => b.label) ?? [],
    datasets: [{
        label: 'Aspirantes',
        data: data.value?.age.buckets.map(b => b.count) ?? [],
        backgroundColor: 'rgba(99, 102, 241, 0.85)',
        borderRadius: 4,
    }],
}))

const ageChartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
}))

const sexColors: Record<string, string> = {
    M:    'rgba(37, 99, 235, 0.85)',
    F:    'rgba(236, 72, 153, 0.85)',
    NULL: 'rgba(148, 163, 184, 0.85)',
}

const sexChartData = computed(() => ({
    labels: data.value?.sex.buckets.map(b => b.label) ?? [],
    datasets: [{
        data:            data.value?.sex.buckets.map(b => b.count) ?? [],
        backgroundColor: data.value?.sex.buckets.map(b => sexColors[b.key] ?? 'rgba(100,116,139,0.7)') ?? [],
        borderWidth: 0,
    }],
}))

const sexChartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const } },
}))

const modeColors: Record<string, string> = {
    online:     'rgba(59, 130, 246, 0.85)',
    presencial: 'rgba(168, 85, 247, 0.85)',
    NULL:       'rgba(148, 163, 184, 0.85)',
}

const modeChartData = computed(() => ({
    labels: data.value?.mode.buckets.map(b => b.label) ?? [],
    datasets: [{
        data:            data.value?.mode.buckets.map(b => b.count) ?? [],
        backgroundColor: data.value?.mode.buckets.map(b => modeColors[b.key] ?? 'rgba(100,116,139,0.7)') ?? [],
        borderWidth: 0,
    }],
}))

const modeChartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const } },
}))
</script>
