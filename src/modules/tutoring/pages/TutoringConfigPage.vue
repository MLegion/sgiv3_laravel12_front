<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Configuración de Tutorías</h1>
            <p class="text-xs text-slate-400">Ventana de propuestas, umbrales y créditos de tutoría grupal (Cap. 15).</p>
        </div>

        <!-- Pestañas -->
        <div class="border-b border-slate-200 flex gap-1">
            <button v-for="t in TABS" :key="t.k" @click="tab = t.k" :class="tabClass(t.k)">{{ t.label }}</button>
        </div>

        <!-- Ventana de propuesta (por periodo) -->
        <section v-show="tab === 'window'" class="rounded-xl border bg-white p-4 space-y-3">
            <h2 class="text-sm font-bold uppercase text-slate-500">Ventana de propuesta individual</h2>
            <div class="grid sm:grid-cols-4 gap-3 items-end">
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Periodo</label>
                    <select v-model="win.period_id" @change="loadWindow" class="w-full rounded-lg border-slate-300 text-sm">
                        <option value="">Elegir…</option>
                        <option v-for="p in periods" :key="p.id" :value="p.id">{{ p.name }}</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Abre</label>
                    <input v-model="win.opens_at" type="date" class="w-full rounded-lg border-slate-300 text-sm" />
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Cierra</label>
                    <input v-model="win.closes_at" type="date" class="w-full rounded-lg border-slate-300 text-sm" />
                </div>
                <label class="flex items-center gap-2 text-sm text-slate-600 pb-2">
                    <input type="checkbox" v-model="win.is_open" /> Abierta ahora (override)
                </label>
            </div>
            <button @click="saveWindow" :disabled="busy || !win.period_id" class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">Guardar ventana</button>
        </section>

        <!-- Límites / umbrales -->
        <section v-show="tab === 'limits'" class="rounded-xl border bg-white p-4 space-y-3">
            <h2 class="text-sm font-bold uppercase text-slate-500">Límites y umbrales</h2>
            <div class="grid sm:grid-cols-4 gap-3 items-end">
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Semestres con tutoría grupal (X)</label>
                    <input v-model="limits.group_tutoring_max_semester" type="number" min="1" max="20" class="w-full rounded-lg border-slate-300 text-sm" />
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Créditos de la tutoría grupal</label>
                    <input v-model="limits.group_tutoring_credits" type="number" min="0" max="50" class="w-full rounded-lg border-slate-300 text-sm" />
                    <p class="text-[10px] text-slate-400 mt-0.5">Van al libro de créditos de AC (no directo al kardex).</p>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Cupo de tutorados por tutor (individual)</label>
                    <input v-model="limits.max_tutees_per_tutor" type="number" min="0" class="w-full rounded-lg border-slate-300 text-sm" placeholder="0 = sin límite" />
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Mín. recurses para sugerir riesgo</label>
                    <input v-model="limits.risk_min_repeat" type="number" min="1" class="w-full rounded-lg border-slate-300 text-sm" />
                </div>
                <button @click="saveLimits" :disabled="busy" class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">Guardar límites</button>
            </div>
        </section>

        <!-- Calendario de hitos del PAT (fechas por etapa, T-G) -->
        <section v-show="tab === 'schedule'" class="rounded-xl border bg-white p-4 space-y-3">
            <h2 class="text-sm font-bold uppercase text-slate-500">Calendario de hitos del PAT</h2>
            <p class="text-xs text-slate-400">
                Fecha de cada hito del seguimiento por periodo. <b>Abre</b> = antes de esa fecha el tutor no puede
                entregar; <b>Límite</b> = después el plazo vence. Deja vacío para no restringir por fecha.
            </p>
            <div class="grid sm:grid-cols-4 gap-3 items-end">
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Periodo</label>
                    <select v-model="sched.period_id" @change="loadSchedule" class="w-full rounded-lg border-slate-300 text-sm">
                        <option value="">Elegir…</option>
                        <option v-for="p in periods" :key="p.id" :value="p.id">{{ p.name }}</option>
                    </select>
                </div>
            </div>
            <table v-if="sched.period_id && sched.stages.length" class="w-full text-sm">
                <thead><tr class="text-left text-[10px] uppercase text-slate-400 bg-slate-50 border-y">
                    <th class="px-3 py-1">Hito</th><th class="px-3 py-1">Abre</th><th class="px-3 py-1">Límite</th>
                </tr></thead>
                <tbody>
                    <tr v-for="s in sched.stages" :key="s.stage" class="border-b last:border-0">
                        <td class="px-3 py-2 text-slate-600">{{ s.label }}</td>
                        <td class="px-3 py-1"><input v-model="s.opens_at" type="date" class="rounded-lg border-slate-300 text-sm" /></td>
                        <td class="px-3 py-1"><input v-model="s.due_date" type="date" class="rounded-lg border-slate-300 text-sm" /></td>
                    </tr>
                </tbody>
            </table>
            <button v-if="sched.period_id" @click="saveSchedule" :disabled="busy"
                class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">Guardar calendario</button>
        </section>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'

const T = API.TUTORING_API
const toast = useToast()

const periods = ref<any[]>([])
const busy = ref(false)

// Pestañas (un panel por pestaña).
const TABS = [
    { k: 'window', label: 'Ventana de propuesta' },
    { k: 'limits', label: 'Límites y umbrales' },
    { k: 'schedule', label: 'Calendario de hitos' },
] as const
const tab = ref<'window' | 'limits' | 'schedule'>('window')
const tabClass = (t: string) => [
    'px-4 py-2 text-sm font-semibold border-b-2 -mb-px',
    tab.value === t ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-600',
]

const win = reactive({ period_id: '', opens_at: '', closes_at: '', is_open: false })
const limits = reactive({ max_tutees_per_tutor: 0, risk_min_repeat: 1, group_tutoring_max_semester: 1, group_tutoring_credits: 0 })

type ScheduleStage = { stage: string; label: string; order: number; opens_at: string | null; due_date: string | null }
const sched = reactive<{ period_id: string; stages: ScheduleStage[] }>({ period_id: '', stages: [] })

async function loadSchedule() {
    sched.stages = []
    if (!sched.period_id) return
    const { data } = await api.get(T.determination.followupSchedule, { params: { period_id: sched.period_id } })
    sched.stages = (data.stages ?? []).map((s: any) => ({ ...s, opens_at: s.opens_at ?? '', due_date: s.due_date ?? '' }))
}
async function saveSchedule() {
    await act(async () => {
        const { data } = await api.post(T.determination.followupSchedule, {
            period_id: Number(sched.period_id),
            stages: sched.stages.map(s => ({ stage: s.stage, opens_at: s.opens_at || null, due_date: s.due_date || null })),
        })
        sched.stages = (data.stages ?? []).map((s: any) => ({ ...s, opens_at: s.opens_at ?? '', due_date: s.due_date ?? '' }))
        toast.success('Calendario de hitos guardado.')
    })
}

async function fetchOptions() {
    const { data } = await api.get(T.determination.catalog)
    periods.value = data.periods ?? []
}
async function loadWindow() {
    if (!win.period_id) return
    const { data } = await api.get(T.determination.window, { params: { period_id: win.period_id } })
    const w = data.window
    win.opens_at = w?.opens_at ? w.opens_at.substring(0, 10) : ''
    win.closes_at = w?.closes_at ? w.closes_at.substring(0, 10) : ''
    win.is_open = !!w?.is_open
}
async function saveWindow() {
    await act(async () => {
        await api.post(T.determination.window, {
            period_id: Number(win.period_id),
            opens_at: win.opens_at || null,
            closes_at: win.closes_at || null,
            is_open: win.is_open,
        })
        toast.success('Ventana guardada.')
    })
}

async function loadLimits() {
    const { data } = await api.get(T.determination.limits)
    limits.max_tutees_per_tutor = data.max_tutees_per_tutor ?? 0
    limits.risk_min_repeat = data.risk_min_repeat ?? 1
    limits.group_tutoring_max_semester = data.group_tutoring_max_semester ?? 1
    limits.group_tutoring_credits = data.group_tutoring_credits ?? 0
}
async function saveLimits() {
    await act(async () => {
        await api.post(T.determination.limits, {
            max_tutees_per_tutor: Number(limits.max_tutees_per_tutor),
            risk_min_repeat: Number(limits.risk_min_repeat),
            group_tutoring_max_semester: Number(limits.group_tutoring_max_semester),
            group_tutoring_credits: Number(limits.group_tutoring_credits),
        })
        toast.success('Límites guardados.')
        await loadLimits()
    })
}

async function act(fn: () => Promise<void>) {
    busy.value = true
    try { await fn() }
    catch (e: any) { toast.error(e?.response?.data?.message ?? 'Operación no permitida.') }
    finally { busy.value = false }
}

onMounted(async () => { await Promise.all([fetchOptions(), loadLimits()]) })
</script>
