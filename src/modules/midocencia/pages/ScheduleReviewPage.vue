<template>
    <div class="space-y-4 max-w-7xl mx-auto pb-16">
        <div class="flex items-center gap-2">
            <button class="px-3 py-1.5 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1" @click="goBack">← Volver al seguimiento</button>
            <button class="px-3 py-1.5 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1" :disabled="!request" @click="showDistrib = true">📋 Ver distribución</button>
        </div>

        <div class="flex items-start justify-between flex-wrap gap-3">
            <div>
                <h1 class="text-2xl font-bold text-slate-800">Revisión del horario de descarga</h1>
                <p class="text-sm text-slate-500">Revisa la colocación de bloques y aprueba o rechaza.<span v-if="periodName"> · {{ periodName }}</span></p>
            </div>
            <span v-if="scheduleStatus" class="px-2.5 py-1 rounded-full text-xs font-semibold" :class="statusClass">{{ statusLabel }}</span>
        </div>

        <div v-if="loading" class="text-center py-12 text-slate-400">Cargando…</div>
        <div v-else-if="fatal" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{{ fatal }}</div>

        <template v-else>
            <div class="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-800 inline-flex items-center gap-2">
                🎓 <strong>Docente:</strong> {{ teacherName }}
            </div>
            <div v-if="scheduleStatus === 'approved'" class="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700 flex items-center gap-2">
                <span>✔</span> Horario aprobado<span v-if="request?.folio"> · folio {{ request.folio }}</span>.
            </div>
            <div v-else-if="scheduleRejectedReason" class="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700"><strong>Rechazado:</strong> {{ scheduleRejectedReason }}</div>

            <div class="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-4">
                <!-- Rejilla (lectura) -->
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
                                <td v-for="d in dias" :key="d.v" class="border-b border-r align-middle p-0 h-11"
                                    :class="occ(d.v, h) ? '' : (cellContent(d.v, h) ? 'text-white' : '')"
                                    :style="cellStyle(d.v, h)" :title="cellTitle(d.v, h)">
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

                <!-- Panel: horas colocadas + acciones -->
                <div class="space-y-2">
                    <p class="text-sm font-semibold text-slate-700">Horas colocadas</p>
                    <div v-for="a in activities" :key="a.complementaryHourTypeId"
                        class="bg-white border rounded-lg p-2.5 border-l-4" :style="{ borderLeftColor: colorFor(a.complementaryHourTypeId) }">
                        <p class="text-sm font-semibold flex items-center gap-1" :style="{ color: colorFor(a.complementaryHourTypeId) }">
                            <span v-if="a.locked">🔒</span>{{ a.shortName || a.name }}
                        </p>
                        <p v-if="a.rubro" class="text-[11px] text-slate-400">Rubro: {{ a.rubro }}</p>
                        <p class="text-xs mt-0.5" :class="placedByType(a) >= a.hours ? 'text-emerald-600' : 'text-amber-600'">
                            {{ fmt(placedByType(a)) }} / {{ fmt(a.hours) }} h colocadas
                        </p>
                    </div>
                    <div class="pt-1 text-sm text-slate-600 border-t"><strong>{{ fmt(totalPlaced) }} / {{ fmt(totalTarget) }}</strong> h colocadas</div>

                    <template v-if="scheduleStatus === 'submitted'">
                        <button class="w-full px-3 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50" :disabled="busy" @click="approve">✔ Aprobar horario</button>
                        <textarea v-model="reason" rows="2" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Motivo de rechazo (si aplica)…"></textarea>
                        <button class="w-full px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50" :disabled="busy || !reason.trim()" @click="reject">✕ Rechazar horario</button>
                    </template>
                    <p v-else class="text-xs text-slate-400 pt-1">Este horario no está en revisión.</p>
                </div>
            </div>
        </template>

        <DescargaReviewModal v-if="showDistrib && request" :request="request" :teacher-name="teacherName" @close="showDistrib = false" @changed="onDistribChanged" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import DescargaReviewModal from '@/modules/midocencia/components/DescargaReviewModal.vue'
import type { DistributionRequest } from '@/modules/midocencia/types/distribution.type'

interface Activity { complementaryHourTypeId: number; name: string; shortName: string | null; color: string | null; rubro: string | null; hours: number; locked: boolean }
interface Placement { day: number; hour: number; typeId: number; placeId: number | null }
interface Locked { typeId: number; shortName: string | null; color: string | null; place: string | null }

const route = useRoute()
const router = useRouter()
const toast = useToast()
const A = API.MIDOCENCIA_API.approval
const id = Number(route.params.id)

const dias = [{ v: 1, l: 'LUNES' }, { v: 2, l: 'MARTES' }, { v: 3, l: 'MIÉRCOLES' }, { v: 4, l: 'JUEVES' }, { v: 5, l: 'VIERNES' }]
const horas = Array.from({ length: 14 }, (_, i) => 7 + i)
const stripeStyle = 'background-image: repeating-linear-gradient(45deg,#f1f5f9,#f1f5f9 6px,#e2e8f0 6px,#e2e8f0 12px);'
const PALETA = ['#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899', '#14b8a6', '#0891b2', '#a16207']

const loading = ref(true)
const busy = ref(false)
const fatal = ref('')
const reason = ref('')
const showDistrib = ref(false)
const request = ref<DistributionRequest | null>(null)
const teacherName = ref('')

const scheduleStatus = ref('pending')
const scheduleRejectedReason = ref<string | null>(null)
const periodName = ref('')
const activities = ref<Activity[]>([])
const hourTypes = ref<Array<{ id: number; name: string; shortName: string | null }>>([])
const places = ref<Array<{ id: number; name: string }>>([])
const occupied = ref<Record<string, string>>({})
const lockedCells = ref<Record<string, Locked>>({})
const placements = ref<Placement[]>([])

const key = (d: number, h: number) => `${d}|${h}`
const h2 = (h: number) => String(h).padStart(2, '0') + ':00'
const toMin = (t: string) => { const [hh, mm] = String(t).split(':').map(Number); return hh * 60 + (mm || 0) }
function fmt(n: number) { return Number(n).toFixed(Number(n) % 1 === 0 ? 0 : 1) }

const orderedTypeIds = computed(() => {
    const ids: number[] = []
    for (const a of activities.value) if (!ids.includes(a.complementaryHourTypeId)) ids.push(a.complementaryHourTypeId)
    for (const t of hourTypes.value) if (!ids.includes(t.id)) ids.push(t.id)
    return ids
})
const colorByType = computed(() => {
    const m: Record<number, string> = {}
    orderedTypeIds.value.forEach((id2, i) => { m[id2] = PALETA[i % PALETA.length] })
    for (const a of activities.value) if (a.color) m[a.complementaryHourTypeId] = a.color
    return m
})
const colorFor = (id2: number | null | undefined) => (id2 != null && colorByType.value[id2]) || '#64748b'
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
const totalTarget = computed(() => activities.value.reduce((s, a) => s + a.hours, 0))
const totalPlaced = computed(() => placements.value.length + Object.keys(lockedCells.value).length)

const statusLabel = computed(() => ({ pending: 'Por colocar', submitted: 'En revisión', approved: 'Aprobado' } as Record<string, string>)[scheduleStatus.value] ?? scheduleStatus.value)
const statusClass = computed(() => ({ pending: 'bg-slate-100 text-slate-600', submitted: 'bg-amber-100 text-amber-700', approved: 'bg-emerald-100 text-emerald-700' } as Record<string, string>)[scheduleStatus.value] ?? 'bg-slate-100')

function occ(d: number, h: number) { return occupied.value[key(d, h)] }
function roomOnly(name?: string | null) { return (name || 'OFICINA').split('·').pop()!.trim().toUpperCase() }
function cellContent(d: number, h: number): { label: string; place: string; locked: boolean } | null {
    const l = lockedCells.value[key(d, h)]
    if (l) return { label: l.shortName || '', place: roomOnly(l.place), locked: true }
    const p = placements.value.find(x => x.day === d && x.hour === h)
    if (p) return { label: typeLabel.value[p.typeId] || '', place: roomOnly(p.placeId ? placeName.value[p.placeId] : 'OFICINA'), locked: false }
    return null
}
function cellStyle(d: number, h: number) {
    const l = lockedCells.value[key(d, h)]
    if (l) return { background: colorFor(l.typeId) }
    const p = placements.value.find(x => x.day === d && x.hour === h)
    if (p) return { background: colorFor(p.typeId) }
    return {}
}
function cellTitle(d: number, h: number) {
    if (occ(d, h)) return 'Clase: ' + occ(d, h)
    const c = cellContent(d, h)
    return c ? c.label : 'Libre'
}

function goBack() { router.push({ name: 'midocencia.approval' }) }
function onDistribChanged() { showDistrib.value = false; load() }

onMounted(load)

async function load() {
    loading.value = true; fatal.value = ''
    try {
        // Solicitud (para "Ver distribución", folio y docente) + vista del horario.
        const [reqRes, viewRes] = await Promise.all([api.get(A.show(id)), api.get(A.scheduleView(id))])
        request.value = reqRes.data
        const data = viewRes.data
        scheduleStatus.value = data.scheduleStatus
        scheduleRejectedReason.value = data.scheduleRejectedReason
        periodName.value = data.periodName ?? ''
        activities.value = data.activities ?? []
        hourTypes.value = data.hourTypes ?? []
        places.value = data.places ?? []
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
            for (let h = sh; h < eh; h++) lockedCells.value[key(l.dayOfWeek, h)] = { typeId: l.complementaryHourTypeId, shortName: l.shortName, color: l.color, place: l.place }
        }
        placements.value = []
        for (const b of (data.blocks ?? [])) {
            if (b.dayOfWeek == null) continue
            const sh = parseInt(String(b.startTime).slice(0, 2), 10)
            const eh = Math.ceil(toMin(b.endTime) / 60)
            for (let h = sh; h < eh; h++) {
                if (lockedCells.value[key(b.dayOfWeek, h)]) continue
                placements.value.push({ day: b.dayOfWeek, hour: h, typeId: b.complementaryHourTypeId, placeId: b.placeId ?? null })
            }
        }
        await loadTeacherName()
    } catch (e: any) {
        fatal.value = e?.response?.data?.message ?? 'No se pudo cargar el horario.'
    } finally { loading.value = false }
}

async function loadTeacherName() {
    if (!request.value) return
    try {
        const { data } = await api.get(API.SCA_API.teachers.list, { params: { per_page: 1000 } })
        const items = data?.items ?? data?.data ?? data ?? []
        const t = items.find((x: any) => x.id === request.value!.teacherId)
        teacherName.value = t ? (t.displayName ?? t.name) : `Docente #${request.value.teacherId}`
    } catch { teacherName.value = `Docente #${request.value.teacherId}` }
}

async function approve() {
    busy.value = true
    try {
        await api.post(A.scheduleApprove(id), {})
        toast.success('Horario aprobado y colocado como ocupación oficial.')
        goBack()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo aprobar el horario.') }
    finally { busy.value = false }
}

async function reject() {
    busy.value = true
    try {
        await api.post(A.scheduleReject(id), { reason: reason.value })
        toast.success('Horario rechazado.')
        goBack()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo rechazar el horario.') }
    finally { busy.value = false }
}
</script>
