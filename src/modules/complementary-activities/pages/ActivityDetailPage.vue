<template>
    <div class="space-y-6" v-if="activity">
        <div class="flex items-center justify-between flex-wrap gap-2">
            <div>
                <h1 class="text-xl font-semibold text-slate-800">{{ activity.name }}</h1>
                <p class="text-xs text-slate-400">
                    {{ activity.type }} · {{ activity.period_name }}
                    <span v-if="activity.career_name"> · {{ activity.career_name }}</span>
                </p>
            </div>
            <RouterLink to="/complementary-activities" class="text-sm text-emerald-600 hover:underline">← Actividades</RouterLink>
        </div>

        <!-- Pestañas -->
        <div class="flex gap-1 border-b border-slate-200">
            <button @click="tab = 'general'" :class="tabClass('general')">Información general</button>
            <button @click="tab = 'horario'" :class="tabClass('horario')">Horario</button>
        </div>

        <!-- ══════════ INFORMACIÓN GENERAL ══════════ -->
        <div v-show="tab === 'general'" class="space-y-6">

        <!-- Datos generales editables -->
        <section class="rounded-xl border bg-white p-4 space-y-3">
            <div class="flex items-center justify-between">
                <h2 class="text-sm font-bold uppercase text-slate-500">Datos generales</h2>
                <span :class="activity.status === 'active' ? 'text-emerald-600' : 'text-slate-400'" class="text-xs font-bold uppercase">{{ activity.status === 'active' ? 'Activa' : 'Cerrada' }}</span>
            </div>
            <div class="grid sm:grid-cols-3 gap-3">
                <div class="sm:col-span-3">
                    <label class="block text-[10px] uppercase text-slate-400 mb-1">Nombre</label>
                    <input v-model="info.name" class="w-full rounded-lg border-slate-300 text-sm" />
                </div>
                <div>
                    <label class="block text-[10px] uppercase text-slate-400 mb-1">Créditos</label>
                    <input v-model.number="info.credits" type="number" min="0" max="50" class="w-full rounded-lg border-slate-300 text-sm" />
                </div>
                <div>
                    <label class="block text-[10px] uppercase text-slate-400 mb-1">Horas semanales</label>
                    <input v-model.number="info.weekly_hours" type="number" min="0" max="60" class="w-full rounded-lg border-slate-300 text-sm" />
                </div>
                <div>
                    <label class="block text-[10px] uppercase text-slate-400 mb-1">Cupo (opcional)</label>
                    <input v-model.number="info.capacity" type="number" min="1" max="1000" class="w-full rounded-lg border-slate-300 text-sm" />
                </div>
            </div>
            <p class="text-[11px] text-slate-400">{{ typeLabel }} · {{ activity.period_name }}<span v-if="activity.career_name"> · {{ activity.career_name }}</span></p>
            <button @click="saveInfo" :disabled="savingInfo || !info.name" class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">Guardar información</button>
        </section>

        <!-- Instructor (tutor): se asigna desde el personal del instituto -->
        <section v-if="activity.status === 'active'" id="ac-instructor" class="rounded-xl border bg-white p-4 space-y-2" :class="{ 'ring-2 ring-emerald-400': highlightInstructor }">
            <h2 class="text-sm font-bold uppercase text-slate-500">Instructor</h2>
            <p class="text-[11px] text-slate-400">Se asigna desde el personal del instituto. Para la tutoría grupal, el instructor es el tutor del grupo.</p>
            <div class="max-w-md">
                <FormRemoteSelect
                    v-model="instructorModel"
                    :endpoint="AC.personnel"
                    :endpoint-by-id="AC.personnelById"
                    item-value="user_id"
                    item-label="full_name"
                    :item-searchs="['full_name']"
                    placeholder="Ver listado o buscar personal…"
                    @update:model-value="assignInstructor" />
            </div>
        </section>

        <!-- Lugar por defecto (aula o etiqueta libre) para el horario -->
        <section v-if="activity.status === 'active'" class="rounded-xl border bg-white p-4 space-y-2">
            <h2 class="text-sm font-bold uppercase text-slate-500">Lugar por defecto</h2>
            <p class="text-[11px] text-slate-400">Aula (o un lugar libre, no salón) que se usa por defecto al armar el horario de la actividad.</p>
            <div class="max-w-md">
                <FormRemoteSelect
                    v-model="placeModel"
                    :endpoint="AC.places"
                    :endpoint-by-id="AC.placeById"
                    item-value="id"
                    :item-label="placeLabel"
                    :item-searchs="['name']"
                    placeholder="Ver listado o buscar aula…"
                    @update:model-value="assignPlace" />
            </div>
            <div class="max-w-md flex items-center gap-2">
                <input v-model="locationLabelInput" class="flex-1 rounded-lg border-slate-300 text-sm" placeholder="…o escribe un lugar (no salón)" />
                <button @click="assignLocationLabel" :disabled="!locationLabelInput" class="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold disabled:opacity-50">Usar</button>
            </div>
        </section>

        <!-- Roster -->
        <section class="rounded-xl border bg-white p-4 space-y-3">
            <div class="flex items-center justify-between">
                <h2 class="text-sm font-bold uppercase text-slate-500">Lista de alumnos ({{ attendees.length }})</h2>
            </div>

            <!-- Agregar alumno -->
            <div class="relative max-w-md">
                <input v-model="studentSearch" @input="searchStudents" class="w-full rounded-lg border-slate-300 text-sm" placeholder="Agregar alumno: buscar por control o nombre…" />
                <ul v-if="studentResults.length" class="absolute z-10 bg-white border rounded-lg mt-1 w-full max-h-56 overflow-y-auto shadow">
                    <li v-for="s in studentResults" :key="s.id" @click="addStudent(s)" class="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer">
                        <span class="font-semibold text-slate-700">{{ s.full_name }}</span>
                        <span class="text-slate-400"> · {{ s.num_control }}</span>
                    </li>
                </ul>
            </div>

            <table v-if="attendees.length" class="w-full text-sm">
                <thead><tr class="text-left text-[10px] uppercase text-slate-400 bg-slate-50 border-y">
                    <th class="px-3 py-1">Control</th><th>Alumno</th><th>Estado</th><th></th>
                </tr></thead>
                <tbody>
                    <tr v-for="s in attendees" :key="s.id" class="border-b last:border-0">
                        <td class="px-3 py-2 text-slate-600">{{ s.num_control }}</td>
                        <td class="text-slate-700">{{ s.full_name }}<span v-if="s.added_manually" class="ml-1 text-[10px] text-slate-400">(manual)</span></td>
                        <td class="text-slate-600">{{ statusLabel(s.status) }}</td>
                        <td class="text-right whitespace-nowrap">
                            <button v-if="s.status !== 'attended'" @click="creditStudent(s)" class="text-xs text-emerald-600 hover:underline">acreditar</button>
                            <button @click="removeStudent(s)" class="ml-3 text-xs text-slate-400 hover:text-rose-500">quitar</button>
                        </td>
                    </tr>
                </tbody>
            </table>
            <p v-else class="text-sm text-slate-400">Sin alumnos en la lista.</p>
        </section>

        </div><!-- /Información general -->

        <!-- ══════════ HORARIO ══════════ -->
        <div v-show="tab === 'horario'" class="space-y-4">
        <section class="rounded-xl border bg-white p-4 space-y-4">
            <div class="flex items-center justify-between flex-wrap gap-2">
                <div>
                    <h2 class="text-sm font-bold uppercase text-slate-500">Horario</h2>
                    <p class="text-[11px] text-slate-400">Como el horario de docencia: día y hora. El choque de aula/clase se avisa (no bloquea). Lugar por defecto: {{ activity.place_name ?? activity.location_label ?? '—' }}.</p>
                </div>
                <button @click="saveSchedule" :disabled="savingSchedule" class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">Guardar horario</button>
            </div>

            <!-- Rejilla reusable (misma que carga académica): recuadro arrastrable + ocupación de providers -->
            <WeekScheduleGrid
                :columns="DAYS_GRID"
                :placed="blocks"
                :occupancy="occupancy"
                :palette="{ label: activity.name, hours: sessionHours }"
                editable
                @place="onPlace"
                @remove="removeBlock" />

            <!-- Editor de bloques -->
            <div class="space-y-2">
                <div class="flex items-center justify-between">
                    <h3 class="text-xs font-bold uppercase text-slate-400">Bloques</h3>
                    <button @click="addBlock" class="text-xs text-emerald-600 hover:underline">+ agregar bloque</button>
                </div>
                <table v-if="blocks.length" class="w-full text-sm">
                    <thead><tr class="text-left text-[10px] uppercase text-slate-400 bg-slate-50 border-y">
                        <th class="px-2 py-1">Día</th><th class="px-2 py-1">Inicio</th><th class="px-2 py-1">Fin</th><th class="px-2 py-1">Aviso</th><th></th>
                    </tr></thead>
                    <tbody>
                        <tr v-for="(b, i) in blocks" :key="i" class="border-b last:border-0">
                            <td class="px-2 py-1">
                                <select v-model.number="b.day_of_week" @change="checkBlock(i)" class="rounded-lg border-slate-300 text-sm">
                                    <option v-for="d in DAYS" :key="d.v" :value="d.v">{{ d.label }}</option>
                                </select>
                            </td>
                            <td class="px-2 py-1"><input v-model="b.start_time" @change="checkBlock(i)" type="time" class="rounded-lg border-slate-300 text-sm" /></td>
                            <td class="px-2 py-1"><input v-model="b.end_time" @change="checkBlock(i)" type="time" class="rounded-lg border-slate-300 text-sm" /></td>
                            <td class="px-2 py-1">
                                <span v-if="b._conflict" class="text-[11px] text-amber-600" :title="b._conflict">⚠ choque</span>
                                <span v-else class="text-[11px] text-slate-300">—</span>
                            </td>
                            <td class="text-right"><button @click="removeBlock(i)" class="text-xs text-slate-400 hover:text-rose-500">quitar</button></td>
                        </tr>
                    </tbody>
                </table>
                <p v-else class="text-sm text-slate-400">Sin bloques. Agrega el primero.</p>
            </div>
        </section>
        </div><!-- /Horario -->
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'
import WeekScheduleGrid from '@/modules/schedules/components/WeekScheduleGrid.vue'

const props = defineProps<{ id: string | number }>()
const route = useRoute()
const AC = API.AC_API
const toast = useToast()

const activity = ref<any>(null)
const attendees = ref<any[]>([])
const studentSearch = ref('')
const studentResults = ref<any[]>([])
let studentTimer: any = null

// ── Pestañas ──────────────────────────────────────────────────────────
const tab = ref<'general' | 'horario'>('general')
const tabClass = (t: string) => [
    'px-4 py-2 text-sm font-semibold border-b-2 -mb-px',
    tab.value === t ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-600',
]
const TYPE_LABELS: Record<string, string> = {
    group_tutoring: 'Tutoría grupal', complementaria: 'Actividad complementaria',
    extraescolar: 'Actividad extraescolar', mooc: 'Curso MOOC',
}
const typeLabel = computed(() => TYPE_LABELS[activity.value?.type] ?? activity.value?.type ?? '')

// ── Información general editable ───────────────────────────────────────
const info = reactive<{ name: string; credits: number | null; capacity: number | null; weekly_hours: number | null }>({
    name: '', credits: 0, capacity: null, weekly_hours: null,
})
const savingInfo = ref(false)
async function saveInfo() {
    savingInfo.value = true
    try {
        await api.put(AC.setInfo(props.id), {
            name: info.name,
            credits: Number(info.credits) || 0,
            capacity: info.capacity ? Number(info.capacity) : null,
            weekly_hours: (info.weekly_hours === null || (info.weekly_hours as any) === '') ? null : Number(info.weekly_hours),
        })
        toast.success('Información guardada.')
        await load()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo guardar.') }
    finally { savingInfo.value = false }
}

// ── Horario: rejilla reusable (WeekScheduleGrid, la misma de carga académica) ──
const DAYS_GRID = [
    { v: 1, label: 'LUNES' }, { v: 2, label: 'MARTES' }, { v: 3, label: 'MIÉRCOLES' },
    { v: 4, label: 'JUEVES' }, { v: 5, label: 'VIERNES' },
]
// Ocupación (read-only) del aula/providers para pintar lo ocupado en la rejilla.
const occupancy = ref<any[]>([])
async function loadOccupancy() {
    try {
        const { data } = await api.get(AC.occupancy(props.id))
        occupancy.value = data?.occupancy ?? []
    } catch { occupancy.value = [] }
}
// El recuadro arrastrable mide = las horas semanales (mínimo 1 h).
const sessionHours = computed(() => Number(info.weekly_hours) > 0 ? Number(info.weekly_hours) : 1)
function onPlace(b: { day_of_week: number; start_time: string; end_time: string }) {
    blocks.value.push({ ...b, _conflict: null })
    checkBlock(blocks.value.length - 1)
}

// Atados al valor ACTUAL de la actividad: el RemoteSelect muestra la selección
// adentro (se re-sincronizan en load()).
const instructorModel = ref<number | null>(null)
const placeModel = ref<number | null>(null)
const highlightInstructor = ref(false)
async function assignInstructor(userId: number | null) {
    if (userId === (activity.value?.instructor_user_id ?? null)) return
    try {
        await api.put(AC.setInstructor(props.id), { instructor_user_id: userId })
        toast.success(userId ? 'Instructor asignado.' : 'Instructor quitado.')
        await load()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo asignar el instructor.') }
}

const locationLabelInput = ref('')
const placeLabel = (p: any) => p.building_name ? `${p.name} · ${p.building_name}` : p.name
async function assignPlace(placeId: number | null) {
    if (placeId === (activity.value?.place_id ?? null)) return
    try {
        await api.put(AC.setPlace(props.id), { place_id: placeId })
        toast.success(placeId ? 'Lugar asignado.' : 'Lugar quitado.')
        await load()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo asignar el lugar.') }
}
async function assignLocationLabel() {
    if (!locationLabelInput.value) return
    try {
        await api.put(AC.setPlace(props.id), { location_label: locationLabelInput.value })
        toast.success('Lugar asignado.')
        await load()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo asignar el lugar.') }
}
const DAYS = [
    { v: 1, label: 'Lunes' }, { v: 2, label: 'Martes' }, { v: 3, label: 'Miércoles' },
    { v: 4, label: 'Jueves' }, { v: 5, label: 'Viernes' }, { v: 6, label: 'Sábado' }, { v: 7, label: 'Domingo' },
]
const blocks = ref<any[]>([])
const savingSchedule = ref(false)

function addBlock() {
    blocks.value.push({ day_of_week: 1, start_time: '07:00', end_time: '08:00', _conflict: null })
}
function removeBlock(i: number) { blocks.value.splice(i, 1) }

async function checkBlock(i: number) {
    const b = blocks.value[i]
    if (!b.day_of_week || !b.start_time || !b.end_time) return
    try {
        const { data } = await api.post(AC.scheduleConflicts(props.id), {
            day_of_week: b.day_of_week, start_time: b.start_time, end_time: b.end_time,
        })
        const parts: string[] = []
        const aula = Object.values(data.conflicts ?? {}).flat().map((c: any) => c.label).filter(Boolean)
        if (aula.length) parts.push('Aula: ' + aula.join(', '))
        const gclass = (data.group_class ?? []).map((c: any) => c.subject).filter(Boolean)
        if (gclass.length) parts.push('Clase del grupo: ' + gclass.join(', '))
        const sclass = data.students_class ?? []
        if (sclass.length) parts.push(`${sclass.length} alumno(s) con clase`)
        const tbusy = (data.teacher_busy ?? []).map((c: any) => c.label).filter(Boolean)
        if (tbusy.length) parts.push('Docente: ' + tbusy.join(', '))
        b._conflict = parts.length ? parts.join(' · ') : null
    } catch { b._conflict = null }
}

async function saveSchedule() {
    savingSchedule.value = true
    try {
        await api.put(AC.schedules(props.id), {
            blocks: blocks.value.map(b => ({
                day_of_week: b.day_of_week, date: null, start_time: b.start_time, end_time: b.end_time,
            })),
        })
        toast.success('Horario guardado.')
        await load()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo guardar el horario.') }
    finally { savingSchedule.value = false }
}

function statusLabel(s: string): string {
    return ({ enrolled: 'Inscrito', attended: 'Acreditado', dropped: 'Baja' } as Record<string, string>)[s] ?? s
}

async function load() {
    const { data } = await api.get(AC.activity(props.id))
    activity.value = data
    // El RemoteSelect refleja el valor ACTUAL (lo muestra adentro).
    instructorModel.value = data.instructor_user_id ?? null
    placeModel.value = data.place_id ?? null
    locationLabelInput.value = data.place_id ? '' : (data.location_label ?? '')
    info.name = data.name ?? ''
    info.credits = data.credits ?? 0
    info.capacity = data.capacity ?? null
    info.weekly_hours = data.weekly_hours ?? null
    loadOccupancy()
    attendees.value = (data.attendees ?? []).filter((a: any) => a.status !== 'dropped')
    blocks.value = (data.schedules ?? [])
        .filter((s: any) => s.day_of_week !== null)
        .map((s: any) => ({
            day_of_week: Number(s.day_of_week),
            start_time: String(s.start_time).substring(0, 5),
            end_time: String(s.end_time).substring(0, 5),
            _conflict: null,
        }))
}
function searchStudents() {
    clearTimeout(studentTimer)
    studentTimer = setTimeout(async () => {
        if (studentSearch.value.trim().length < 2) { studentResults.value = []; return }
        const { data } = await api.get(AC.students, { params: { q: studentSearch.value } })
        studentResults.value = data ?? []
    }, 300)
}
async function addStudent(s: any) {
    try {
        await api.post(AC.attendees(props.id), { student_id: s.id })
        studentResults.value = []; studentSearch.value = ''
        toast.success('Alumno agregado.')
        await load()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo agregar.') }
}
async function creditStudent(s: any) {
    try {
        await api.post(AC.creditAttendee(props.id, s.student_id), {})
        toast.success('Alumno acreditado.')
        await load()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo acreditar.') }
}
async function removeStudent(s: any) {
    try {
        await api.delete(AC.attendee(props.id, s.student_id))
        toast.success('Alumno quitado.')
        await load()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo quitar.') }
}

onMounted(async () => {
    await load()
    // Si venimos del enlace "Asignar tutor →", enfocamos la asignación de instructor.
    if (route.query.assign != null) {
        await nextTick()
        document.getElementById('ac-instructor')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        highlightInstructor.value = true
        setTimeout(() => { highlightInstructor.value = false }, 2500)
    }
})
</script>
