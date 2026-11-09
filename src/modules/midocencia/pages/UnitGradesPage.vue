<template>
    <div class="p-4 md:p-6 max-w-6xl mx-auto">
        <h1 class="text-xl font-semibold text-slate-800">Calificaciones por unidad</h1>
        <p class="text-sm text-slate-500 mb-4">Elige campus → modalidad → materia. Captura la calificación de cada alumno por unidad.</p>

        <!-- Cascada -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
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
                    <option v-for="g in materias" :key="g.teacher_assignment_id" :value="g.teacher_assignment_id">{{ g.grupo }} · {{ g.materia }}</option>
                </select>
            </div>
        </div>

        <div v-if="loading" class="text-sm text-slate-500">Cargando…</div>

        <!-- Prompt de nº de unidades (primera vez) -->
        <div v-else-if="selectedGroup && units == null && !editingUnits" class="rounded-xl border border-amber-200 bg-amber-50 p-4 max-w-md">
            <p class="text-sm text-slate-700 mb-2">¿De cuántas <b>unidades</b> consta <b>{{ subject.materia }}</b>? (se guardará en la materia y la verán los demás grupos)</p>
            <div class="flex items-center gap-2">
                <input type="number" v-model.number="unitsDraft" min="1" max="20" class="w-24 rounded-lg border-slate-300 text-sm" />
                <button @click="saveUnits" :disabled="!validDraft || savingUnits" class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium disabled:opacity-50">Guardar</button>
                <span v-if="subject.suggested_units" class="text-xs text-slate-500">Sugerido por instrumentación: {{ subject.suggested_units }}</span>
            </div>
        </div>

        <!-- Rejilla de calificaciones -->
        <div v-else-if="selectedGroup && units != null">
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-sm text-slate-600"><b>{{ subject.materia }}</b> · {{ students.length }} alumnos · {{ units }} unidades</span>
                    <!-- Editar nº de unidades -->
                    <button @click="startEditUnits" title="Cambiar nº de unidades" class="p-1 rounded-lg text-slate-500 hover:bg-slate-100">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    </button>
                    <span v-if="editingUnits" class="flex items-center gap-1">
                        <input type="number" v-model.number="unitsDraft" min="1" max="20" class="w-20 rounded-lg border-slate-300 text-sm py-1" />
                        <button @click="saveUnits" :disabled="!validDraft || savingUnits" class="px-2 py-1 rounded-lg bg-emerald-600 text-white text-xs disabled:opacity-50">OK</button>
                        <button @click="editingUnits = false" class="px-2 py-1 rounded-lg border text-xs">✕</button>
                    </span>
                </div>
                <button @click="save" :disabled="saving || !dirty.size" class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium disabled:opacity-50">
                    {{ saving ? 'Guardando…' : (dirty.size ? `Guardar (${dirty.size})` : 'Sin cambios') }}
                </button>
            </div>

            <div class="overflow-x-auto rounded-xl border border-slate-200">
                <table class="min-w-full text-sm">
                    <thead class="bg-slate-50 text-slate-600">
                        <tr>
                            <th class="px-3 py-2 text-left sticky left-0 bg-slate-50">No. Control</th>
                            <th class="px-3 py-2 text-left">Alumno</th>
                            <th v-for="u in unitCols" :key="u" class="px-2 py-2 text-center w-28">U{{ u }} <span class="font-normal text-slate-400">/ op.</span></th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <tr v-for="s in students" :key="s.student_id" class="hover:bg-slate-50/60">
                            <td class="px-3 py-1.5 font-mono text-xs sticky left-0 bg-white">{{ s.num_control }}</td>
                            <td class="px-3 py-1.5">{{ s.nombre }}</td>
                            <td v-for="u in unitCols" :key="u" class="px-1 py-1">
                                <div class="flex items-center gap-1 justify-center">
                                    <input type="number" min="0" max="100" step="0.1"
                                        :value="cellGrade(s.student_id, u)"
                                        @input="onGrade(s.student_id, u, ($event.target as HTMLInputElement).value)"
                                        class="w-14 rounded-lg border-slate-300 text-sm text-center px-1 py-1" />
                                    <select :value="cellOpp(s.student_id, u)" title="Oportunidad"
                                        @change="onOpp(s.student_id, u, ($event.target as HTMLSelectElement).value)"
                                        class="rounded-lg border-slate-300 text-xs py-1 px-0.5">
                                        <option v-for="o in opportunities" :key="o.opportunity" :value="o.opportunity">{{ o.opportunity }}ª</option>
                                    </select>
                                </div>
                            </td>
                        </tr>
                        <tr v-if="!students.length"><td :colspan="2 + unitCols.length" class="px-3 py-4 text-center text-slate-400">Sin alumnos inscritos.</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'

const toast = useToast()
const UG = API.MIDOCENCIA_API.unitGrades

interface Group { teacher_assignment_id: number; grupo: string; materia: string; modalidad: string; campus: string; campus_id: number; modality_type_id: number }
interface Student { student_id: number; num_control: string; nombre: string; grades: Record<number, { grade: number | null; opportunity: number }> }

const groups = ref<Group[]>([])
const campusId = ref<number | null>(null)
const modalityTypeId = ref<number | null>(null)
const selectedGroup = ref<number | null>(null)
const loading = ref(false)
const saving = ref(false)
const savingUnits = ref(false)

const subject = reactive<{ materia: string; grupo: string; units_count: number | null; suggested_units: number | null }>(
    { materia: '', grupo: '', units_count: null, suggested_units: null })
const students = ref<Student[]>([])
const units = ref<number | null>(null)
const unitsDraft = ref<number>(5)
const editingUnits = ref(false)

// Oportunidades ordinarias (1ra/2da…) para el select de cada celda.
const opportunities = ref<Array<{ opportunity: number; name: string; short_name: string }>>([])

// gradeMap[studentId][unit] = { grade (string del input), opportunity }; dirty = celdas modificadas.
interface Cell { grade: string; opportunity: number }
const gradeMap = reactive<Record<number, Record<number, Cell>>>({})
const dirty = reactive<Set<string>>(new Set())

function ensureCell(sid: number, u: number): Cell {
    if (!gradeMap[sid]) gradeMap[sid] = {}
    if (!gradeMap[sid][u]) gradeMap[sid][u] = { grade: '', opportunity: 1 }
    return gradeMap[sid][u]
}
function cellGrade(sid: number, u: number): string { return gradeMap[sid]?.[u]?.grade ?? '' }
function cellOpp(sid: number, u: number): number { return gradeMap[sid]?.[u]?.opportunity ?? 1 }
function onGrade(sid: number, u: number, v: string) { ensureCell(sid, u).grade = v; dirty.add(`${sid}:${u}`) }
function onOpp(sid: number, u: number, v: string) { ensureCell(sid, u).opportunity = Number(v); dirty.add(`${sid}:${u}`) }

const unitCols = computed(() => units.value ? Array.from({ length: units.value }, (_, i) => i + 1) : [])
const validDraft = computed(() => Number.isInteger(unitsDraft.value) && unitsDraft.value >= 1 && unitsDraft.value <= 20)

// Cascada derivada de los grupos del docente.
const campuses = computed(() => dedupe(groups.value.map(g => ({ id: g.campus_id, name: g.campus }))))
const modalidades = computed(() => dedupe(groups.value.filter(g => g.campus_id === campusId.value).map(g => ({ id: g.modality_type_id, name: g.modalidad }))))
const materias = computed(() => groups.value.filter(g => g.campus_id === campusId.value && g.modality_type_id === modalityTypeId.value))

function dedupe(arr: Array<{ id: number; name: string }>): Array<{ id: number; name: string }> {
    const seen = new Map<number, string>()
    for (const x of arr) if (!seen.has(x.id)) seen.set(x.id, x.name)
    return [...seen].map(([id, name]) => ({ id, name }))
}

function resetGrid() { students.value = []; units.value = null; editingUnits.value = false; dirty.clear(); for (const k of Object.keys(gradeMap)) delete gradeMap[Number(k)] }
function onCampus() { modalityTypeId.value = null; selectedGroup.value = null; resetGrid(); autoSelect() }
function onModality() { selectedGroup.value = null; resetGrid(); autoSelect() }

async function autoSelect() {
    if (!campusId.value && campuses.value.length === 1) campusId.value = campuses.value[0].id
    if (campusId.value && !modalityTypeId.value && modalidades.value.length === 1) modalityTypeId.value = modalidades.value[0].id
    if (modalityTypeId.value && !selectedGroup.value && materias.value.length === 1) {
        selectedGroup.value = materias.value[0].teacher_assignment_id
        await onGroup()
    }
}

async function onGroup() {
    resetGrid()
    if (!selectedGroup.value) return
    await loadGrid()
}

/** Carga la rejilla del grupo: materia, oportunidades y calificaciones por celda. */
async function loadGrid() {
    if (!selectedGroup.value) return
    loading.value = true
    dirty.clear()
    for (const k of Object.keys(gradeMap)) delete gradeMap[Number(k)]
    try {
        const { data } = await api.get(UG.grid(selectedGroup.value))
        subject.materia = data.subject.materia ?? ''
        subject.grupo = data.subject.grupo ?? ''
        subject.units_count = data.subject.units_count ?? null
        subject.suggested_units = data.subject.suggested_units ?? null
        units.value = subject.units_count
        unitsDraft.value = subject.units_count ?? subject.suggested_units ?? 5
        opportunities.value = data.opportunities ?? []
        students.value = data.students
        for (const s of data.students as Student[]) {
            gradeMap[s.student_id] = {}
            for (const [u, c] of Object.entries(s.grades ?? {})) {
                const cell = c as { grade: number | null; opportunity: number }
                gradeMap[s.student_id][Number(u)] = {
                    grade: cell.grade != null ? String(cell.grade) : '',
                    opportunity: cell.opportunity ?? 1,
                }
            }
        }
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo cargar la rejilla.') }
    finally { loading.value = false }
}

function startEditUnits() { editingUnits.value = true; unitsDraft.value = units.value ?? subject.suggested_units ?? 5 }

async function saveUnits() {
    if (!selectedGroup.value || !validDraft.value) return
    savingUnits.value = true
    try {
        await api.post(UG.units(selectedGroup.value), { units: unitsDraft.value })
        units.value = unitsDraft.value
        subject.units_count = unitsDraft.value
        editingUnits.value = false
        toast.success('Unidades guardadas.')
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudieron guardar las unidades.') }
    finally { savingUnits.value = false }
}

async function save() {
    if (!selectedGroup.value || !dirty.size) return
    saving.value = true
    try {
        const grades = [...dirty].map(key => {
            const [sid, unit] = key.split(':').map(Number)
            const c = gradeMap[sid]?.[unit]
            return {
                student_id: sid, unit_number: unit,
                grade: !c || c.grade === '' ? null : Number(c.grade),
                opportunity: c?.opportunity ?? 1,
            }
        })
        await api.post(UG.save(selectedGroup.value), { grades })
        dirty.clear()
        toast.success('Calificaciones guardadas.')
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudieron guardar.') }
    finally { saving.value = false }
}

onMounted(async () => {
    try {
        const { data } = await api.get(UG.groups)
        groups.value = data
        await autoSelect()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudieron cargar tus grupos.') }
})
</script>
