<template>
    <div class="p-4 md:p-6 max-w-5xl mx-auto">
        <h1 class="text-xl font-semibold text-slate-800">Asistencia de mis grupos</h1>
        <p class="text-sm text-slate-500 mb-4">Elige en orden: campus → modalidad → materia → fecha. Marca solo a los ausentes.</p>

        <!-- Cascada -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <!-- 1. Campus -->
            <div>
                <label class="block text-xs font-medium text-slate-600">1 · Campus</label>
                <select v-model="campusId" @change="onCampus" class="mt-1 w-full rounded-lg border-slate-300 text-sm">
                    <option :value="null">— Elige —</option>
                    <option v-for="c in campuses" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
            </div>
            <!-- 2. Modalidad -->
            <div>
                <label class="block text-xs font-medium text-slate-600">2 · Modalidad</label>
                <select v-model="modalityTypeId" @change="onModality" :disabled="!campusId"
                        class="mt-1 w-full rounded-lg border-slate-300 text-sm disabled:bg-slate-100">
                    <option :value="null">— Elige —</option>
                    <option v-for="m in modalidades" :key="m.id" :value="m.id">{{ m.name }}</option>
                </select>
            </div>
            <!-- 3. Materia / grupo -->
            <div>
                <label class="block text-xs font-medium text-slate-600">3 · Materia / grupo</label>
                <select v-model="selectedGroup" @change="onGroup" :disabled="!modalityTypeId"
                        class="mt-1 w-full rounded-lg border-slate-300 text-sm disabled:bg-slate-100">
                    <option :value="null">— Elige —</option>
                    <option v-for="g in materias" :key="g.teacher_assignment_id" :value="g.teacher_assignment_id">
                        {{ g.grupo }} · {{ g.materia }}
                    </option>
                </select>
            </div>
            <!-- 4. Fecha -->
            <div>
                <label class="block text-xs font-medium text-slate-600">4 · Fecha (horario)</label>
                <select v-if="dates.length" v-model="date" @change="loadRoster" :disabled="!selectedGroup"
                        class="mt-1 w-full rounded-lg border-slate-300 text-sm disabled:bg-slate-100">
                    <option v-for="d in dates" :key="d.date" :value="d.date">{{ d.weekday }} {{ d.date }}</option>
                </select>
                <input v-else type="date" v-model="date" @change="loadRoster" :disabled="!selectedGroup"
                       class="mt-1 w-full rounded-lg border-slate-300 text-sm disabled:bg-slate-100" />
            </div>
        </div>

        <p v-if="selectedGroup && !dates.length" class="text-xs text-amber-600 mb-2">
            Este grupo no tiene horario cargado; elige la fecha manualmente.
        </p>

        <div v-if="loading" class="text-sm text-slate-500">Cargando…</div>

        <!-- Roster -->
        <div v-else-if="selectedGroup && date && roster.length" class="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table class="w-full text-sm">
                <thead class="bg-slate-50 text-slate-600">
                    <tr>
                        <th class="text-left px-3 py-2">No. Control</th>
                        <th class="text-left px-3 py-2">Nombre</th>
                        <th class="text-left px-3 py-2 w-40">Asistencia</th>
                        <th class="text-left px-3 py-2">Motivo (si falta)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="s in roster" :key="s.student_id" class="border-t border-slate-100"
                        :class="{ 'bg-rose-50/50': marks[s.student_id].status !== 'present' }">
                        <td class="px-3 py-1.5 font-mono text-xs">{{ s.num_control }}</td>
                        <td class="px-3 py-1.5">{{ s.nombre }}</td>
                        <td class="px-3 py-1.5">
                            <select v-model="marks[s.student_id].status" class="w-full rounded-lg border-slate-300 text-xs">
                                <option value="present">Presente</option>
                                <option value="absent">Ausente</option>
                                <option value="late">Retardo</option>
                                <option value="excused">Justificado</option>
                            </select>
                        </td>
                        <td class="px-3 py-1.5">
                            <input v-model="marks[s.student_id].notes" type="text" maxlength="255"
                                :disabled="marks[s.student_id].status === 'present'"
                                class="w-full rounded-lg border-slate-300 text-xs disabled:bg-slate-100" placeholder="Opcional" />
                        </td>
                    </tr>
                </tbody>
            </table>
            <div class="flex items-center justify-between px-3 py-3 bg-slate-50 border-t border-slate-200">
                <span class="text-xs text-slate-500">{{ absentCount }} ausencia(s) · {{ roster.length }} alumnos</span>
                <button @click="save" :disabled="saving" class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium disabled:opacity-50">
                    {{ saving ? 'Guardando…' : 'Guardar asistencia' }}
                </button>
            </div>
        </div>

        <div v-else-if="selectedGroup && date" class="text-sm text-slate-500">No hay alumnos inscritos en este grupo.</div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'

const toast = useToast()
const GA = API.MIDOCENCIA_API.groupAttendance

interface Group { teacher_assignment_id: number; grupo: string; materia: string; modalidad: string; campus: string; campus_id: number; modality_type_id: number }
interface Student { student_id: number; num_control: string; nombre: string; status: string; notes?: string }
interface ClassDate { date: string; weekday: string }

const groups = ref<Group[]>([])
const dates = ref<ClassDate[]>([])
const roster = ref<Student[]>([])
const marks = reactive<Record<number, { status: string; notes: string }>>({})

const campusId = ref<number | null>(null)
const modalityTypeId = ref<number | null>(null)
const selectedGroup = ref<number | null>(null)
const date = ref<string>('')
const loading = ref(false)
const saving = ref(false)

// Cascada derivada de la lista completa de grupos del docente.
const campuses = computed(() => dedupe(groups.value.map(g => ({ id: g.campus_id, name: g.campus }))))
const modalidades = computed(() => dedupe(groups.value.filter(g => g.campus_id === campusId.value).map(g => ({ id: g.modality_type_id, name: g.modalidad }))))
const materias = computed(() => groups.value.filter(g => g.campus_id === campusId.value && g.modality_type_id === modalityTypeId.value))
const absentCount = computed(() => Object.values(marks).filter(m => m.status !== 'present').length)

function dedupe(arr: Array<{ id: number; name: string }>): Array<{ id: number; name: string }> {
    const seen = new Map<number, string>()
    for (const x of arr) if (!seen.has(x.id)) seen.set(x.id, x.name)
    return [...seen].map(([id, name]) => ({ id, name }))
}

function onCampus() { modalityTypeId.value = null; onModality() }
function onModality() { selectedGroup.value = null; dates.value = []; date.value = ''; roster.value = [] }

async function onGroup() {
    dates.value = []; date.value = ''; roster.value = []
    if (!selectedGroup.value) return
    try {
        const { data } = await api.get(GA.dates(selectedGroup.value))
        dates.value = data
        const today = new Date().toISOString().slice(0, 10)
        if (data.length) {
            const past = data.filter((d: ClassDate) => d.date <= today)
            date.value = past.length ? past[past.length - 1].date : data[0].date
        } else {
            date.value = today
        }
        await loadRoster()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudieron cargar las fechas.') }
}

async function loadRoster() {
    if (!selectedGroup.value || !date.value) { roster.value = []; return }
    loading.value = true
    try {
        const { data } = await api.get(GA.roster(selectedGroup.value, date.value))
        roster.value = data.students
        for (const s of data.students) marks[s.student_id] = { status: s.status ?? 'present', notes: s.notes ?? '' }
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo cargar la lista.') }
    finally { loading.value = false }
}

async function save() {
    if (!selectedGroup.value || !date.value) return
    saving.value = true
    try {
        const absences = roster.value
            .filter(s => marks[s.student_id].status !== 'present')
            .map(s => ({ student_id: s.student_id, status: marks[s.student_id].status, notes: marks[s.student_id].notes || null }))
        await api.post(GA.record(selectedGroup.value, date.value), { absences })
        toast.success('Asistencia guardada.')
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo guardar.') }
    finally { saving.value = false }
}

onMounted(async () => {
    try { const { data } = await api.get(GA.groups); groups.value = data }
    catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudieron cargar tus grupos.') }
})
</script>
