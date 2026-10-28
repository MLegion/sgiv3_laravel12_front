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

        <!-- Info -->
        <section class="rounded-xl border bg-white p-4 grid sm:grid-cols-4 gap-4 text-sm">
            <div><div class="text-[10px] uppercase text-slate-400">Lugar</div>{{ activity.place_name ?? activity.location_label ?? '—' }}</div>
            <div><div class="text-[10px] uppercase text-slate-400">Instructor</div>{{ activity.instructor_name ?? '—' }}</div>
            <div><div class="text-[10px] uppercase text-slate-400">Créditos</div>{{ activity.credits }}</div>
            <div><div class="text-[10px] uppercase text-slate-400">Estado</div>
                <span :class="activity.status === 'active' ? 'text-emerald-600' : 'text-slate-400'">{{ activity.status === 'active' ? 'Activa' : 'Cerrada' }}</span>
            </div>
        </section>

        <!-- Horario -->
        <section class="rounded-xl border bg-white p-4 space-y-3">
            <div class="flex items-center justify-between">
                <h2 class="text-sm font-bold uppercase text-slate-500">Horario</h2>
                <button @click="addBlock" class="text-xs text-emerald-600 hover:underline">+ bloque</button>
            </div>
            <p class="text-[11px] text-slate-400">Semejante al de un docente: día y hora. El choque de aula se avisa (no bloquea).</p>

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
                            <span v-if="b._conflict" class="text-[11px] text-amber-600" :title="b._conflict">⚠ choque de aula</span>
                            <span v-else class="text-[11px] text-slate-300">—</span>
                        </td>
                        <td class="text-right"><button @click="removeBlock(i)" class="text-xs text-slate-400 hover:text-rose-500">quitar</button></td>
                    </tr>
                </tbody>
            </table>
            <p v-else class="text-sm text-slate-400">Sin bloques de horario.</p>

            <button @click="saveSchedule" :disabled="savingSchedule" class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">Guardar horario</button>
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
                        <td class="text-right"><button @click="removeStudent(s)" class="text-xs text-slate-400 hover:text-rose-500">quitar</button></td>
                    </tr>
                </tbody>
            </table>
            <p v-else class="text-sm text-slate-400">Sin alumnos en la lista.</p>
        </section>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'

const props = defineProps<{ id: string | number }>()
const AC = API.AC_API
const toast = useToast()

const activity = ref<any>(null)
const attendees = ref<any[]>([])
const studentSearch = ref('')
const studentResults = ref<any[]>([])
let studentTimer: any = null

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
        const groups = data.conflicts ?? {}
        const labels = Object.values(groups).flat().map((c: any) => c.label).filter(Boolean)
        b._conflict = labels.length ? labels.join(' · ') : null
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
async function removeStudent(s: any) {
    try {
        await api.delete(AC.attendee(props.id, s.student_id))
        toast.success('Alumno quitado.')
        await load()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo quitar.') }
}

onMounted(load)
</script>
