<template>
    <div class="p-4 md:p-6 max-w-5xl mx-auto">
        <h1 class="text-xl font-semibold text-slate-800">Asistencia de mis grupos</h1>
        <p class="text-sm text-slate-500 mb-4">Elige en orden: campus → modalidad → materia → fecha. Marca solo a los ausentes.</p>

        <!-- Cascada: con una sola opción se muestra como etiqueta fija; con varias, selector. -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div>
                <label class="block text-xs font-medium text-slate-600">1 · Campus</label>
                <div v-if="campuses.length === 1" class="mt-1 px-3 py-2 rounded-lg bg-slate-100 text-sm text-slate-700 truncate">{{ campuses[0].name }}</div>
                <select v-else v-model="campusId" @change="onCampus" class="mt-1 w-full rounded-lg border-slate-300 text-sm">
                    <option :value="null">— Elige —</option>
                    <option v-for="c in campuses" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
            </div>
            <div>
                <label class="block text-xs font-medium text-slate-600">2 · Modalidad</label>
                <div v-if="campusId && modalidades.length === 1" class="mt-1 px-3 py-2 rounded-lg bg-slate-100 text-sm text-slate-700 truncate">{{ modalidades[0].name }}</div>
                <select v-else v-model="modalityTypeId" @change="onModality" :disabled="!campusId"
                        class="mt-1 w-full rounded-lg border-slate-300 text-sm disabled:bg-slate-100">
                    <option :value="null">— Elige —</option>
                    <option v-for="m in modalidades" :key="m.id" :value="m.id">{{ m.name }}</option>
                </select>
            </div>
            <div>
                <label class="block text-xs font-medium text-slate-600">3 · Materia / grupo</label>
                <div v-if="modalityTypeId && materias.length === 1" class="mt-1 px-3 py-2 rounded-lg bg-slate-100 text-sm text-slate-700 truncate">{{ materias[0].grupo }} · {{ materias[0].materia }}</div>
                <select v-else v-model="selectedGroup" @change="onGroup" :disabled="!modalityTypeId"
                        class="mt-1 w-full rounded-lg border-slate-300 text-sm disabled:bg-slate-100">
                    <option :value="null">— Elige —</option>
                    <option v-for="g in materias" :key="g.teacher_assignment_id" :value="g.teacher_assignment_id">
                        {{ g.grupo }} · {{ g.materia }}
                    </option>
                </select>
            </div>
            <div>
                <label class="block text-xs font-medium text-slate-600">4 · Fecha (horario)</label>
                <div v-if="dates.length === 1" class="mt-1 px-3 py-2 rounded-lg bg-slate-100 text-sm text-slate-700 truncate">{{ dates[0].weekday }} {{ dates[0].date }}</div>
                <select v-else-if="dates.length" v-model="date" @change="loadRoster" :disabled="!selectedGroup"
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

        <!-- Unidad de la sesión (autosugerida por la instrumentación; editable) -->
        <div v-if="selectedGroup && date && roster.length" class="flex items-center gap-2 mb-3">
            <label class="text-xs font-medium text-slate-600">Unidad de esta clase:</label>
            <select v-model="unit" class="rounded-lg border-slate-300 text-sm py-1.5">
                <option :value="null">— Sin unidad —</option>
                <option v-for="u in unitOptions" :key="u.number" :value="u.number">
                    Unidad {{ u.number }}{{ u.title ? ` · ${u.title}` : '' }}
                </option>
            </select>
            <span v-if="!units.length" class="text-xs text-slate-400">(el grupo no tiene instrumentación; captura manual)</span>
        </div>

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
                    <div v-if="row.locked" class="flex items-center gap-1.5">
                        <span class="px-2 py-0.5 rounded-full text-xs bg-sky-100 text-sky-700">Justificado</span>
                        <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" title="Fijado por jefatura"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                        <button @click="openDetail(row.student_id)" title="Ver motivo y evidencia"
                            class="p-1 rounded-lg text-indigo-600 hover:bg-indigo-50">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                        </button>
                    </div>
                    <select v-else v-model="marks[row.student_id].status"
                        class="w-full rounded-lg text-xs"
                        :class="marks[row.student_id].status === 'present' ? 'border-slate-300' : 'border-rose-300 bg-rose-50'">
                        <option value="present">Presente</option>
                        <option value="absent">Ausente</option>
                        <option value="late">Retardo</option>
                        <option value="excused">Justificado</option>
                    </select>
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
            @view-evidence="openDetail"
        />

        <div v-else-if="loading" class="text-sm text-slate-500">Cargando…</div>
        <div v-else-if="selectedGroup && date" class="text-sm text-slate-500">No hay alumnos inscritos en este grupo.</div>

        <!-- Drawer de detalle del justificante (motivo + evidencia) -->
        <div v-if="evidence.open" class="fixed inset-0 z-[60] flex">
            <div class="flex-1 bg-black/40" @click="closeEvidence"></div>
            <div class="w-full max-w-2xl bg-white h-full flex flex-col shadow-xl">
                <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <h3 class="text-sm font-semibold text-slate-700">Detalle del justificante</h3>
                    <button @click="closeEvidence" class="text-slate-400 hover:text-slate-600">✕</button>
                </div>
                <!-- Motivo (fijado por jefatura) -->
                <div class="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                    <p class="text-xs font-medium text-slate-500">Motivo</p>
                    <p class="text-sm text-slate-800 whitespace-pre-line max-h-40 overflow-auto">{{ evidence.motivo || 'Sin motivo registrado.' }}</p>
                </div>
                <div class="flex-1 overflow-auto bg-slate-50 flex items-center justify-center">
                    <p v-if="evidence.loading" class="text-sm text-slate-500">Cargando…</p>
                    <img v-else-if="evidence.kind === 'image'" :src="evidence.url!" class="max-w-full max-h-full object-contain" />
                    <iframe v-else-if="evidence.kind === 'pdf'" :src="evidence.url!" class="w-full h-full" />
                    <p v-else class="text-sm text-slate-400">Sin evidencia adjunta.</p>
                </div>
            </div>
        </div>
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
interface Student { student_id: number; num_control: string; nombre: string; status: string; notes?: string; locked?: boolean; justification_has_evidence?: boolean }
interface ClassDate { date: string; weekday: string }
interface Unit { number: number; title?: string }

const groups = ref<Group[]>([])
const dates = ref<ClassDate[]>([])
const roster = ref<Student[]>([])
const marks = reactive<Record<number, { status: string; notes: string }>>({})

// Unidad (parcial) de la sesión: de la instrumentación del grupo; si no hay,
// se ofrece captura manual (1..8). Se autosugiere por fecha desde el backend.
const units = ref<Unit[]>([])
const unit = ref<number | null>(null)
const unitOptions = computed<Unit[]>(() =>
    units.value.length ? units.value : Array.from({ length: 8 }, (_, i) => ({ number: i + 1 })))

const campusId = ref<number | null>(null)
const modalityTypeId = ref<number | null>(null)
const selectedGroup = ref<number | null>(null)
const date = ref<string>('')
const loading = ref(false)
const saving = ref(false)
const rollCall = ref(false)

const rollCallSubtitle = computed(() => {
    const g = materias.value.find(x => x.teacher_assignment_id === selectedGroup.value)
    const u = unit.value ? ` · U${unit.value}` : ''
    return (g ? `${g.grupo} · ${g.materia} · ${date.value}` : date.value) + u
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
        units.value = data.units ?? []
        unit.value = data.unit ?? null
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
        await api.post(GA.record(selectedGroup.value, date.value), { absences, unit: unit.value })
        toast.success('Asistencia guardada.')
        await loadRoster() // refleja el estado persistido (unidad incluida)
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo guardar.') }
    finally { saving.value = false }
}

async function saveFromRollCall() {
    await save()
    rollCall.value = false
}

// Drawer de detalle del justificante: motivo (fijado por jefatura) + evidencia opcional.
const evidence = reactive<{ open: boolean; loading: boolean; kind: 'image' | 'pdf' | null; url: string | null; motivo: string }>({ open: false, loading: false, kind: null, url: null, motivo: '' })

function closeEvidence() {
    if (evidence.url) URL.revokeObjectURL(evidence.url)
    evidence.open = false; evidence.url = null; evidence.kind = null; evidence.motivo = ''
}

async function openDetail(studentId: number) {
    if (!selectedGroup.value || !date.value) return
    if (evidence.url) { URL.revokeObjectURL(evidence.url); evidence.url = null }
    const stu = roster.value.find(s => s.student_id === studentId)
    evidence.motivo = marks[studentId]?.notes ?? ''
    evidence.open = true; evidence.kind = null
    if (!stu?.justification_has_evidence) { evidence.loading = false; return }
    evidence.loading = true
    try {
        const res = await api.get(GA.justificationEvidence(selectedGroup.value, studentId), { params: { date: date.value }, responseType: 'blob' })
        const blob = res.data as Blob
        evidence.kind = blob.type === 'application/pdf' ? 'pdf' : 'image'
        evidence.url = URL.createObjectURL(blob)
    } catch { toast.error('No se pudo abrir la evidencia.'); evidence.kind = null }
    finally { evidence.loading = false }
}

onMounted(async () => {
    try {
        const { data } = await api.get(GA.groups)
        groups.value = data
        await autoSelect()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudieron cargar tus grupos.') }
})
</script>
