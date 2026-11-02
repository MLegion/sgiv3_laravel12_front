<template>
    <div class="overflow-x-auto border-2 border-slate-800 bg-white">
        <div class="relative grid min-w-[760px]" :style="gridStyle">
            <!-- Header (fila 1) -->
            <div class="px-2 py-2 border-b-2 border-slate-800 bg-slate-50 text-[11px] font-black uppercase text-slate-600 text-center"
                style="grid-column: 1; grid-row: 1;">Asign. / H. Desc.</div>
            <div class="px-2 py-2 border-b-2 border-l-2 border-slate-800 bg-slate-50 text-[11px] font-black uppercase text-slate-600 text-center"
                style="grid-column: 2; grid-row: 1;">Días / Horas</div>
            <div v-for="(c, ci) in columns" :key="'h' + c.v"
                class="px-2 py-2 border-b-2 border-l-2 border-slate-800 bg-slate-50 text-[11px] font-black uppercase text-slate-600 text-center"
                :style="{ gridColumn: ci + 3, gridRow: 1 }">{{ c.label }}</div>

            <!-- Columna 1: la actividad (ocupa todas las filas de slots) -->
            <div class="border-r-2 border-slate-800 p-2 align-top" :style="{ gridColumn: 1, gridRow: `2 / span ${hourSlots.length}` }">
                <div v-if="palette" class="rounded-md bg-emerald-500 text-white p-2 shadow select-none">
                    <p class="text-[11px] font-bold leading-tight">{{ palette.label }}</p>
                    <p class="text-[10px] opacity-90 mt-1">{{ clickHint }}</p>
                </div>
                <p v-else class="text-[11px] text-slate-300 text-center mt-2">SIN ASIGNACIONES</p>
            </div>

            <!-- Columna 2: etiquetas de hora -->
            <div v-for="(slot, ri) in hourSlots" :key="'hr' + slot.start"
                class="border-b border-r-2 border-slate-800 flex items-center justify-center text-center bg-white"
                :style="{ gridColumn: 2, gridRow: ri + 2, height: ROW_H + 'px' }">
                <div class="text-[10px] font-bold text-slate-500 leading-tight">
                    <div>{{ slot.startTime }}</div><div>-</div><div>{{ slot.endTime }}</div>
                </div>
            </div>

            <!-- Celdas de fondo (día × hora): clicables si están libres -->
            <template v-for="(slot, ri) in hourSlots">
                <div v-for="(c, ci) in columns" :key="'cell' + c.v + '-' + slot.start"
                    class="border-b border-l-2 border-slate-800 transition"
                    :class="clickToPlace && cellEmpty(c.v, slot) ? 'cursor-pointer hover:bg-emerald-50/50' : (cellEmpty(c.v, slot) ? '' : 'bg-slate-50/40')"
                    :style="{ gridColumn: ci + 3, gridRow: ri + 2, height: ROW_H + 'px' }"
                    @click="clickToPlace && cellEmpty(c.v, slot) && $emit('cell', { day_of_week: c.v, start_hour: slot.start, start_time: slot.startTime })"></div>
            </template>

            <!-- Ocupación del grupo (read-only), abarca sus filas -->
            <div v-for="(o, oi) in occupancyBlocks" :key="'occ' + oi"
                class="m-0.5 rounded px-1 py-0.5 border-l-2 overflow-hidden pointer-events-none z-10"
                :class="dimClass(o.dimension)" :style="spanStyle(o)"
                :title="`${dimsLabel(o)}: ${o.label}`">
                <p class="text-[9px] font-semibold leading-tight truncate">{{ o.label }}</p>
                <p class="text-[8px] opacity-70 truncate">{{ dimsLabel(o) }}</p>
            </div>

            <!-- Bloques colocados de la actividad, abarcan sus filas -->
            <div v-for="b in placedBlocks" :key="'pb' + b.i"
                class="m-0.5 rounded-md bg-emerald-100 border-2 border-emerald-500 px-1 py-1 overflow-hidden flex flex-col items-center justify-center text-center z-20"
                :style="spanStyle(b)">
                <p class="text-[10px] font-bold text-emerald-800 leading-tight truncate w-full">{{ paletteShort }}</p>
                <p class="text-[9px] text-emerald-700 leading-tight">{{ b.start_time }}–{{ b.end_time }}</p>
                <p v-if="b.place_name" class="text-[8px] text-emerald-600 truncate w-full">{{ b.place_name }}</p>
                <button v-if="editable" @click.stop="$emit('remove', b.i)" class="mt-0.5 text-[11px] text-rose-500 hover:text-rose-700 leading-none">🗑</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Col { v: number; label: string }
interface Block { day_of_week: number; start_time: string; end_time: string; label?: string; source?: string; dimension?: string; dimensions?: string[]; place_name?: string | null }

const props = withDefaults(defineProps<{
    columns: Col[]
    placed: any[]
    occupancy?: Block[]
    palette?: { label: string; hours: number } | null
    startHour?: number
    endHour?: number
    editable?: boolean
    clickToPlace?: boolean
}>(), {
    occupancy: () => [],
    palette: null,
    startHour: 7,
    endHour: 21,
    editable: true,
    clickToPlace: false,
})

defineEmits<{
    cell: [{ day_of_week: number; start_hour: number; start_time: string }]
    remove: [number]
}>()

const ROW_H = 54
const pad = (n: number) => String(n).padStart(2, '0')
const clickHint = computed(() => (props.clickToPlace ? 'Haz clic en una celda libre →' : ''))
const paletteShort = computed(() => props.palette?.label ?? '')

const hourSlots = computed(() =>
    Array.from({ length: props.endHour - props.startHour }, (_, i) => {
        const h = props.startHour + i
        return { start: h, startTime: `${pad(h)}:00`, endTime: `${pad(h + 1)}:00` }
    }),
)

const gridStyle = computed(() => ({
    gridTemplateColumns: `140px 54px repeat(${props.columns.length}, minmax(110px, 1fr))`,
    gridTemplateRows: `auto repeat(${hourSlots.value.length}, ${ROW_H}px)`,
}))

function parseTime(t: string): number { const [h, m] = String(t || '0:0').split(':').map(Number); return (h || 0) * 60 + (m || 0) }

// Posición de un bloque {day_of_week, start_time, end_time} en el CSS grid: columna
// del día + filas que abarca (grid-row start / span).
function spanStyle(b: any) {
    const ci = props.columns.findIndex(c => c.v === b.day_of_week)
    if (ci < 0) return { display: 'none' }
    const s = parseTime(b.start_time)
    const e = parseTime(b.end_time)
    const startRow = Math.floor(s / 60 - props.startHour) + 2
    const span = Math.max(1, Math.round((e - s) / 60))
    return { gridColumn: String(ci + 3), gridRow: `${startRow} / span ${span}` }
}

const occupancyBlocks = computed(() => props.occupancy.filter(o => o.start_time && o.end_time && props.columns.some(c => c.v === o.day_of_week)))
const placedBlocks = computed(() => props.placed.map((b: any, i: number) => ({ ...b, i })).filter((b: any) => b.start_time && b.end_time))

// Celda libre = sin ocupación del grupo ni bloque colocado que la cubra.
function covers(b: any, dayV: number, hour: number): boolean {
    if (b.day_of_week !== dayV) return false
    const s = parseTime(b.start_time), e = parseTime(b.end_time)
    return s <= hour * 60 && e > hour * 60
}
function cellEmpty(dayV: number, slot: { start: number }) {
    return !props.occupancy.some(o => covers(o, dayV, slot.start)) && !props.placed.some(b => covers(b, dayV, slot.start))
}

const DIM_LABELS: Record<string, string> = { teacher: 'Docente', place: 'Aula', group: 'Grupo' }
const dimLabel = (d?: string) => (d ? (DIM_LABELS[d] ?? d) : '')
const dimsLabel = (o: any) => {
    const ds: string[] = Array.isArray(o?.dimensions) && o.dimensions.length ? o.dimensions : [o?.dimension]
    return ds.map((d: string) => dimLabel(d)).join(' · ')
}
const DIM_CLASS: Record<string, string> = {
    teacher: 'bg-sky-100/80 border-sky-400 text-sky-700',
    place: 'bg-slate-200/70 border-slate-400 text-slate-600',
    group: 'bg-violet-100/80 border-violet-400 text-violet-700',
}
const dimClass = (d?: string) => (d ? (DIM_CLASS[d] ?? DIM_CLASS.group) : DIM_CLASS.group)
</script>
