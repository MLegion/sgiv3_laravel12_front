<template>
    <div class="p-4 md:p-6 max-w-5xl mx-auto">
        <h1 class="text-xl font-semibold text-slate-800">Asistencia de mis grupos</h1>
        <p class="text-sm text-slate-500 mb-4">Marca solo a los alumnos ausentes; el resto quedan como presentes.</p>

        <!-- Filtros -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div>
                <label class="block text-xs font-medium text-slate-600">Campus</label>
                <select v-model="campusId" @change="loadGroups" class="mt-1 w-full rounded-lg border-slate-300 text-sm">
                    <option :value="null">Todos</option>
                    <option v-for="c in filters.campuses" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
            </div>
            <div>
                <label class="block text-xs font-medium text-slate-600">Modalidad</label>
                <select v-model="modalityTypeId" @change="loadGroups" class="mt-1 w-full rounded-lg border-slate-300 text-sm">
                    <option :value="null">Todas</option>
                    <option v-for="m in filters.modality_types" :key="m.id" :value="m.id">{{ m.name }}</option>
                </select>
            </div>
            <div>
                <label class="block text-xs font-medium text-slate-600">Fecha</label>
                <input type="date" v-model="date" @change="loadRoster" class="mt-1 w-full rounded-lg border-slate-300 text-sm" />
            </div>
        </div>

        <!-- Grupo -->
        <div class="mb-4">
            <label class="block text-xs font-medium text-slate-600">Grupo / materia</label>
            <select v-model="selectedGroup" @change="loadRoster" class="mt-1 w-full rounded-lg border-slate-300 text-sm">
                <option :value="null">— Elige un grupo —</option>
                <option v-for="g in groups" :key="g.teacher_assignment_id" :value="g.teacher_assignment_id">
                    {{ g.grupo }} · {{ g.materia }} · {{ g.modalidad }} / {{ g.campus }}
                </option>
            </select>
        </div>

        <div v-if="loading" class="text-sm text-slate-500">Cargando…</div>

        <!-- Roster -->
        <div v-else-if="selectedGroup && roster.length" class="bg-white rounded-xl border border-slate-200 overflow-hidden">
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

        <div v-else-if="selectedGroup" class="text-sm text-slate-500">No hay alumnos inscritos en este grupo.</div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'

const toast = useToast()
const GA = API.MIDOCENCIA_API.groupAttendance

interface Filters { campuses: Array<{ id: number; name: string }>; modality_types: Array<{ id: number; name: string }> }
interface Group { teacher_assignment_id: number; grupo: string; materia: string; modalidad: string; campus: string }
interface Student { student_id: number; num_control: string; nombre: string; telefono?: string; email?: string; status: string; notes?: string }

const filters = reactive<Filters>({ campuses: [], modality_types: [] })
const groups = ref<Group[]>([])
const roster = ref<Student[]>([])
const marks = reactive<Record<number, { status: string; notes: string }>>({})

const campusId = ref<number | null>(null)
const modalityTypeId = ref<number | null>(null)
const selectedGroup = ref<number | null>(null)
const date = ref<string>(new Date().toISOString().slice(0, 10))
const loading = ref(false)
const saving = ref(false)

const absentCount = computed(() => Object.values(marks).filter(m => m.status !== 'present').length)

async function loadFilters() {
    try { const { data } = await api.get(GA.filters); filters.campuses = data.campuses; filters.modality_types = data.modality_types } catch { /* noop */ }
}

async function loadGroups() {
    selectedGroup.value = null
    roster.value = []
    try {
        const { data } = await api.get(GA.groups, { params: { campus_id: campusId.value, modality_type_id: modalityTypeId.value } })
        groups.value = data
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudieron cargar tus grupos.') }
}

async function loadRoster() {
    if (!selectedGroup.value) { roster.value = []; return }
    loading.value = true
    try {
        const { data } = await api.get(GA.roster(selectedGroup.value, date.value))
        roster.value = data.students
        for (const s of data.students) marks[s.student_id] = { status: s.status ?? 'present', notes: s.notes ?? '' }
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo cargar la lista.') }
    finally { loading.value = false }
}

async function save() {
    if (!selectedGroup.value) return
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

onMounted(async () => { await loadFilters(); await loadGroups() })
</script>
