<template>
    <div class="space-y-5">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Concentrado de Tutorías</h1>
            <p class="text-xs text-slate-400">Indicadores de coordinación del PIT (Cap. 15).</p>
        </div>

        <!-- Filtros -->
        <div class="rounded-xl border bg-white p-4 grid sm:grid-cols-3 gap-3">
            <select v-model="filters.period_id" class="rounded-lg border-slate-300 text-sm">
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
                <table class="w-full text-sm mt-2">
                    <thead><tr class="text-left text-[10px] uppercase text-slate-400 bg-slate-50 border-y">
                        <th class="px-4 py-2">Tutor</th><th>Ámbito</th><th>Carrera</th><th>PAT</th><th>Tutorados</th><th>Sesiones</th><th>Seguim. (E/R)</th><th>Cumpl.</th>
                    </tr></thead>
                    <tbody>
                        <tr v-for="r in d.tutor_compliance" :key="r.assignment_id" class="border-b last:border-0">
                            <td class="px-4 py-2 font-semibold text-slate-700">{{ r.tutor_name }}</td>
                            <td class="text-slate-600">{{ r.scope === 'grupal' ? 'Grupal' : 'Individual' }}</td>
                            <td class="text-slate-600">{{ r.career_name ?? '—' }}</td>
                            <td><span :class="r.has_pat ? 'text-emerald-600' : 'text-rose-500'">{{ r.has_pat ? 'Sí' : 'No' }}</span></td>
                            <td class="text-slate-600">{{ r.tutees_total }}</td>
                            <td class="text-slate-600">{{ r.session_count }}</td>
                            <td class="text-slate-600">{{ r.followups_submitted }}/{{ r.followups_reviewed }}</td>
                            <td><span class="px-2 py-0.5 rounded-full text-[11px] font-bold" :class="r.completion_status === 'confirmed' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'">{{ r.completion_status === 'confirmed' ? 'Confirmado' : 'Pendiente' }}</span></td>
                        </tr>
                        <tr v-if="!d.tutor_compliance.length"><td colspan="8" class="px-4 py-6 text-center text-slate-400">Sin asignaciones.</td></tr>
                    </tbody>
                </table>
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

ChartJS.register(Title, Tooltip, Legend, ArcElement, BarElement, CategoryScale, LinearScale)

const T = API.TUTORING_API

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
    const { data } = await api.get(T.assignments.filterOptions)
    options.periods = data.periods ?? []
}
async function load() {
    const { data } = await api.get(T.dashboard, { params: { period_id: filters.period_id || undefined } })
    d.value = data
}

onMounted(async () => { await Promise.all([fetchOptions(), load()]) })
</script>
