<template>
    <div class="space-y-3">
        <div v-if="loading" class="text-sm text-slate-500">Calculando fechas de clase…</div>

        <template v-else-if="data">
            <!-- Encabezado -->
            <div class="border border-slate-300 rounded-lg overflow-hidden text-sm">
                <div class="grid grid-cols-1 md:grid-cols-2">
                    <div class="px-3 py-2 border-b border-slate-200 md:border-r">
                        <span class="text-slate-500">Docente:</span>
                        <span class="font-medium ml-1">{{ data.header.teacherName || '—' }}</span>
                    </div>
                    <div class="px-3 py-2 border-b border-slate-200 flex gap-6">
                        <span><span class="text-slate-500">Clave:</span> <span class="font-medium">{{ data.header.subjectCode }}</span></span>
                        <span><span class="text-slate-500">Grupo:</span> <span class="font-medium">{{ data.header.groupName }}</span></span>
                    </div>
                    <div class="px-3 py-2 md:border-r border-slate-200">
                        <span class="text-slate-500">Asignatura:</span>
                        <span class="font-medium ml-1">{{ data.header.subjectName }}</span>
                    </div>
                    <div class="px-3 py-2 flex gap-6">
                        <span><span class="text-slate-500">Inicio del sem.:</span> <span class="font-medium">{{ fmt(data.range.start) }}</span></span>
                        <span><span class="text-slate-500">Fin de clases:</span> <span class="font-medium">{{ fmt(data.range.end) }}</span></span>
                    </div>
                </div>
                <div v-if="data.vacaciones.length || data.suspensiones.length" class="grid grid-cols-1 md:grid-cols-2 border-t border-slate-200">
                    <div class="px-3 py-2 md:border-r border-slate-200">
                        <span class="text-amber-700 font-medium">Vacaciones:</span>
                        <span v-if="!data.vacaciones.length" class="text-slate-400 ml-1">—</span>
                        <span v-for="(v, i) in data.vacaciones" :key="i" class="ml-1 text-xs bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                            {{ fmt(v.start) }}–{{ fmt(v.end) }}
                        </span>
                    </div>
                    <div class="px-3 py-2">
                        <span class="text-rose-700 font-medium">Suspensiones:</span>
                        <span v-if="!data.suspensiones.length" class="text-slate-400 ml-1">—</span>
                        <span v-for="(s, i) in data.suspensiones" :key="i" class="ml-1 text-xs bg-rose-50 border border-rose-200 rounded px-1.5 py-0.5" :title="s.label || ''">
                            {{ fmt(s.start) }}–{{ fmt(s.end) }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Mensaje si no hay calendario/horario -->
            <div v-if="data.message" class="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                {{ data.message }}
            </div>

            <!-- Barra de selección de rango (modo selectable) -->
            <div v-if="selectable" class="flex flex-wrap items-center gap-3 text-sm bg-blue-50 border border-blue-200 rounded px-3 py-2">
                <span class="text-slate-600">
                    Rango:
                    <span class="font-semibold">{{ selStart ? fmt(selStart) : '—' }}</span>
                    →
                    <span class="font-semibold">{{ selEnd ? fmt(selEnd) : '—' }}</span>
                </span>
                <span v-if="selStart && selEnd" class="text-slate-600">
                    <span class="font-semibold">{{ rangeSummary.sessions }}</span> sesiones ·
                    ≈ <span class="font-semibold">{{ rangeSummary.hours }}</span> h
                </span>
                <span v-else class="text-slate-500 text-xs">Clic en una fecha de inicio y luego en la de término.</span>
                <button v-if="selStart" type="button" class="text-xs text-blue-600 hover:text-blue-800 ml-auto" @click="clearRange">Limpiar</button>
            </div>

            <!-- Cuadrícula de sesiones -->
            <div v-if="data.weeks.length" class="overflow-x-auto">
                <table class="border-collapse text-sm">
                    <thead>
                        <tr class="bg-slate-100 text-slate-600">
                            <th scope="col" class="border border-slate-300 px-2 py-1 w-12">Sem</th>
                            <th scope="col" v-for="d in columns" :key="d" class="border border-slate-300 px-2 py-1 w-28"
                                :class="isClassDay(d) ? '' : 'text-slate-400 font-normal'">
                                {{ WD[d] }}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="w in data.weeks" :key="w.week">
                            <td class="border border-slate-300 px-2 py-1 text-center text-slate-500 font-medium">{{ w.week }}</td>
                            <td v-for="d in columns" :key="d" class="border border-slate-300 px-2 py-1 text-center" :class="cellClass(w.days[d])"
                                :role="isPickable(w.days[d]) ? 'button' : undefined"
                                :tabindex="isPickable(w.days[d]) ? 0 : undefined"
                                @click="onCellClick(w.days[d])"
                                @keydown.enter.prevent="onCellClick(w.days[d])">
                                <template v-if="w.days[d]">
                                    <div class="font-medium">{{ fmt(w.days[d].date) }}</div>
                                    <div v-if="selectable && w.days[d].enabled && rangeLabelAt(w.days[d].date)" class="text-[10px] font-semibold text-slate-600">
                                        {{ rangeLabelAt(w.days[d].date) }}
                                    </div>
                                    <div v-else-if="w.days[d].enabled" class="text-[11px] text-emerald-700">S{{ w.days[d].session }}</div>
                                    <div v-else class="text-[11px] uppercase" :class="w.days[d].excludedKind === 'vacaciones' ? 'text-amber-700' : 'text-rose-700'">
                                        {{ w.days[d].excludedKind === 'vacaciones' ? 'Vacac.' : 'Susp.' }}
                                    </div>
                                </template>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <p class="text-xs text-slate-500 mt-2">Total de sesiones de clase: <span class="font-semibold">{{ data.totalSessions }}</span></p>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

const props = defineProps<{
    teacherAssignmentId: number
    /** Modo selector de rango de fechas (para las fechas de una unidad). */
    selectable?: boolean
    /** Rango pre-seleccionado (YYYY-MM-DD). */
    start?: string | null
    end?: string | null
    /** Primera fecha permitida — las anteriores (ocupadas por unidades previas) se bloquean. */
    minDate?: string | null
    /** Última fecha permitida — las posteriores (ocupadas por unidades siguientes) se bloquean. */
    maxDate?: string | null
    /** Rangos de otras unidades a pintar (solo lectura) para ver la distribución del semestre. */
    ranges?: { start: string; end: string; label: string }[]
}>()

const emit = defineEmits<{
    (e: 'range-change', payload: { start: string | null; end: string | null; sessions: number; hours: number }): void
}>()

// Columnas: todos los días activos de la modalidad; si no hay, los días de clase.
const columns = computed<number[]>(() => {
    const mod = data.value?.modalityWeekdays ?? []
    return (mod.length ? mod : (data.value?.weekdays ?? [])) as number[]
})
function isClassDay(dow: number): boolean {
    return (data.value?.weekdays ?? []).includes(dow)
}

const WD: Record<number, string> = { 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb', 7: 'Dom' }
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

const loading = ref(false)
const data = ref<any>(null)

function fmt(d: string | null): string {
    if (!d) return '—'
    const [, m, day] = d.split('-')
    return `${day}-${MESES[Number(m) - 1]}`
}

/* ── Selección de rango (modo selectable) ── */

const selStart = ref<string | null>(props.start ?? null)
const selEnd = ref<string | null>(props.end ?? null)
watch(() => [props.start, props.end], () => {
    selStart.value = props.start ?? null
    selEnd.value = props.end ?? null
})

function isBlocked(date: string): boolean {
    if (props.minDate && date < props.minDate) return true
    if (props.maxDate && date > props.maxDate) return true
    return false
}
function isPickable(cell: any): boolean {
    return !!props.selectable && !!cell && cell.enabled && !isBlocked(cell.date) && rangeIndexAt(cell.date) < 0
}
function inRange(date: string): boolean {
    return !!selStart.value && !!selEnd.value && date >= selStart.value && date <= selEnd.value
}

function onCellClick(cell: any): void {
    if (!isPickable(cell)) return
    const date = cell.date as string
    if (!selStart.value || (selStart.value && selEnd.value)) {
        // Nueva selección: fija inicio.
        selStart.value = date
        selEnd.value = null
    } else if (date >= selStart.value) {
        selEnd.value = date
        emitRange()
    } else {
        // Clic antes del inicio: reinicia con esa fecha.
        selStart.value = date
        selEnd.value = null
    }
}

function clearRange(): void {
    selStart.value = null
    selEnd.value = null
    emit('range-change', { start: null, end: null, sessions: 0, hours: 0 })
}

/** Sesiones y horas de clase dentro del rango, según el horario real. */
const rangeSummary = computed<{ sessions: number; hours: number }>(() => {
    if (!selStart.value || !selEnd.value || !data.value) return { sessions: 0, hours: 0 }
    const hoursByWd: Record<number, number> = data.value.hoursByWeekday ?? {}
    // Horarios POR FECHA (semiescolarizado): horas exactas de cada fecha.
    const hoursByDate: Record<string, number> = data.value.hoursByDate ?? {}
    let sessions = 0
    let hours = 0
    for (const w of data.value.weeks ?? []) {
        for (const [dow, cell] of Object.entries(w.days as Record<string, any>)) {
            if (!cell?.enabled) continue
            if (cell.date < selStart.value || cell.date > selEnd.value) continue
            sessions++
            hours += Number(hoursByDate[cell.date] ?? hoursByWd[Number(dow)] ?? 0)
        }
    }
    return { sessions, hours: Math.round(hours * 10) / 10 }
})

function emitRange(): void {
    emit('range-change', {
        start: selStart.value,
        end: selEnd.value,
        sessions: rangeSummary.value.sessions,
        hours: rangeSummary.value.hours,
    })
}

/* Paleta para pintar los rangos de otras unidades (por índice, estable). */
const RANGE_COLORS = ['bg-amber-100', 'bg-violet-100', 'bg-pink-100', 'bg-cyan-100', 'bg-lime-100', 'bg-orange-100']

function rangeIndexAt(date: string): number {
    return (props.ranges ?? []).findIndex((r) => r.start && r.end && date >= r.start && date <= r.end)
}
function rangeLabelAt(date: string): string | null {
    const i = rangeIndexAt(date)
    return i >= 0 ? props.ranges![i]!.label : null
}

function cellClass(cell: any): string {
    if (!cell) return 'bg-slate-50'
    if (!cell.enabled) return cell.excludedKind === 'vacaciones' ? 'bg-amber-100' : 'bg-rose-100'
    if (props.selectable) {
        if (cell.date === selStart.value || cell.date === selEnd.value) return 'bg-blue-500 text-white cursor-pointer'
        if (inRange(cell.date)) return 'bg-blue-100 cursor-pointer'
        const ri = rangeIndexAt(cell.date)
        if (ri >= 0) return `${RANGE_COLORS[ri % RANGE_COLORS.length]} cursor-not-allowed`
        if (isBlocked(cell.date)) return 'bg-slate-100 text-slate-400 cursor-not-allowed'
        return 'bg-emerald-50 cursor-pointer hover:bg-blue-50'
    }
    return 'bg-emerald-50'
}

async function load() {
    if (!props.teacherAssignmentId) return
    loading.value = true
    try {
        const res = await api.get(API.TEACHING_API.instrumentations.calendar(props.teacherAssignmentId))
        data.value = res.data
    } finally {
        loading.value = false
    }
}

onMounted(load)
watch(() => props.teacherAssignmentId, load)
</script>
