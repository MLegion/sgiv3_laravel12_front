<template>
    <div class="space-y-6">
        <div v-if="loading" class="py-12 text-center text-slate-400 text-sm">Cargando...</div>

        <template v-else-if="data">
            <!-- Top escuelas -->
            <section>
                <h2 class="text-base font-semibold text-slate-800 mb-2">Top escuelas de procedencia</h2>
                <div v-if="data.topSchools.length === 0" class="text-sm text-slate-400 italic">Sin datos.</div>
                <div v-else class="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div class="overflow-x-auto w-full"><table class="w-full text-sm">
                        <thead class="bg-slate-100 border-b border-slate-200">
                            <tr>
                                <th scope="col" class="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase w-12">#</th>
                                <th scope="col" class="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Escuela</th>
                                <th scope="col" class="px-4 py-2 text-right text-xs font-semibold text-slate-500 uppercase">Aspirantes</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(s, idx) in data.topSchools" :key="s.schoolId" class="border-t border-slate-100">
                                <td class="px-4 py-2 text-xs text-slate-400 font-mono">{{ idx + 1 }}</td>
                                <td class="px-4 py-2 font-medium text-slate-700">{{ s.name }}</td>
                                <td class="px-4 py-2 text-right tabular-nums font-semibold">{{ s.count }}</td>
                            </tr>
                        </tbody>
                    </table></div>
                </div>
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
                <div v-if="data.topMunicipalities.length === 0" class="text-sm text-slate-400 italic">Sin datos.</div>
                <div v-else class="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div class="overflow-x-auto w-full"><table class="w-full text-sm">
                        <thead class="bg-slate-100 border-b border-slate-200">
                            <tr>
                                <th scope="col" class="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase w-12">#</th>
                                <th scope="col" class="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Municipio</th>
                                <th scope="col" class="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Estado</th>
                                <th scope="col" class="px-4 py-2 text-right text-xs font-semibold text-slate-500 uppercase">Aspirantes</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(m, idx) in data.topMunicipalities" :key="m.municipalityId" class="border-t border-slate-100">
                                <td class="px-4 py-2 text-xs text-slate-400 font-mono">{{ idx + 1 }}</td>
                                <td class="px-4 py-2 font-medium text-slate-700">{{ m.name }}</td>
                                <td class="px-4 py-2 text-slate-500">{{ m.stateName ?? '—' }}</td>
                                <td class="px-4 py-2 text-right tabular-nums font-semibold">{{ m.count }}</td>
                            </tr>
                        </tbody>
                    </table></div>
                </div>
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

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

interface School        { schoolId: number; name: string; count: number }
interface State         { stateId: number; name: string; count: number }
interface Municipality  { municipalityId: number; name: string; stateName: string | null; count: number }
interface OriginResponse {
    topSchools: School[]
    byState:    State[]
    topMunicipalities: Municipality[]
}

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
