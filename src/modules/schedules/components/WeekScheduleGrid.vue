<template>
    <div class="space-y-3">
        <!-- Recuadro arrastrable (opcional): su alto = sus horas -->
        <div v-if="palette" class="flex items-center gap-3">
            <div
                draggable="true"
                @dragstart="onPaletteDragStart"
                @dragend="dragging = false"
                :style="`height: ${(palette.hours || 1) * hourHeight}px`"
                class="w-36 shrink-0 rounded-md bg-emerald-500 text-white p-2 cursor-grab active:cursor-grabbing shadow select-none flex flex-col justify-center">
                <p class="text-[11px] font-bold leading-tight truncate">{{ palette.label }}</p>
                <p class="text-[10px] opacity-90">{{ palette.hours || 1 }} h · arrastra →</p>
            </div>
            <p class="text-[11px] text-slate-400">Arrastra el recuadro a un día y hora. En gris se ve lo ocupado (aula/docente): si lo sueltas encima, se avisa el choque.</p>
        </div>

        <div class="overflow-x-auto">
            <div class="min-w-[680px]">
                <!-- Encabezado de días -->
                <div class="grid" :style="gridCols">
                    <div></div>
                    <div v-for="c in columns" :key="c.v" class="text-center text-[10px] font-black uppercase text-slate-500 py-1 border-b border-slate-200">{{ c.label }}</div>
                </div>
                <!-- Cuerpo -->
                <div class="grid" :style="gridCols">
                    <!-- Gutter de horas -->
                    <div class="relative" :style="gridBodyStyle">
                        <div v-for="h in gridHours" :key="h" class="absolute right-1 text-[9px] text-slate-400" :style="hourLabelStyle(h)">{{ h }}:00</div>
                    </div>
                    <!-- Columnas por día -->
                    <div v-for="c in columns" :key="c.v"
                        class="relative border-l border-slate-100"
                        :class="dragging ? 'bg-emerald-50/60' : ''"
                        :style="gridBodyStyle"
                        @dragover.prevent @drop="onDrop(c.v, $event)">
                        <div v-for="h in gridHours" :key="h" class="absolute left-0 right-0 border-t border-slate-100" :style="hourLineStyle(h)"></div>

                        <!-- Ocupación (read-only): aula/docente/grupo según la dimensión -->
                        <div v-for="(o, oi) in occupancyForDay(c.v)" :key="'o' + oi"
                            class="absolute left-0 right-0 px-1 overflow-hidden pointer-events-none border-l-2"
                            :class="dimClass(o.dimension)"
                            :style="blockStyle(o)"
                            :title="`${dimLabel(o.dimension)}: ${o.label} (${sourceLabel(o.source)})`">
                            <p class="text-[9px] font-semibold leading-tight truncate">{{ o.label }}</p>
                            <p class="text-[8px] opacity-70 truncate">{{ dimLabel(o.dimension) }} · {{ sourceLabel(o.source) }}</p>
                        </div>

                        <!-- Bloques colocados de la actividad -->
                        <div v-for="b in placedForDay(c.v)" :key="'b' + b.i"
                            class="absolute left-0.5 right-0.5 rounded-md bg-emerald-100 border p-1 overflow-hidden z-10"
                            :class="b._conflict ? 'border-amber-400' : 'border-emerald-400'"
                            :style="blockStyle(b)">
                            <p class="text-[10px] font-bold text-emerald-800 leading-tight">{{ b.start_time }}–{{ b.end_time }}</p>
                            <p class="text-[9px] text-emerald-700 truncate">{{ b.sublabel ?? '' }}</p>
                            <span v-if="b._conflict" class="text-[9px] text-amber-700" :title="b._conflict">⚠ choque</span>
                            <button v-if="editable" @click="$emit('remove', b.i)" class="absolute top-0.5 right-1 text-[11px] text-rose-400 hover:text-rose-600 leading-none">×</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Col { v: number; label: string }
interface Block { day_of_week: number; start_time: string; end_time: string; label?: string; sublabel?: string; source?: string; dimension?: string; _conflict?: string | null }

const props = withDefaults(defineProps<{
    columns: Col[]
    placed: any[]
    occupancy?: Block[]
    palette?: { label: string; hours: number } | null
    startHour?: number
    endHour?: number
    hourHeight?: number
    editable?: boolean
    snapMinutes?: number
}>(), {
    occupancy: () => [],
    palette: null,
    startHour: 7,
    endHour: 21,
    hourHeight: 40,
    editable: true,
    snapMinutes: 30,
})

const emit = defineEmits<{ place: [{ day_of_week: number; start_time: string; end_time: string }]; remove: [number] }>()

const hourHeight = props.hourHeight
const gridHours = Array.from({ length: props.endHour - props.startHour + 1 }, (_, i) => props.startHour + i)
const gridCols = `grid-template-columns: 48px repeat(${props.columns.length}, minmax(110px, 1fr))`
const gridBodyStyle = `position: relative; height: ${(props.endHour - props.startHour) * hourHeight}px`
const hourLineStyle = (h: number) => `top: ${(h - props.startHour) * hourHeight}px`
const hourLabelStyle = (h: number) => `top: ${(h - props.startHour) * hourHeight - 5}px`

function parseTime(t: string): number { const [h, m] = String(t || '0:0').split(':').map(Number); return (h || 0) * 60 + (m || 0) }
function fmtMin(min: number): string { const h = Math.floor(min / 60), m = min % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` }
function blockStyle(b: Block) {
    const top = ((parseTime(b.start_time) - props.startHour * 60) / 60) * hourHeight
    const height = Math.max(((parseTime(b.end_time) - parseTime(b.start_time)) / 60) * hourHeight, 14)
    return `top: ${top}px; height: ${height}px`
}
function occupancyForDay(v: number) { return props.occupancy.filter(o => o.day_of_week === v && o.start_time && o.end_time) }
function placedForDay(v: number) {
    return props.placed.map((b: any, i: number) => ({ ...b, i })).filter((b: any) => b.day_of_week === v && b.start_time && b.end_time)
}

const SOURCE_LABELS: Record<string, string> = {
    academic_schedule: 'Clase', complementary_schedule: 'Descarga',
    complementary_activity: 'Act. complementaria', exam_session: 'Examen', titulacion_act: 'Titulación',
}
const sourceLabel = (s?: string) => (s ? (SOURCE_LABELS[s] ?? s) : '')

// Dimensión de la ocupación: por qué está ocupado ese espacio (docente/aula/grupo).
const DIM_LABELS: Record<string, string> = { teacher: 'Docente', place: 'Aula', group: 'Grupo' }
const dimLabel = (d?: string) => (d ? (DIM_LABELS[d] ?? d) : '')
const DIM_CLASS: Record<string, string> = {
    teacher: 'bg-sky-100/80 border-sky-400 text-sky-700',
    place: 'bg-slate-200/70 border-slate-400 text-slate-600',
    group: 'bg-violet-100/80 border-violet-400 text-violet-700',
}
const dimClass = (d?: string) => (d ? (DIM_CLASS[d] ?? DIM_CLASS.place) : DIM_CLASS.place)

// Arrastre del recuadro
const dragging = ref(false)
function onPaletteDragStart(e: DragEvent) {
    dragging.value = true
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy'
}
function onDrop(dayV: number, e: DragEvent) {
    e.preventDefault()
    dragging.value = false
    if (!props.palette) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const y = e.clientY - rect.top
    const durMin = (props.palette.hours || 1) * 60
    const snap = props.snapMinutes || 30
    let startMin = props.startHour * 60 + Math.round((y / hourHeight * 60) / snap) * snap
    startMin = Math.max(props.startHour * 60, Math.min(startMin, props.endHour * 60 - durMin))
    emit('place', { day_of_week: dayV, start_time: fmtMin(startMin), end_time: fmtMin(startMin + durMin) })
}
</script>
