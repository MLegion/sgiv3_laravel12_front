<template>
    <div class="space-y-4 max-w-7xl mx-auto pb-16">
        <div class="flex items-start justify-between flex-wrap gap-3">
            <div>
                <button class="text-sm text-slate-500 hover:text-slate-700" @click="goBack">&larr; Mi Docencia</button>
                <h1 class="text-2xl font-bold text-slate-800">Mi horario de descarga</h1>
                <p class="text-sm text-slate-500">Coloca cada hora de descarga aprobada en un hueco libre de tu horario. El aula por defecto es la oficina.<span v-if="periodName"> · {{ periodName }}</span></p>
            </div>
            <span v-if="scheduleStatus" class="px-2.5 py-1 rounded-full text-xs font-semibold" :class="statusClass">{{ statusLabel }}</span>
        </div>

        <div v-if="loading" class="text-center py-12 text-slate-400">Cargando…</div>
        <div v-else-if="fatal" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{{ fatal }}</div>

        <template v-else>
            <div v-if="scheduleStatus === 'approved'" class="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700 flex items-center gap-2">
                <span>✔</span> Tu horario de descarga fue aprobado.
            </div>
            <div v-else-if="rejectedReason" class="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                <strong>Horario rechazado:</strong> {{ rejectedReason }}
            </div>

            <div class="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-4">
                <!-- Rejilla -->
                <div class="bg-white border rounded-xl shadow-sm overflow-x-auto">
                    <table class="w-full text-xs border-collapse">
                        <thead>
                            <tr class="bg-slate-50 text-slate-500">
                                <th class="w-24 px-2 py-2 border-b border-r text-left font-semibold">HORA</th>
                                <th v-for="d in dias" :key="d.v" class="px-2 py-2 border-b text-left font-semibold">{{ d.l }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="h in horas" :key="h">
                                <td class="px-2 py-1 border-r border-b text-slate-500 text-center whitespace-nowrap leading-tight">
                                    {{ h2(h) }}<br><span class="text-slate-300">—</span><br>{{ h2(h + 1) }}
                                </td>
                                <td v-for="d in dias" :key="d.v"
                                    class="border-b border-r align-middle p-0 h-11"
                                    :class="cellClass(d.v, h)"
                                    :style="cellStyle(d.v, h)"
                                    :title="cellTitle(d.v, h)"
                                    @click="onCell(d.v, h)">
                                    <div v-if="cellContent(d.v, h)" class="px-1.5 py-1 leading-tight text-center">
                                        <div class="text-[11px] font-bold truncate flex items-center justify-center gap-1">
                                            <span v-if="cellContent(d.v, h)!.locked">🔒</span>{{ cellContent(d.v, h)!.label }}
                                        </div>
                                        <div v-if="cellContent(d.v, h)!.place" class="text-[9px] truncate opacity-90">📍 {{ cellContent(d.v, h)!.place }}</div>
                                    </div>
                                    <div v-else-if="occ(d.v, h)" class="px-1.5 py-1 leading-tight text-slate-500 truncate" :style="stripeStyle">{{ occ(d.v, h) }}</div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Panel: horas por colocar -->
                <div class="space-y-2">
                    <div>
                        <p class="text-sm font-semibold text-slate-700">Horas por colocar</p>
                        <p class="text-[11px] text-slate-400">Selecciona una actividad y da clic en una celda libre.</p>
                    </div>

                    <div v-for="a in activities" :key="a.complementaryHourTypeId"
                        class="bg-white border rounded-lg p-2.5 border-l-4 transition"
                        :class="[selectedType === a.complementaryHourTypeId && !a.locked ? 'ring-1 ring-slate-800' : '', a.locked ? 'opacity-90' : 'cursor-pointer hover:bg-slate-50']"
                        :style="{ borderLeftColor: colorFor(a.complementaryHourTypeId) }"
                        @click="!a.locked && editable && (selectedType = a.complementaryHourTypeId)">
                        <p class="text-sm font-semibold flex items-center gap-1" :style="{ color: colorFor(a.complementaryHourTypeId) }">
                            <span v-if="a.locked">🔒</span>{{ a.shortName || a.name }}
                        </p>
                        <p v-if="a.rubro" class="text-[11px] text-slate-400">Rubro: {{ a.rubro }}</p>
                        <p class="text-xs mt-0.5" :class="remainingByType(a) === 0 ? 'text-emerald-600' : 'text-amber-600'">
                            {{ fmt(placedByType(a)) }} / {{ fmt(a.hours) }} h colocadas
                        </p>
                    </div>
                    <p v-if="activities.length === 0" class="text-xs text-slate-400 py-2">Sin horas de descarga por colocar.</p>

                    <div class="pt-1 text-sm text-slate-600 border-t">
                        <strong>{{ fmt(totalPlaced) }} / {{ fmt(totalTarget) }}</strong> h colocadas
                    </div>

                    <button v-if="editable"
                        class="w-full px-3 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center justify-center gap-1"
                        :disabled="busy || teacherRemaining !== 0" @click="submit">✈ Enviar a revisión</button>
                    <button v-if="editable"
                        class="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        :disabled="busy" @click="save">Guardar</button>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'

interface Activity { complementaryHourTypeId: number; name: string; shortName: string | null; color: string | null; rubro: string | null; hours: number; locked: boolean }
interface Placement { day: number; hour: number; typeId: number; placeId: number | null }
interface Locked { day: number; hour: number; typeId: number; shortName: string | null; color: string | null; place: string | null }

const router = useRouter()
const toast = useToast()
const D = API.MIDOCENCIA_API.distribution

const dias = [{ v: 1, l: 'LUNES' }, { v: 2, l: 'MARTES' }, { v: 3, l: 'MIÉRCOLES' }, { v: 4, l: 'JUEVES' }, { v: 5, l: 'VIERNES' }]
const horas = Array.from({ length: 14 }, (_, i) => 7 + i)
const stripeStyle = 'background-image: repeating-linear-gradient(45deg,#f1f5f9,#f1f5f9 6px,#e2e8f0 6px,#e2e8f0 12px);'

const loading = ref(true)
const busy = ref(false)
const fatal = ref('')
const scheduleStatus = ref('pending')
const rejectedReason = ref<string | null>(null)
const periodName = ref('')
const editable = ref(false)
const activities = ref<Activity[]>([])
const hourTypes = ref<Array<{ id: number; name: string; shortName: string | null }>>([])
const places = ref<Array<{ id: number; name: string }>>([])
const occupied = ref<Record<string, string>>({})
const lockedCells = ref<Record<string, Locked>>({})
const placements = ref<Placement[]>([])
const selectedType = ref<number | null>(null)
const selectedPlace = ref<number | null>(null)

const key = (d: number, h: number) => `${d}|${h}`
const h2 = (h: number) => String(h).padStart(2, '0') + ':00'
// Paleta por tipo (los tipos no guardan color en BD; se asigna por índice como en SGIv2).
const PALETA = ['#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899', '#14b8a6', '#0891b2', '#a16207']
// Orden estable de tipos: primero los de las actividades, luego el resto del catálogo.
const orderedTypeIds = computed(() => {
    const ids: number[] = []
    for (const a of activities.value) if (!ids.includes(a.complementaryHourTypeId)) ids.push(a.complementaryHourTypeId)
    for (const t of hourTypes.value) if (!ids.includes(t.id)) ids.push(t.id)
    return ids
})
const colorByType = computed(() => {
    const m: Record<number, string> = {}
    orderedTypeIds.value.forEach((id, i) => { m[id] = PALETA[i % PALETA.length] })
    for (const a of activities.value) if (a.color) m[a.complementaryHourTypeId] = a.color
    return m
})
const colorFor = (id: number | null | undefined) => (id != null && colorByType.value[id]) || '#64748b'
const typeLabel = computed(() => {
    const m: Record<number, string> = {}
    for (const t of hourTypes.value) m[t.id] = t.shortName || t.name
    for (const a of activities.value) m[a.complementaryHourTypeId] = a.shortName || a.name
    return m
})
const placeName = computed(() => Object.fromEntries(places.value.map(p => [p.id, p.name])))

const lockedCountByType = computed(() => {
    const m: Record<number, number> = {}
    for (const l of Object.values(lockedCells.value)) m[l.typeId] = (m[l.typeId] || 0) + 1
    return m
})
function placedByType(a: Activity) {
    return a.locked ? (lockedCountByType.value[a.complementaryHourTypeId] || 0)
                    : placements.value.filter(p => p.typeId === a.complementaryHourTypeId).length
}
function remainingByType(a: Activity) { return a.hours - placedByType(a) }

const totalTarget = computed(() => activities.value.reduce((s, a) => s + a.hours, 0))
const totalPlaced = computed(() => placements.value.length + Object.keys(lockedCells.value).length)
// Solo cuentan las horas NO bloqueadas para habilitar el envío (las bloqueadas ya están).
const teacherRemaining = computed(() =>
    activities.value.filter(a => !a.locked).reduce((s, a) => s + remainingByType(a), 0))

const statusLabel = computed(() => ({ pending: 'Por colocar', submitted: 'En revisión', approved: 'Aprobado' }[scheduleStatus.value] ?? scheduleStatus.value))
const statusClass = computed(() => ({ pending: 'bg-slate-100 text-slate-600', submitted: 'bg-amber-100 text-amber-700', approved: 'bg-emerald-100 text-emerald-700' }[scheduleStatus.value] ?? 'bg-slate-100'))

function occ(d: number, h: number) { return occupied.value[key(d, h)] }
function lockedAt(d: number, h: number) { return lockedCells.value[key(d, h)] }
function placementAt(d: number, h: number) { return placements.value.find(p => p.day === d && p.hour === h) }

// Solo el nombre del aula (sin el edificio: "EDIFICIO · AULA 32" → "AULA 32").
function roomOnly(name?: string | null) { return (name || 'OFICINA').split('·').pop()!.trim().toUpperCase() }
function cellContent(d: number, h: number): { label: string; place: string; locked: boolean } | null {
    const l = lockedAt(d, h)
    if (l) return { label: l.shortName || '', place: roomOnly(l.place), locked: true }
    const p = placementAt(d, h)
    if (p) return { label: typeLabel.value[p.typeId] || '', place: roomOnly(p.placeId ? placeName.value[p.placeId] : 'OFICINA'), locked: false }
    return null
}
function cellClass(d: number, h: number) {
    if (occ(d, h)) return 'cursor-not-allowed'
    if (lockedAt(d, h)) return 'text-white cursor-not-allowed'
    if (placementAt(d, h)) return 'text-white cursor-pointer'
    return editable.value ? 'cursor-pointer hover:bg-slate-50' : ''
}
function cellStyle(d: number, h: number) {
    const l = lockedAt(d, h)
    if (l) return { background: colorFor(l.typeId) }
    const p = placementAt(d, h)
    if (p) return { background: colorFor(p.typeId) }
    return {}
}
function cellTitle(d: number, h: number) {
    if (occ(d, h)) return 'Clase: ' + occ(d, h)
    const l = lockedAt(d, h); if (l) return (l.shortName || '') + ' (asignada por jefatura)'
    const p = placementAt(d, h); if (p) return (typeLabel.value[p.typeId] || '') + ' (clic para quitar)'
    return 'Libre'
}

function onCell(d: number, h: number) {
    if (!editable.value || occ(d, h) || lockedAt(d, h)) return
    const idx = placements.value.findIndex(p => p.day === d && p.hour === h)
    if (idx >= 0) { placements.value.splice(idx, 1); return }
    if (!selectedType.value) { toast.error('Selecciona un tipo a colocar.'); return }
    const act = activities.value.find(a => a.complementaryHourTypeId === selectedType.value)
    if (act && remainingByType(act) <= 0) { toast.error('Ya colocaste todas las horas de ese tipo.'); return }
    placements.value.push({ day: d, hour: h, typeId: selectedType.value, placeId: selectedPlace.value })
}

function fmt(n: number) { return Number(n).toFixed(n % 1 === 0 ? 0 : 1) }
function goBack() { router.push({ name: 'midocencia.my-distribution' }) }
function toMin(t: string) { const [hh, mm] = String(t).split(':').map(Number); return hh * 60 + (mm || 0) }

onMounted(load)

async function load() {
    loading.value = true; fatal.value = ''
    try {
        const { data } = await api.get(D.schedule)
        scheduleStatus.value = data.scheduleStatus
        rejectedReason.value = data.scheduleRejectedReason
        periodName.value = data.periodName ?? ''
        editable.value = data.editable
        activities.value = data.activities ?? []
        hourTypes.value = data.hourTypes ?? []
        places.value = data.places ?? []
        selectedType.value = activities.value.find(a => !a.locked)?.complementaryHourTypeId ?? null
        occupied.value = {}
        for (const o of (data.occupied ?? [])) {
            const sh = parseInt(String(o.startTime).slice(0, 2), 10)
            const eh = Math.ceil(toMin(o.endTime) / 60)
            for (let h = sh; h < eh; h++) occupied.value[key(o.dayOfWeek, h)] = o.subject
        }
        lockedCells.value = {}
        for (const l of (data.lockedPlacements ?? [])) {
            const sh = parseInt(String(l.startTime).slice(0, 2), 10)
            const eh = Math.ceil(toMin(l.endTime) / 60)
            for (let h = sh; h < eh; h++) lockedCells.value[key(l.dayOfWeek, h)] = { day: l.dayOfWeek, hour: h, typeId: l.complementaryHourTypeId, shortName: l.shortName, color: l.color, place: l.place }
        }
        // Bloques guardados del docente (no bloqueados) → placements.
        placements.value = []
        const lockedTypes = new Set(activities.value.filter(a => a.locked).map(a => a.complementaryHourTypeId))
        for (const b of (data.blocks ?? [])) {
            if (b.dayOfWeek == null) continue
            const sh = parseInt(String(b.startTime).slice(0, 2), 10)
            const eh = Math.ceil(toMin(b.endTime) / 60)
            for (let h = sh; h < eh; h++) {
                if (lockedCells.value[key(b.dayOfWeek, h)]) continue // ya está como bloqueada
                placements.value.push({ day: b.dayOfWeek, hour: h, typeId: b.complementaryHourTypeId, placeId: b.placeId ?? null })
            }
            void lockedTypes
        }
    } catch (e: any) {
        fatal.value = e?.response?.data?.message ?? 'No se pudo cargar tu horario.'
    } finally { loading.value = false }
}

/** Agrupa celdas contiguas del mismo día/tipo/lugar en bloques. Solo las del docente. */
function payload() {
    const sorted = [...placements.value].sort((a, b) => a.day - b.day || a.typeId - b.typeId || a.hour - b.hour)
    const blocks: any[] = []
    for (const p of sorted) {
        const last = blocks[blocks.length - 1]
        if (last && last._day === p.day && last._type === p.typeId && last._place === p.placeId && last._endH === p.hour) {
            last._endH = p.hour + 1; last.end_time = h2(last._endH)
        } else {
            blocks.push({ complementary_hour_type_id: p.typeId, place_id: p.placeId, day_of_week: p.day, date: null, start_time: h2(p.hour), end_time: h2(p.hour + 1), _day: p.day, _type: p.typeId, _place: p.placeId, _endH: p.hour + 1 })
        }
    }
    return { blocks: blocks.map(({ _day, _type, _place, _endH, ...b }) => b) }
}

async function save() {
    busy.value = true
    try {
        const { data } = await api.post(D.scheduleSave, payload())
        if ((data.conflicts ?? []).length) toast.error('Hay choques con tus clases. Revisa.')
        else toast.success('Horario guardado.')
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo guardar.') }
    finally { busy.value = false }
}

async function submit() {
    busy.value = true
    try {
        await api.post(D.scheduleSave, payload())
        await api.post(D.scheduleSubmit, {})
        toast.success('Horario enviado a revisión.')
        await load()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo enviar.') }
    finally { busy.value = false }
}
</script>
