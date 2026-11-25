<template>
    <div class="space-y-5">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Concentrado de Tutorías</h1>
            <p class="text-xs text-slate-400">Indicadores de coordinación del PIT (Cap. 15).</p>
        </div>

        <!-- Filtros -->
        <div class="rounded-xl border bg-white p-4 grid sm:grid-cols-3 gap-3">
            <select v-model="filters.period_id" @change="load" aria-label="Filtrar por periodo" class="rounded-lg border-slate-300 text-sm">
                <option value="">Todos los periodos</option>
                <option v-for="p in options.periods" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
            <button @click="load" class="px-4 py-2 rounded-lg border text-sm font-semibold text-slate-600">Actualizar</button>
        </div>

        <template v-if="d">
            <!-- Tarjetas -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat label="Asignaciones" :value="d.summary.assignments.total" color="slate" />
                <Stat label="Tutorados" :value="d.summary.tutees.total" color="blue" />
                <Stat label="Sesiones" :value="d.summary.sessions" color="indigo" />
                <Stat label="Con PAT" :value="d.summary.assignments.with_pat" color="emerald" />
                <Stat label="Cumplimiento (tutor)" :value="d.summary.assignments.completion_confirmed" color="emerald" />
                <Stat label="Canalizaciones" :value="d.summary.referrals.total" color="amber" />
                <Stat label="Seguim. entregados" :value="d.summary.followups.submitted + d.summary.followups.reviewed" color="violet" />
                <Stat label="Propuestas confirmadas" :value="d.summary.proposals.confirmed" color="teal" />
            </div>

            <!-- Gráficas -->
            <div class="grid md:grid-cols-2 gap-4">
                <div class="bg-white border rounded-xl p-4" style="height: 300px;">
                    <h3 class="text-xs font-bold uppercase text-slate-500 mb-2">Asignaciones por ámbito</h3>
                    <Doughnut :data="scopeChart" :options="opts" />
                </div>
                <div class="bg-white border rounded-xl p-4" style="height: 300px;">
                    <h3 class="text-xs font-bold uppercase text-slate-500 mb-2">Canalizaciones por estado</h3>
                    <Bar :data="referralChart" :options="barOpts" />
                </div>
            </div>

            <!-- Cumplimiento por tutor -->
            <div class="rounded-xl border bg-white overflow-hidden">
                <h3 class="text-xs font-bold uppercase text-slate-500 px-4 pt-3">Cumplimiento por tutor</h3>
                <DataTable :columns="columns" :rows="d.tutor_compliance" hide-search caption="Cumplimiento por tutor" empty-text="Sin asignaciones." class="mt-2">
                    <template #cell-tutor_name="{ row }"><span class="font-semibold text-slate-700">{{ row.tutor_name }}</span></template>
                    <template #cell-scope="{ row }"><span class="text-slate-600">{{ row.scope === 'grupal' ? 'Grupal' : 'Individual' }}</span></template>
                    <template #cell-career_name="{ row }"><span class="text-slate-600">{{ row.career_name ?? '—' }}</span></template>
                    <template #cell-has_pat="{ row }"><span :class="row.has_pat ? 'text-emerald-600' : 'text-rose-500'">{{ row.has_pat ? 'Sí' : 'No' }}</span></template>
                    <template #cell-tutees_total="{ row }"><span class="text-slate-600">{{ row.tutees_total }}</span></template>
                    <template #cell-session_count="{ row }"><span class="text-slate-600">{{ row.session_count }}</span></template>
                    <template #cell-followups="{ row }"><span class="text-slate-600">{{ row.followups_submitted }}/{{ row.followups_reviewed }}</span></template>
                    <template #cell-completion_status="{ row }"><span class="px-2 py-0.5 rounded-full text-[11px] font-bold" :class="row.completion_status === 'confirmed' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'">{{ row.completion_status === 'confirmed' ? 'Confirmado' : 'Pendiente' }}</span></template>
                </DataTable>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h, defineComponent } from 'vue'
import { Doughnut, Bar } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, BarElement, CategoryScale, LinearScale } from 'chart.js'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'

ChartJS.register(Title, Tooltip, Legend, ArcElement, BarElement, CategoryScale, LinearScale)

const T = API.TUTORING_API

const columns: DataTableColumn<any>[] = [
    { key: 'tutor_name', label: 'Tutor' },
    { key: 'scope', label: 'Ámbito' },
    { key: 'career_name', label: 'Carrera' },
    { key: 'has_pat', label: 'PAT' },
    { key: 'tutees_total', label: 'Tutorados' },
    { key: 'session_count', label: 'Sesiones' },
    { key: 'followups', label: 'Seguim. (E/R)' },
    { key: 'completion_status', label: 'Cumpl.' },
]

const Stat = defineComponent({
    props: { label: String, value: [Number, String], color: { type: String, default: 'slate' } },
    setup: (p) => () => h('div', { class: 'bg-white border rounded-xl p-3' }, [
        h('p', { class: `text-2xl font-bold text-${p.color}-600` }, String(p.value ?? 0)),
        h('p', { class: 'text-[11px] uppercase text-slate-400 font-semibold' }, p.label),
    ]),
})

const d = ref<any>(null)
const options = reactive<{ periods: any[] }>({ periods: [] })
const filters = reactive({ period_id: '' })

const opts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' as const } } }
const barOpts = { ...opts, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }

const scopeChart = computed(() => ({
    labels: ['Grupal', 'Individual'],
    datasets: [{ data: [d.value?.summary.assignments.grupal ?? 0, d.value?.summary.assignments.individual ?? 0], backgroundColor: ['#6366f1', '#14b8a6'] }],
}))
const referralChart = computed(() => {
    const r = d.value?.summary.referrals ?? {}
    return {
        labels: ['Abiertas', 'En proceso', 'Atendidas', 'Cerradas'],
        datasets: [{ data: [r.open ?? 0, r.in_progress ?? 0, r.attended ?? 0, r.closed ?? 0], backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#64748b'] }],
    }
})

async function fetchOptions() {
    // Catálogo del plantel: TODOS los periodos + el activo (para preseleccionarlo).
    const { data } = await api.get(T.determination.catalog)
    options.periods = data.periods ?? []
    if (data.active_period_id != null) {
        filters.period_id = data.active_period_id
    }
}
async function load() {
    const { data } = await api.get(T.dashboard, { params: { period_id: filters.period_id || undefined } })
    d.value = data
}

onMounted(async () => {
    await fetchOptions()   // primero resuelve el periodo activo…
    await load()           // …y carga el concentrado ya con ese periodo.
})
</script>
