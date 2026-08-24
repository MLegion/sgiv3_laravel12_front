<template>
    <div class="space-y-4 max-w-4xl mx-auto pb-16">
        <div class="flex items-center justify-between flex-wrap gap-3">
            <div>
                <button class="text-sm text-slate-500 hover:text-slate-700" @click="goBack">&larr; Mi Docencia</button>
                <h1 class="text-xl font-semibold text-slate-800 uppercase">Horario de descarga</h1>
                <p class="text-sm text-slate-500">Coloca tus horas de descarga pura (día/hora/aula). La tutoría grupal ya va en tu horario de clases.</p>
            </div>
            <span v-if="scheduleStatus" class="px-2.5 py-1 rounded-full text-xs font-semibold" :class="statusClass">{{ statusLabel }}</span>
        </div>

        <div v-if="loading" class="text-center py-12 text-slate-400">Cargando…</div>
        <div v-else-if="fatal" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{{ fatal }}</div>

        <template v-else>
            <div class="bg-white border rounded-xl p-3 flex items-center justify-between">
                <span class="text-sm text-slate-600">Horas a colocar: <strong>{{ fmt(targetHours) }}</strong></span>
                <span class="text-sm" :class="remaining === 0 ? 'text-emerald-600' : 'text-amber-600'">Colocadas: <strong>{{ fmt(placed) }}</strong> · Restante: {{ fmt(remaining) }}</span>
            </div>

            <div v-if="rejectedReason" class="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                <strong>Horario rechazado:</strong> {{ rejectedReason }}
            </div>
            <div v-if="conflicts.length" class="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <p class="font-semibold mb-1">Conflictos:</p>
                <ul class="list-disc pl-5"><li v-for="(c,i) in conflicts" :key="i">{{ c }}</li></ul>
            </div>

            <!-- Bloques -->
            <div class="bg-white border rounded-xl shadow-sm overflow-hidden">
                <table class="w-full text-sm">
                    <thead class="bg-slate-50 text-slate-500 text-xs uppercase">
                        <tr>
                            <th class="text-left px-3 py-2">Tipo de descarga</th>
                            <th class="text-left px-3 py-2">Día</th>
                            <th class="text-left px-3 py-2">Inicio</th>
                            <th class="text-left px-3 py-2">Fin</th>
                            <th class="text-left px-3 py-2">Aula</th>
                            <th v-if="editable" class="px-3 py-2"></th>
                        </tr>
                    </thead>
                    <tbody class="divide-y">
                        <tr v-for="(b,i) in blocks" :key="i">
                            <td class="px-3 py-1.5">
                                <select v-model.number="b.complementary_hour_type_id" :disabled="!editable" class="w-full border rounded px-2 py-1 text-sm">
                                    <option :value="null" disabled>—</option>
                                    <option v-for="t in hourTypes" :key="t.id" :value="t.id">{{ t.shortName || t.name }}</option>
                                </select>
                            </td>
                            <td class="px-3 py-1.5">
                                <select v-model.number="b.day_of_week" :disabled="!editable" class="border rounded px-2 py-1 text-sm">
                                    <option v-for="d in dias" :key="d.v" :value="d.v">{{ d.l }}</option>
                                </select>
                            </td>
                            <td class="px-3 py-1.5"><input v-model="b.start_time" type="time" :disabled="!editable" class="border rounded px-2 py-1 text-sm" /></td>
                            <td class="px-3 py-1.5"><input v-model="b.end_time" type="time" :disabled="!editable" class="border rounded px-2 py-1 text-sm" /></td>
                            <td class="px-3 py-1.5">
                                <select v-model.number="b.place_id" :disabled="!editable" class="w-full border rounded px-2 py-1 text-sm">
                                    <option :value="null" disabled>—</option>
                                    <option v-for="p in places" :key="p.id" :value="p.id">{{ p.name }}</option>
                                </select>
                            </td>
                            <td v-if="editable" class="px-3 py-1.5 text-right">
                                <button class="px-2 py-1 text-xs rounded bg-red-50 text-red-600 hover:bg-red-100" @click="blocks.splice(i,1)">✕</button>
                            </td>
                        </tr>
                        <tr v-if="blocks.length === 0"><td colspan="6" class="px-3 py-4 text-center text-slate-400">Sin bloques.</td></tr>
                    </tbody>
                </table>
                <div v-if="editable" class="p-3 border-t">
                    <button class="px-3 py-1.5 text-sm rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50" @click="addBlock">+ Agregar bloque</button>
                </div>
            </div>

            <div v-if="editable" class="sticky bottom-0 bg-white/90 backdrop-blur border rounded-xl p-3 flex justify-end gap-2">
                <button class="px-3 py-1.5 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50" :disabled="busy" @click="save">Guardar</button>
                <button class="px-3 py-1.5 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50" :disabled="busy || remaining !== 0 || conflicts.length > 0" @click="submit">Enviar a revisión</button>
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

interface Block { complementary_hour_type_id: number | null; day_of_week: number | null; start_time: string; end_time: string; place_id: number | null }

const router = useRouter()
const toast = useToast()
const D = API.MIDOCENCIA_API.distribution

const dias = [
    { v: 1, l: 'Lun' }, { v: 2, l: 'Mar' }, { v: 3, l: 'Mié' }, { v: 4, l: 'Jue' }, { v: 5, l: 'Vie' }, { v: 6, l: 'Sáb' },
]

const loading = ref(true)
const busy = ref(false)
const fatal = ref('')
const scheduleStatus = ref('pending')
const rejectedReason = ref<string | null>(null)
const targetHours = ref(0)
const editable = ref(false)
const blocks = ref<Block[]>([])
const conflicts = ref<string[]>([])
const hourTypes = ref<Array<{ id: number; name: string; shortName: string | null }>>([])
const places = ref<Array<{ id: number; name: string }>>([])

const placed = computed(() => blocks.value.reduce((a, b) => a + blockHours(b), 0))
const remaining = computed(() => Number((targetHours.value - placed.value).toFixed(2)))
const statusLabel = computed(() => ({ pending: 'Por colocar', submitted: 'En revisión', approved: 'Aprobado' }[scheduleStatus.value] ?? scheduleStatus.value))
const statusClass = computed(() => ({ pending: 'bg-slate-100 text-slate-600', submitted: 'bg-amber-100 text-amber-700', approved: 'bg-emerald-100 text-emerald-700' }[scheduleStatus.value] ?? 'bg-slate-100'))

function blockHours(b: Block): number {
    if (!b.start_time || !b.end_time) return 0
    const [sh, sm] = b.start_time.split(':').map(Number)
    const [eh, em] = b.end_time.split(':').map(Number)
    return Math.max(0, ((eh * 60 + em) - (sh * 60 + sm)) / 60)
}
function fmt(n: number) { return Number(n).toFixed(n % 1 === 0 ? 0 : 1) }
function goBack() { router.push({ name: 'midocencia.my-distribution' }) }
function addBlock() { blocks.value.push({ complementary_hour_type_id: hourTypes.value[0]?.id ?? null, day_of_week: 1, start_time: '08:00', end_time: '10:00', place_id: null }) }

onMounted(load)

async function load() {
    loading.value = true; fatal.value = ''
    try {
        const { data } = await api.get(D.schedule)
        scheduleStatus.value = data.scheduleStatus
        rejectedReason.value = data.scheduleRejectedReason
        targetHours.value = Number(data.targetHours)
        editable.value = data.editable
        hourTypes.value = data.hourTypes ?? []
        places.value = data.places ?? []
        blocks.value = (data.blocks ?? []).map((b: any) => ({
            complementary_hour_type_id: b.complementaryHourTypeId, day_of_week: b.dayOfWeek ?? 1,
            start_time: b.startTime, end_time: b.endTime, place_id: b.placeId,
        }))
    } catch (e: any) {
        fatal.value = e?.response?.data?.message ?? 'No se pudo cargar tu horario.'
    } finally { loading.value = false }
}

function payload() {
    return { blocks: blocks.value.map(b => ({
        complementary_hour_type_id: b.complementary_hour_type_id,
        place_id: b.place_id, day_of_week: b.day_of_week, date: null,
        start_time: b.start_time, end_time: b.end_time,
    })) }
}

async function save() {
    busy.value = true
    try {
        const { data } = await api.post(D.scheduleSave, payload())
        conflicts.value = data.conflicts ?? []
        toast.success('Horario guardado.' + (conflicts.value.length ? ' Revisa los conflictos.' : ''))
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
    } catch (e: any) {
        conflicts.value = e?.response?.data?.conflicts ?? conflicts.value
        toast.error(e?.response?.data?.message ?? 'No se pudo enviar.')
    } finally { busy.value = false }
}
</script>
