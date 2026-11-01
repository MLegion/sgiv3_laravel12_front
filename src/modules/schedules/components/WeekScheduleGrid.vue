<template>
    <div class="overflow-x-auto">
        <table class="min-w-[760px] w-full border-collapse select-none">
            <thead>
                <tr class="bg-slate-50">
                    <th class="border border-slate-300 px-2 py-2 text-[11px] font-black uppercase text-slate-500 w-40">Asign. / H. Desc.</th>
                    <th class="border border-slate-300 px-2 py-2 text-[11px] font-black uppercase text-slate-500 w-24">Días / Horas</th>
                    <th v-for="c in columns" :key="c.v" class="border border-slate-300 px-2 py-2 text-[11px] font-black uppercase text-slate-500">{{ c.label }}</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(slot, ri) in hourSlots" :key="slot.start">
                    <!-- Columna 1: la actividad complementaria arrastrable (ocupa todas las filas) -->
                    <td v-if="ri === 0" :rowspan="hourSlots.length" class="border border-slate-300 align-top p-2 bg-white">
                        <div v-if="palette"
                            draggable="true"
                            @dragstart="onPaletteDragStart"
                            @dragend="dragging = false"
                            class="rounded-md bg-emerald-500 text-white p-2 cursor-grab active:cursor-grabbing shadow select-none">
                            <p class="text-[11px] font-bold leading-tight">{{ palette.label }}</p>
                            <p class="text-[10px] opacity-90">{{ palette.hours || 1 }} h · arrastra →</p>
                        </div>
                        <p v-else class="text-[11px] text-slate-300 text-center mt-2">SIN ASIGNACIONES</p>
                    </td>

                    <!-- Columna 2: rango horario de la fila -->
                    <td class="border border-slate-300 px-1 py-1 text-center text-[10px] font-semibold text-slate-500 whitespace-nowrap">
                        {{ slot.label }}
                    </td>

                    <!-- Columnas por día -->
                    <td v-for="c in columns" :key="c.v"
                        class="border border-slate-300 p-0.5 align-top h-14 relative"
                        :class="dragging ? 'bg-emerald-50/50' : ''"
                        @dragover.prevent @drop="onDrop(c.v, slot, $event)">

                        <!-- Ocupación (read-only): aula/docente/grupo según dimensión -->
                        <div v-for="(o, oi) in occupancyAt(c.v, slot)" :key="'o' + oi"
                            class="rounded-sm px-1 py-0.5 mb-0.5 border-l-2 pointer-events-none overflow-hidden"
                            :class="dimClass(o.dimension)"
                            :title="`${dimLabel(o.dimension)}: ${o.label} (${sourceLabel(o.source)})`">
                            <p class="text-[9px] font-semibold leading-tight truncate">{{ o.label }}</p>
                            <p class="text-[8px] opacity-70 truncate">{{ dimLabel(o.dimension) }}</p>
                        </div>

                        <!-- Bloque colocado de la actividad (arrastrable dentro del horario) -->
                        <div v-for="b in placedAt(c.v, slot)" :key="'b' + b.i"
                            :draggable="editable"
                            @dragstart="onBlockDragStart(b.i, $event)"
                            @dragend="dragging = false"
                            class="rounded-md bg-emerald-100 border p-1 overflow-hidden"
                            :class="[b._conflict ? 'border-amber-400' : 'border-emerald-500', editable ? 'cursor-grab active:cursor-grabbing' : '']">
                            <p class="text-[10px] font-bold text-emerald-800 leading-tight">{{ b.start_time }}–{{ b.end_time }}</p>
                            <p v-if="b.sublabel" class="text-[9px] text-emerald-700 truncate">{{ b.sublabel }}</p>
                            <div class="flex items-center justify-between">
                                <span v-if="b._conflict" class="text-[9px] text-amber-700" :title="b._conflict">⚠ choque</span><span v-else></span>
                                <button v-if="editable" @click="$emit('remove', b.i)" class="text-[12px] text-rose-400 hover:text-rose-600 leading-none">×</button>
                            </div>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Col { v: number; label: string }
interface Block { day_of_week: number; start_time: string; end_time: string; label?: string; sublabel?: string; source?: string; dimension?: string; _conflict?: string | null }

const props = withDefaults(defineProps<{
    columns: Col[]
    placed: any[]
    occupancy?: Block[]
    palette?: { label: string; hours: number } | null
    startHour?: number
    endHour?: number
    editable?: boolean
}>(), {
    occupancy: () => [],
    palette: null,
    startHour: 7,
    endHour: 21,
    editable: true,
})

const emit = defineEmits<{
    place: [{ day_of_week: number; start_time: string; end_time: string }]
    move: [{ index: number; day_of_week: number; start_time: string; end_time: string }]
    remove: [number]
}>()

// Una fila por hora (unidad mínima del horario): 07:00-08:00, 08:00-09:00, …
const pad = (n: number) => String(n).padStart(2, '0')
const hourSlots = computed(() =>
    Array.from({ length: props.endHour - props.startHour }, (_, i) => {
        const h = props.startHour + i
        return { start: h, startTime: `${pad(h)}:00`, label: `${pad(h)}:00 - ${pad(h + 1)}:00` }
    }),
)

function parseTime(t: string): number { const [h, m] = String(t || '0:0').split(':').map(Number); return (h || 0) * 60 + (m || 0) }
function fmtMin(min: number): string { return `${pad(Math.floor(min / 60))}:${pad(min % 60)}` }

// Ocupación que cae en esta celda (día + hora): se solapa con [slot, slot+1h).
function occupancyAt(dayV: number, slot: { start: number }) {
    const s = slot.start * 60, e = s + 60
    return props.occupancy.filter(o => o.day_of_week === dayV && o.start_time && o.end_time
        && parseTime(o.start_time) < e && parseTime(o.end_time) > s)
}
// Bloque colocado cuyo INICIO cae en esta celda.
function placedAt(dayV: number, slot: { start: number }) {
    const s = slot.start * 60, e = s + 60
    return props.placed.map((b: any, i: number) => ({ ...b, i }))
        .filter((b: any) => b.day_of_week === dayV && b.start_time && parseTime(b.start_time) >= s && parseTime(b.start_time) < e)
}

const SOURCE_LABELS: Record<string, string> = {
    academic_schedule: 'Clase', academic_class: 'Clase', complementary_schedule: 'Descarga', discharge: 'Descarga',
    complementary_activity: 'Act. complementaria', exam_session: 'Examen', titulacion_act: 'Titulación', group_tutoring: 'Tutoría',
}
const sourceLabel = (s?: string) => (s ? (SOURCE_LABELS[s] ?? s) : '')

const DIM_LABELS: Record<string, string> = { teacher: 'Docente', place: 'Aula', group: 'Grupo' }
const dimLabel = (d?: string) => (d ? (DIM_LABELS[d] ?? d) : '')
const DIM_CLASS: Record<string, string> = {
    teacher: 'bg-sky-100/80 border-sky-400 text-sky-700',
    place: 'bg-slate-200/70 border-slate-400 text-slate-600',
    group: 'bg-violet-100/80 border-violet-400 text-violet-700',
}
const dimClass = (d?: string) => (d ? (DIM_CLASS[d] ?? DIM_CLASS.place) : DIM_CLASS.place)

// Arrastre: recuadro nuevo ('new') vs mover uno existente ('move:<index>').
const dragging = ref(false)
function onPaletteDragStart(e: DragEvent) {
    dragging.value = true
    if (e.dataTransfer) { e.dataTransfer.effectAllowed = 'copy'; e.dataTransfer.setData('text/plain', 'new') }
}
function onBlockDragStart(i: number, e: DragEvent) {
    if (!props.editable) return
    dragging.value = true
    if (e.dataTransfer) { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', 'move:' + i) }
}
function onDrop(dayV: number, slot: { start: number; startTime: string }, e: DragEvent) {
    e.preventDefault()
    dragging.value = false
    const token = e.dataTransfer?.getData('text/plain') || 'new'
    const maxEnd = props.endHour * 60

    if (token.startsWith('move:')) {
        const i = Number(token.slice(5))
        const b = props.placed[i]
        if (!b) return
        const durMin = Math.max(60, parseTime(b.end_time) - parseTime(b.start_time))
        const start = Math.min(slot.start * 60, maxEnd - durMin)
        emit('move', { index: i, day_of_week: dayV, start_time: fmtMin(start), end_time: fmtMin(start + durMin) })
        return
    }
    if (!props.palette) return
    const durMin = (props.palette.hours || 1) * 60
    const start = Math.min(slot.start * 60, maxEnd - durMin)
    emit('place', { day_of_week: dayV, start_time: fmtMin(start), end_time: fmtMin(start + durMin) })
}
</script>
