<template>
    <div class="space-y-5">
        <h1 class="text-xl font-semibold text-slate-800 uppercase">Estadísticas de Residencias</h1>

        <div v-if="loading" class="text-sm text-slate-400">Cargando…</div>
        <div v-else-if="!stats || stats.total === 0" class="rounded-lg border bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            Aún no hay residencias registradas.
        </div>

        <template v-else>
            <!-- Tarjetas -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Total" :value="stats.total" color="slate" />
                <StatCard label="En proceso" :value="stats.byStatus.in_progress ?? 0" color="blue" />
                <StatCard label="Concluidas" :value="stats.byStatus.concluded ?? 0" color="green" />
                <div class="rounded-xl border bg-white px-4 py-3 shadow-sm">
                    <p class="text-2xl font-black text-purple-600">{{ approvalPct }}</p>
                    <p class="text-[11px] uppercase mt-0.5 text-purple-400">% Aprobación</p>
                </div>
            </div>

            <div class="grid lg:grid-cols-2 gap-4">
                <div class="bg-white border rounded-xl p-4 shadow-sm">
                    <h2 class="text-xs font-bold text-slate-500 uppercase mb-3">Por estado</h2>
                    <div style="height: 280px;"><Doughnut :data="statusChart" :options="doughnutOpts" /></div>
                </div>
                <div class="bg-white border rounded-xl p-4 shadow-sm">
                    <h2 class="text-xs font-bold text-slate-500 uppercase mb-3">Por modalidad de proyecto</h2>
                    <div style="height: 280px;"><Doughnut :data="modalityChart" :options="doughnutOpts" /></div>
                </div>
                <div class="bg-white border rounded-xl p-4 shadow-sm">
                    <h2 class="text-xs font-bold text-slate-500 uppercase mb-3">Por carrera</h2>
                    <div style="height: 300px;"><Bar :data="careerChart" :options="barOpts" /></div>
                </div>
                <div class="bg-white border rounded-xl p-4 shadow-sm">
                    <h2 class="text-xs font-bold text-slate-500 uppercase mb-3">Top empresas</h2>
                    <div style="height: 300px;"><Bar :data="companyChart" :options="barOptsH" /></div>
                </div>
                <div class="bg-white border rounded-xl p-4 shadow-sm lg:col-span-2">
                    <h2 class="text-xs font-bold text-slate-500 uppercase mb-3">Distribución de calificaciones finales</h2>
                    <div style="height: 280px;"><Bar :data="gradeChart" :options="barOpts" /></div>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Bar, Doughnut } from 'vue-chartjs'
import {
    Chart as ChartJS, Title, Tooltip, Legend, BarElement, ArcElement, CategoryScale, LinearScale,
} from 'chart.js'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import StatCard from '@/modules/admissions/pages/statistics/StatCard.vue'
import type { ResidencyStatistics } from '@/modules/residencies/types/residency.type'

ChartJS.register(Title, Tooltip, Legend, BarElement, ArcElement, CategoryScale, LinearScale)

const R = API.RESIDENCIES_API

const loading = ref(true)
const stats = ref<ResidencyStatistics | null>(null)

const PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6', '#ec4899', '#64748b']

const STATUS_LABELS: Record<string, string> = {
    registered: 'Registrado', in_progress: 'En proceso', concluded: 'Concluido', dropped: 'Baja',
}
const MODALITY_LABELS: Record<string, string> = {
    worker: 'Trabajador', own: 'Propuesta propia', bank: 'Banco', '': 'Sin definir',
}

const approvalPct = computed(() => {
    if (!stats.value) return '—'
    const { passed, failed } = stats.value.approval
    const t = passed + failed
    return t === 0 ? '—' : `${Math.round((passed / t) * 100)}%`
})

const doughnutOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' as const } } }
const barOpts  = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
const barOptsH = { ...barOpts, indexAxis: 'y' as const }

const statusChart = computed(() => {
    const e = Object.entries(stats.value?.byStatus ?? {})
    return {
        labels: e.map(([k]) => STATUS_LABELS[k] ?? k),
        datasets: [{ data: e.map(([, v]) => v), backgroundColor: PALETTE }],
    }
})
const modalityChart = computed(() => {
    const e = Object.entries(stats.value?.byModality ?? {})
    return {
        labels: e.map(([k]) => MODALITY_LABELS[k] ?? k),
        datasets: [{ data: e.map(([, v]) => v), backgroundColor: PALETTE }],
    }
})
const careerChart = computed(() => ({
    labels: (stats.value?.byCareer ?? []).map(c => c.label),
    datasets: [{ label: 'Residentes', data: (stats.value?.byCareer ?? []).map(c => c.count), backgroundColor: '#3b82f6' }],
}))
const companyChart = computed(() => ({
    labels: (stats.value?.byCompany ?? []).map(c => c.label),
    datasets: [{ label: 'Residentes', data: (stats.value?.byCompany ?? []).map(c => c.count), backgroundColor: '#10b981' }],
}))
const gradeChart = computed(() => ({
    labels: ['0-9', '10-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80-89', '90-99', '100'],
    datasets: [{ label: 'Residentes', data: stats.value?.gradeBins ?? [], backgroundColor: '#8b5cf6' }],
}))

async function load() {
    loading.value = true
    try {
        const { data } = await api.get(R.residency.statistics)
        stats.value = data
    } finally { loading.value = false }
}

load()
</script>
