<template>
    <div class="p-4 md:p-6 max-w-5xl mx-auto">
        <h1 class="text-xl font-semibold text-slate-800">Asistencia de mis grupos</h1>
        <p class="text-sm text-slate-500 mb-4">Elige en orden: campus → modalidad → materia → fecha. Marca solo a los ausentes.</p>

        <!-- Cascada -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div>
                <label class="block text-xs font-medium text-slate-600">1 · Campus</label>
                <select v-model="campusId" @change="onCampus" class="mt-1 w-full rounded-lg border-slate-300 text-sm">
                    <option :value="null">— Elige —</option>
                    <option v-for="c in campuses" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
            </div>
            <div>
                <label class="block text-xs font-medium text-slate-600">2 · Modalidad</label>
                <select v-model="modalityTypeId" @change="onModality" :disabled="!campusId"
                        class="mt-1 w-full rounded-lg border-slate-300 text-sm disabled:bg-slate-100">
                    <option :value="null">— Elige —</option>
                    <option v-for="m in modalidades" :key="m.id" :value="m.id">{{ m.name }}</option>
                </select>
            </div>
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

        <!-- Roster (DataTable) -->
        <div v-if="selectedGroup && date && roster.length">
            <DataTable
                :columns="columns"
                :rows="pagedRows"
                :loading="loading"
                :pagination="{ page, perPage, total: filtered.length }"
                search-placeholder="Buscar alumno…"
                @change="onTableChange"
            >
                <template #cell-foto="{ row }">
                    <UserAvatar :url="avatarUrl(row.student_id)" :name="row.nombre" size="sm" shape="square" />
                </template>
                <template #cell-num_control="{ row }">
                    <span class="font-mono text-xs">{{ row.num_control }}</span>
                </template>
                <template #cell-asistencia="{ row }">
                    <select v-model="marks[row.student_id].status"
                        class="w-full rounded-lg text-xs"
                        :class="marks[row.student_id].status === 'present' ? 'border-slate-300' : 'border-rose-300 bg-rose-50'">
                        <option value="present">Presente</option>
                        <option value="absent">Ausente</option>
                        <option value="late">Retardo</option>
                        <option value="excused">Justificado</option>
                    </select>
                </template>
                <template #cell-motivo="{ row }">
                    <input v-model="marks[row.student_id].notes" type="text" maxlength="255"
                        :disabled="marks[row.student_id].status === 'present'"
                        class="w-full rounded-lg border-slate-300 text-xs disabled:bg-slate-100" placeholder="Opcional" />
                </template>
            </DataTable>

            <div class="flex items-center justify-between mt-3">
                <span class="text-xs text-slate-500">{{ absentCount }} ausencia(s) · {{ roster.length }} alumnos</span>
                <div class="flex items-center gap-2">
                    <button @click="rollCall = true" class="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium flex items-center gap-1.5">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
                        Pase de lista
                    </button>
                    <button @click="save" :disabled="saving" class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium disabled:opacity-50">
                        {{ saving ? 'Guardando…' : 'Guardar asistencia' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Modo pase de lista (fullscreen, móvil-friendly) -->
        <RollCallMode
            v-if="rollCall && selectedGroup && date"
            :students="roster"
            :marks="marks"
            :teacher-assignment-id="selectedGroup"
            :subtitle="rollCallSubtitle"
            :saving="saving"
            @close="rollCall = false"
            @save="saveFromRollCall"
        />

        <div v-else-if="loading" class="text-sm text-slate-500">Cargando…</div>
        <div v-else-if="selectedGroup && date" class="text-sm text-slate-500">No hay alumnos inscritos en este grupo.</div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import type { DataTableColumn, DataTableChangeEvent } from '@/app/components/ui/datatable/types'
import RollCallMode from '@/modules/midocencia/components/RollCallMode.vue'
import UserAvatar from '@/app/components/ui/UserAvatar.vue'

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
const rollCall = ref(false)

const rollCallSubtitle = computed(() => {
    const g = materias.value.find(x => x.teacher_assignment_id === selectedGroup.value)
    return g ? `${g.grupo} · ${g.materia} · ${date.value}` : date.value
})

// Paginación/búsqueda local del roster.
const page = ref(1)
const perPage = ref(10)
const term = ref('')
const columns: DataTableColumn<Student>[] = [
    { key: 'foto', label: '', width: '52px', align: 'center' },
    { key: 'num_control', label: 'No. Control', searchable: true },
    { key: 'nombre', label: 'Nombre', field: 'nombre', searchable: true },
    { key: 'asistencia', label: 'Asistencia', width: '150px' },
    { key: 'motivo', label: 'Motivo (si falta)' },
]
const filtered = computed(() => {
    const t = term.value.trim().toLowerCase()
    if (!t) return roster.value
    return roster.value.filter(s => s.nombre.toLowerCase().includes(t) || (s.num_control ?? '').toLowerCase().includes(t))
})
const pagedRows = computed(() => filtered.value.slice((page.value - 1) * perPage.value, page.value * perPage.value))

function onTableChange(e: DataTableChangeEvent) {
    page.value = e.page
    perPage.value = e.perPage
    if (e.search !== undefined) {
        term.value = typeof e.search === 'string' ? e.search : (Object.values(e.search)[0] ?? '')
        page.value = 1
    }
}

// Cascada derivada de la lista completa de grupos del docente.
const campuses = computed(() => dedupe(groups.value.map(g => ({ id: g.campus_id, name: g.campus }))))
const modalidades = computed(() => dedupe(groups.value.filter(g => g.campus_id === campusId.value).map(g => ({ id: g.modality_type_id, name: g.modalidad }))))
const materias = computed(() => groups.value.filter(g => g.campus_id === campusId.value && g.modality_type_id === modalityTypeId.value))
const absentCount = computed(() => Object.values(marks).filter(m => m.status !== 'present').length)

function avatarUrl(sid: number): string | null {
    return selectedGroup.value ? GA.avatar(selectedGroup.value, sid) : null
}

/** Preselecciona en cascada cuando solo hay una opción en cada nivel. */
async function autoSelect() {
    if (!campusId.value && campuses.value.length === 1) campusId.value = campuses.value[0].id
    if (campusId.value && !modalityTypeId.value && modalidades.value.length === 1) modalityTypeId.value = modalidades.value[0].id
    if (modalityTypeId.value && !selectedGroup.value && materias.value.length === 1) {
        selectedGroup.value = materias.value[0].teacher_assignment_id
        await onGroup() // carga fechas (más cercana a hoy) + roster
    }
}

function dedupe(arr: Array<{ id: number; name: string }>): Array<{ id: number; name: string }> {
    const seen = new Map<number, string>()
    for (const x of arr) if (!seen.has(x.id)) seen.set(x.id, x.name)
    return [...seen].map(([id, name]) => ({ id, name }))
}

function onCampus() { modalityTypeId.value = null; selectedGroup.value = null; dates.value = []; date.value = ''; roster.value = []; autoSelect() }
function onModality() { selectedGroup.value = null; dates.value = []; date.value = ''; roster.value = []; autoSelect() }

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
    page.value = 1; term.value = ''
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

async function saveFromRollCall() {
    await save()
    rollCall.value = false
}

onMounted(async () => {
    try {
        const { data } = await api.get(GA.groups)
        groups.value = data
        await autoSelect()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudieron cargar tus grupos.') }
})
</script>
