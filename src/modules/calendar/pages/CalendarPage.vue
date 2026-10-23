<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between flex-wrap gap-2">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Calendario</h1>
            <p class="text-xs text-slate-400">Fechas de todos los módulos del periodo, en una sola vista.</p>
        </div>

        <!-- Controles: periodo + filtro por módulo (secciones) -->
        <section class="rounded-xl border bg-white p-4 space-y-3">
            <div class="grid sm:grid-cols-4 gap-3 items-end">
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Periodo</label>
                    <select v-model="periodId" @change="loadEvents" class="w-full rounded-lg border-slate-300 text-sm">
                        <option value="">Elegir…</option>
                        <option v-for="p in periods" :key="p.id" :value="p.id">{{ p.name }}</option>
                    </select>
                </div>
            </div>

            <div v-if="sections.length" class="flex flex-wrap gap-2 pt-1">
                <button
                    v-for="s in sections" :key="s.key"
                    @click="toggleModule(s.key)"
                    class="px-3 py-1 rounded-full text-xs font-semibold border transition"
                    :class="isActive(s.key)
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50'">
                    {{ s.label }} <span class="opacity-70">({{ s.count }})</span>
                </button>
            </div>
        </section>

        <!-- Eventos agrupados por mes -->
        <section v-if="periodId" class="rounded-xl border bg-white p-4 space-y-4">
            <p v-if="!visibleEvents.length" class="text-sm text-slate-400">Sin fechas para este periodo.</p>

            <div v-for="group in grouped" :key="group.month" class="space-y-2">
                <h2 class="text-xs font-bold uppercase text-slate-400 border-b pb-1">{{ group.month }}</h2>
                <ul class="space-y-1">
                    <li v-for="(e, i) in group.events" :key="i"
                        class="flex items-start gap-3 py-1.5 px-2 rounded-lg hover:bg-slate-50">
                        <span class="mt-0.5 inline-block w-2.5 h-2.5 rounded-full shrink-0" :style="{ background: colorFor(e.module) }"></span>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="text-sm text-slate-700">{{ e.title }}</span>
                                <span class="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded"
                                    :style="{ background: colorFor(e.module) + '22', color: colorFor(e.module) }">{{ e.type }}</span>
                            </div>
                            <div class="text-xs text-slate-400">
                                {{ e.module_label }} · {{ formatRange(e) }}
                            </div>
                        </div>
                        <RouterLink v-if="e.route" :to="e.route" class="text-xs text-emerald-600 hover:underline shrink-0">abrir</RouterLink>
                    </li>
                </ul>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'

const C = API.CALENDAR_API
const toast = useToast()

type Section = { key: string; label: string; count: number }
type CalEvent = {
    title: string; type: string; module: string; module_label: string
    date?: string; start_date?: string; end_date?: string; route?: string
    meta?: Record<string, unknown>
}

const periods = ref<any[]>([])
const periodId = ref<string>('')
const sections = ref<Section[]>([])
const events = ref<CalEvent[]>([])
const active = reactive<Set<string>>(new Set())

const PALETTE = ['#059669', '#2563eb', '#d97706', '#db2777', '#7c3aed', '#0891b2', '#dc2626', '#65a30d']
function colorFor(moduleKey: string): string {
    const idx = sections.value.findIndex(s => s.key === moduleKey)
    return PALETTE[(idx < 0 ? 0 : idx) % PALETTE.length]
}

function isActive(key: string): boolean {
    return active.size === 0 || active.has(key)
}
function toggleModule(key: string) {
    if (active.has(key)) active.delete(key)
    else active.add(key)
}

const visibleEvents = computed(() =>
    events.value.filter(e => isActive(e.module)),
)

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
function monthKey(e: CalEvent): string {
    const d = e.date ?? e.start_date ?? e.end_date
    if (!d) return 'Sin fecha'
    const [y, m] = d.split('-')
    return `${MONTHS[Number(m) - 1] ?? m} ${y}`
}
const grouped = computed(() => {
    const map = new Map<string, CalEvent[]>()
    for (const e of visibleEvents.value) {
        const k = monthKey(e)
        if (!map.has(k)) map.set(k, [])
        map.get(k)!.push(e)
    }
    return Array.from(map.entries()).map(([month, evs]) => ({ month, events: evs }))
})

function formatRange(e: CalEvent): string {
    const f = (d?: string) => (d ? d.split('-').reverse().join('/') : '')
    if (e.start_date && e.end_date) return `${f(e.start_date)} – ${f(e.end_date)}`
    return f(e.date ?? e.start_date ?? e.end_date)
}

async function loadEvents() {
    events.value = []
    sections.value = []
    if (!periodId.value) return
    try {
        const { data } = await api.get(C.events, { params: { period_id: periodId.value } })
        sections.value = data.sections ?? []
        events.value = data.events ?? []
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo cargar el calendario.')
    }
}

onMounted(async () => {
    const { data } = await api.get(C.periods)
    periods.value = data.periods ?? []
    if (periods.value.length) {
        periodId.value = String(periods.value[0].id)
        await loadEvents()
    }
})
</script>
