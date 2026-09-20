<template>
    <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" @click.self="$emit('close')">
        <div class="bg-white rounded-xl w-full max-w-5xl max-h-[92vh] overflow-auto p-5 space-y-4">
            <div class="flex items-center justify-between">
                <h2 class="text-sm font-bold text-slate-700 uppercase">Programar acto — calendario del aula</h2>
                <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
            </div>

            <!-- Controles -->
            <div class="flex flex-wrap items-center gap-3">
                <select v-model.number="placeId" @change="loadWeek" class="rounded-lg border-slate-300 text-sm">
                    <option :value="null">— Selecciona aula —</option>
                    <option v-for="r in rooms" :key="r.id" :value="r.id">{{ r.name }} ({{ r.building_name }})</option>
                </select>
                <div class="flex items-center gap-1">
                    <button @click="shiftWeek(-7)" class="px-2 py-1.5 rounded-lg border text-sm text-slate-600">&larr;</button>
                    <span class="text-sm font-semibold text-slate-600 min-w-[190px] text-center">Semana del {{ prettyWeek }}</span>
                    <button @click="shiftWeek(7)" class="px-2 py-1.5 rounded-lg border text-sm text-slate-600">&rarr;</button>
                </div>
                <div class="flex items-center gap-3 text-xs text-slate-500 ml-auto">
                    <span class="inline-flex items-center gap-1"><i class="w-3 h-3 rounded-sm bg-slate-300 inline-block"></i>Clase</span>
                    <span class="inline-flex items-center gap-1"><i class="w-3 h-3 rounded-sm bg-amber-300 inline-block"></i>Examen</span>
                    <span class="inline-flex items-center gap-1"><i class="w-3 h-3 rounded-sm bg-violet-300 inline-block"></i>Titulación</span>
                    <span class="inline-flex items-center gap-1"><i class="w-3 h-3 rounded-sm bg-emerald-400 inline-block"></i>Propuesto</span>
                </div>
            </div>

            <p v-if="!placeId" class="text-sm text-slate-400 py-10 text-center">Selecciona un aula para ver su calendario semanal.</p>

            <!-- Calendario -->
            <div v-else class="border rounded-lg overflow-hidden">
                <!-- Encabezado de días -->
                <div class="grid" :style="{ gridTemplateColumns: `56px repeat(${DAYS.length}, 1fr)` }">
                    <div class="bg-slate-50 border-b border-r"></div>
                    <div v-for="(d, i) in days" :key="i" class="bg-slate-50 border-b text-center py-1.5 border-r last:border-r-0">
                        <div class="text-[11px] font-bold text-slate-600">{{ DAYS[i] }}</div>
                        <div class="text-[10px] text-slate-400">{{ d.date.slice(8) }}/{{ d.date.slice(5,7) }}</div>
                    </div>
                </div>
                <!-- Cuerpo -->
                <div class="grid relative" :style="{ gridTemplateColumns: `56px repeat(${DAYS.length}, 1fr)` }">
                    <!-- Gutter de horas -->
                    <div class="relative border-r" :style="{ height: bodyH + 'px' }">
                        <div v-for="h in hours" :key="h" class="absolute left-0 right-0 text-[10px] text-slate-400 pr-1 text-right"
                             :style="{ top: (h - START) * PXH - 6 + 'px' }">{{ h }}:00</div>
                    </div>
                    <!-- Columnas por día -->
                    <div v-for="(d, i) in days" :key="i" class="relative border-r last:border-r-0 cursor-pointer"
                         :style="{ height: bodyH + 'px' }" @click="pickSlot($event, d)">
                        <!-- líneas de hora -->
                        <div v-for="h in hours" :key="h" class="absolute left-0 right-0 border-t border-slate-100"
                             :style="{ top: (h - START) * PXH + 'px' }"></div>
                        <!-- bloques ocupados -->
                        <div v-for="(b, bi) in d.blocks" :key="bi" class="absolute left-0.5 right-0.5 rounded px-1 py-0.5 text-[9px] leading-tight overflow-hidden pointer-events-none"
                             :class="blockClass(b.source_type)"
                             :style="{ top: topPx(b.start_time) + 'px', height: Math.max(heightPx(b.start_time, b.end_time) - 2, 12) + 'px' }">
                            <div class="font-semibold">{{ b.start_time }}–{{ b.end_time }}</div>
                            <div class="truncate">{{ b.label }}</div>
                        </div>
                        <!-- bloque propuesto -->
                        <div v-if="proposed && proposed.date === d.date" class="absolute left-0.5 right-0.5 rounded px-1 py-0.5 text-[9px] leading-tight bg-emerald-400/80 text-white ring-2 ring-emerald-600 pointer-events-none"
                             :style="{ top: topPx(proposed.start) + 'px', height: Math.max(heightPx(proposed.start, proposed.end) - 2, 12) + 'px' }">
                            <div class="font-bold">Acto</div>
                            <div>{{ proposed.start }}–{{ proposed.end }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <p v-if="placeId" class="text-[11px] text-slate-400">Haz clic en un hueco del día para proponer el horario del acto (1 hora por defecto; ajústalo abajo).</p>

            <!-- Detalle del slot propuesto -->
            <div v-if="proposed" class="rounded-lg border bg-slate-50 p-3 space-y-3">
                <div class="grid grid-cols-4 gap-3 items-end">
                    <div><span class="text-xs font-semibold text-slate-500">Fecha</span>
                        <div class="text-sm font-semibold text-slate-700">{{ proposed.date }}</div></div>
                    <label class="block"><span class="text-xs font-semibold text-slate-500">Inicio</span>
                        <input type="time" v-model="proposed.start" @change="onSlotEdit" class="mt-1 w-full rounded-lg border-slate-300 text-sm" /></label>
                    <label class="block"><span class="text-xs font-semibold text-slate-500">Fin</span>
                        <input type="time" v-model="proposed.end" @change="onSlotEdit" class="mt-1 w-full rounded-lg border-slate-300 text-sm" /></label>
                    <div>
                        <span v-if="avail === true" class="text-sm text-emerald-600 font-semibold">✓ Disponible</span>
                        <span v-else-if="avail === false" class="text-sm text-red-600 font-semibold">✗ Ocupada</span>
                    </div>
                </div>
                <label class="block"><span class="text-xs font-semibold text-slate-500">Notas (opcional)</span>
                    <textarea v-model="notes" rows="2" class="mt-1 w-full rounded-lg border-slate-300 text-sm"></textarea></label>
                <p v-if="msg" class="text-sm text-red-600">{{ msg }}</p>
                <div class="flex justify-end gap-2">
                    <button @click="$emit('close')" class="px-4 py-2 rounded-lg border text-sm">Cancelar</button>
                    <button @click="confirm" :disabled="!canConfirm || saving" class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">Programar acto</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { TitulacionRoom, RoomWeekOccupancy, OccupancyDay } from '@/modules/titulacion/types/titulacion.type'

const props = defineProps<{ recordId: number | string; collegeAcademicPeriodId: number | null }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'scheduled'): void }>()
const T = API.TITULACION_API

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const START = 7, END = 21, PXH = 46
const bodyH = (END - START) * PXH
const hours = Array.from({ length: END - START + 1 }, (_, i) => START + i)

const rooms = ref<TitulacionRoom[]>([])
const placeId = ref<number | null>(null)
const weekStart = ref<string>(mondayOf(new Date()))
const occupancy = ref<RoomWeekOccupancy | null>(null)
const proposed = ref<{ date: string; start: string; end: string } | null>(null)
const notes = ref(''), msg = ref(''), saving = ref(false)
const avail = ref<boolean | null>(null)

const days = computed<OccupancyDay[]>(() => (occupancy.value?.days ?? []).slice(0, DAYS.length))
const prettyWeek = computed(() => weekStart.value)
const canConfirm = computed(() => !!proposed.value && proposed.value.start < proposed.value.end)

function mondayOf(d: Date): string {
    const x = new Date(d); const day = (x.getDay() + 6) % 7
    x.setDate(x.getDate() - day)
    return fmt(x)
}
function fmt(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function toMin(t: string): number { const [h, m] = t.split(':').map(Number); return h * 60 + m }
function fmtMin(min: number): string { return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}` }
function topPx(t: string): number { return (toMin(t) - START * 60) / 60 * PXH }
function heightPx(s: string, e: string): number { return (toMin(e) - toMin(s)) / 60 * PXH }

function blockClass(type: string): string {
    if (type === 'exam_session') return 'bg-amber-200 text-amber-900'
    if (type === 'titulacion_act') return 'bg-violet-200 text-violet-900'
    return 'bg-slate-200 text-slate-700'
}

function shiftWeek(delta: number) {
    const d = new Date(weekStart.value + 'T00:00:00'); d.setDate(d.getDate() + delta)
    weekStart.value = fmt(d); loadWeek()
}

async function loadWeek() {
    proposed.value = null; avail.value = null; msg.value = ''
    if (!placeId.value) { occupancy.value = null; return }
    const { data } = await api.get(T.rooms.week(placeId.value), {
        params: { week_start: weekStart.value, college_academic_period_id: props.collegeAcademicPeriodId ?? undefined },
    })
    occupancy.value = data
}

function pickSlot(ev: MouseEvent, day: OccupancyDay) {
    const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect()
    const y = ev.clientY - rect.top
    let min = START * 60 + Math.round((y / PXH) * 60 / 30) * 30
    min = Math.max(START * 60, Math.min(min, END * 60 - 60))
    proposed.value = { date: day.date, start: fmtMin(min), end: fmtMin(min + 60) }
    notes.value = ''; onSlotEdit()
}

async function onSlotEdit() {
    avail.value = null
    if (!canConfirm.value || !placeId.value || !proposed.value) return
    const { data } = await api.post(T.acts.checkAvailability, {
        place_id: placeId.value, date: proposed.value.date,
        start_time: proposed.value.start, end_time: proposed.value.end,
        college_academic_period_id: props.collegeAcademicPeriodId ?? undefined,
    })
    avail.value = data.available
}

async function confirm() {
    if (!proposed.value || !placeId.value) return
    saving.value = true; msg.value = ''
    try {
        await api.post(T.records.scheduleAct(props.recordId), {
            place_id: placeId.value, date: proposed.value.date,
            start_time: proposed.value.start, end_time: proposed.value.end, notes: notes.value || null,
        })
        emit('scheduled')
    } catch (e: any) { msg.value = e?.response?.data?.message ?? 'No se pudo programar.' }
    finally { saving.value = false }
}

onMounted(async () => { rooms.value = (await api.get(T.rooms.list, { params: { only_titulacion: true } })).data ?? [] })
</script>
