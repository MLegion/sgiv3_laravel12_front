<template>
    <div class="p-4 md:p-6 max-w-5xl mx-auto">
        <h1 class="text-xl font-semibold text-slate-800">Justificantes de inasistencia</h1>
        <p class="text-sm text-slate-500 mb-4">Registra un justificante para un alumno de tu carrera; se refleja automáticamente en la asistencia de sus docentes en los días/horas indicados.</p>

        <!-- Alta -->
        <div class="bg-white rounded-xl border border-slate-200 p-4 mb-5">
            <h2 class="text-sm font-semibold text-slate-700 mb-3">Nuevo justificante</h2>

            <!-- Alumno -->
            <div class="mb-3">
                <label class="block text-xs font-medium text-slate-600">Alumno</label>
                <div v-if="form.student" class="mt-1 flex items-center justify-between px-3 py-2 rounded-lg bg-slate-100 text-sm">
                    <span>{{ form.student.nombre }} · <span class="font-mono text-xs">{{ form.student.num_control }}</span></span>
                    <button @click="resetStudent" class="text-slate-400 hover:text-slate-600 text-xs">cambiar</button>
                </div>
                <div v-else class="relative mt-1">
                    <input v-model="studentTerm" @input="searchStudents" type="text" placeholder="Buscar por nombre o número de control…"
                        class="w-full rounded-lg border-slate-300 text-sm" />
                    <ul v-if="studentResults.length" class="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow max-h-56 overflow-auto">
                        <li v-for="s in studentResults" :key="s.student_id" @click="pickStudent(s)"
                            class="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer">
                            {{ s.nombre }} · <span class="font-mono text-xs text-slate-500">{{ s.num_control }}</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label class="block text-xs font-medium text-slate-600">Tipo</label>
                    <select v-model="form.type" class="mt-1 w-full rounded-lg border-slate-300 text-sm">
                        <option value="medical">Médico</option>
                        <option value="other">Otro</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-600">Evidencia PDF o imagen (opcional)</label>
                    <input type="file" accept="application/pdf,image/jpeg,image/png" @change="onFile" class="mt-1 w-full text-xs" />
                </div>
            </div>

            <!-- Alcance: día(s) completo(s) o por horas del horario -->
            <div class="mt-4">
                <div class="inline-flex rounded-lg border border-slate-200 overflow-hidden text-sm mb-3">
                    <button type="button" @click="mode = 'full'" :class="mode === 'full' ? 'bg-slate-700 text-white' : 'bg-white text-slate-600'" class="px-3 py-1.5">Día(s) completo(s)</button>
                    <button type="button" @click="switchHours" :class="mode === 'hours' ? 'bg-slate-700 text-white' : 'bg-white text-slate-600'" class="px-3 py-1.5 border-l border-slate-200">Horas específicas</button>
                </div>

                <!-- Día completo: solo fechas -->
                <div v-if="mode === 'full'" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-medium text-slate-600">Desde (día)</label>
                        <input type="date" v-model="dayFrom" class="mt-1 w-full rounded-lg border-slate-300 text-sm" />
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-600">Hasta (día)</label>
                        <input type="date" v-model="dayTo" :min="dayFrom" class="mt-1 w-full rounded-lg border-slate-300 text-sm" />
                    </div>
                </div>

                <!-- Horas específicas: fecha + horario del alumno -->
                <div v-else>
                    <div class="flex items-end gap-3 mb-2">
                        <div>
                            <label class="block text-xs font-medium text-slate-600">Día</label>
                            <input type="date" v-model="hourDate" @change="loadSchedule" :disabled="!form.student"
                                class="mt-1 rounded-lg border-slate-300 text-sm disabled:bg-slate-100" />
                        </div>
                        <p class="text-xs text-slate-400 pb-2">Marca las clases a las que NO podrá asistir.</p>
                    </div>
                    <div v-if="scheduleLoading" class="text-sm text-slate-500">Cargando horario…</div>
                    <div v-else-if="schedule.length" class="space-y-1.5">
                        <label v-for="(b, i) in schedule" :key="i"
                            class="flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer"
                            :class="blockChecked[i] ? 'border-rose-300 bg-rose-50' : 'border-slate-200'">
                            <input type="checkbox" v-model="blockChecked[i]" class="rounded" />
                            <span class="font-mono text-xs text-slate-600">{{ b.start_time }}–{{ b.end_time }}</span>
                            <span class="text-sm">{{ b.materia }}</span>
                            <span v-if="b.docente" class="text-xs text-slate-400">· {{ b.docente }}</span>
                        </label>
                    </div>
                    <p v-else-if="hourDate" class="text-xs text-amber-600">El alumno no tiene clases ese día (o no hay horario cargado).</p>
                </div>
            </div>

            <!-- Descripción: genérica o propia -->
            <div class="mt-4">
                <label class="block text-xs font-medium text-slate-600">Descripción / motivo <span class="text-rose-500">*</span></label>
                <select v-model="reasonChoice" class="mt-1 w-full rounded-lg border-slate-300 text-sm">
                    <option v-for="r in genericReasons" :key="r" :value="r">{{ r }}</option>
                    <option value="__custom__">Otra (escribir…)</option>
                </select>
                <textarea v-if="reasonChoice === '__custom__'" v-model="customReason" rows="2" maxlength="500"
                    class="mt-2 w-full rounded-lg border-slate-300 text-sm" placeholder="Describe el motivo del justificante…"></textarea>
            </div>

            <div class="flex justify-end mt-3">
                <button @click="save" :disabled="!canSave || saving" class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium disabled:opacity-50">
                    {{ saving ? 'Guardando…' : 'Registrar justificante' }}
                </button>
            </div>
        </div>

        <!-- Listado -->
        <DataTable
            :columns="columns"
            :rows="pagedRows"
            :loading="loading"
            :pagination="{ page, perPage, total: filtered.length }"
            search-placeholder="Buscar alumno…"
            empty-text="Sin justificantes registrados."
            @change="onTableChange"
        >
            <template #cell-tipo="{ row }">
                <span class="px-2 py-0.5 rounded-full text-xs" :class="row.type === 'medical' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'">
                    {{ row.type === 'medical' ? 'Médico' : 'Otro' }}
                </span>
            </template>
            <template #cell-rango="{ row }">
                <span class="text-xs">{{ fmt(row.starts_at) }} → {{ fmt(row.ends_at) }}</span>
            </template>
            <template #cell-evidencia="{ row }">
                <a v-if="row.has_evidence" :href="'#'" @click.prevent="openEvidence(row.id)" class="text-indigo-600 text-xs underline">Ver</a>
                <span v-else class="text-slate-300 text-xs">—</span>
            </template>
            <template #cell-acciones="{ row }">
                <button @click="remove(row.id)" class="text-rose-600 text-xs hover:underline">Eliminar</button>
            </template>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import type { DataTableColumn, DataTableChangeEvent } from '@/app/components/ui/datatable/types'

const toast = useToast()
const J = API.MIDOCENCIA_API.justifications

interface Student { student_id: number; num_control: string; nombre: string }
interface Block { start_time: string; end_time: string; materia: string; docente: string }
interface Row { id: number; type: string; reason: string; starts_at: string; ends_at: string; has_evidence: number; num_control: string; alumno: string }

const genericReasons = [
    'Cita o incapacidad médica',
    'Enfermedad',
    'Asunto familiar',
    'Duelo familiar',
    'Trámite escolar',
    'Participación en evento institucional',
    'Actividad deportiva/cultural representando al plantel',
]

const rows = ref<Row[]>([])
const loading = ref(false)
const saving = ref(false)

const studentTerm = ref('')
const studentResults = ref<Student[]>([])
let searchTimer: any = null

const form = reactive<{ student: Student | null; type: string; evidence: File | null }>({ student: null, type: 'medical', evidence: null })

// Alcance
const mode = ref<'full' | 'hours'>('full')
const dayFrom = ref('')
const dayTo = ref('')
const hourDate = ref('')
const schedule = ref<Block[]>([])
const blockChecked = reactive<Record<number, boolean>>({})
const scheduleLoading = ref(false)

// Descripción
const reasonChoice = ref(genericReasons[0])
const customReason = ref('')
const reasonValue = computed(() => reasonChoice.value === '__custom__' ? customReason.value.trim() : reasonChoice.value)

const selectedBlocks = computed(() => schedule.value.filter((_, i) => blockChecked[i]))
const canSave = computed(() => {
    if (!form.student || !reasonValue.value) return false
    if (mode.value === 'full') return !!dayFrom.value && !!dayTo.value && dayTo.value >= dayFrom.value
    return !!hourDate.value && selectedBlocks.value.length > 0
})

const page = ref(1)
const perPage = ref(25)
const term = ref('')
const columns: DataTableColumn<Row>[] = [
    { key: 'num_control', label: 'No. Control', searchable: true },
    { key: 'alumno', label: 'Alumno', searchable: true },
    { key: 'tipo', label: 'Tipo' },
    { key: 'rango', label: 'Periodo' },
    { key: 'reason', label: 'Motivo' },
    { key: 'evidencia', label: 'Evidencia' },
    { key: 'acciones', label: '' },
]
const filtered = computed(() => {
    const t = term.value.trim().toLowerCase()
    if (!t) return rows.value
    return rows.value.filter(r => r.alumno.toLowerCase().includes(t) || (r.num_control ?? '').toLowerCase().includes(t))
})
const pagedRows = computed(() => filtered.value.slice((page.value - 1) * perPage.value, page.value * perPage.value))

function onTableChange(e: DataTableChangeEvent) {
    page.value = e.page; perPage.value = e.perPage
    if (e.search !== undefined) { term.value = typeof e.search === 'string' ? e.search : (Object.values(e.search)[0] ?? ''); page.value = 1 }
}
function fmt(s: string): string { return s ? s.replace('T', ' ').slice(0, 16) : '' }

function searchStudents() {
    clearTimeout(searchTimer)
    const q = studentTerm.value.trim()
    if (q.length < 2) { studentResults.value = []; return }
    searchTimer = setTimeout(async () => {
        try { const { data } = await api.get(J.students, { params: { q } }); studentResults.value = data } catch { studentResults.value = [] }
    }, 300)
}
function pickStudent(s: Student) { form.student = s; studentResults.value = []; studentTerm.value = ''; schedule.value = []; clearBlocks() }
function resetStudent() { form.student = null; schedule.value = []; clearBlocks() }
function onFile(e: Event) { form.evidence = (e.target as HTMLInputElement).files?.[0] ?? null }

function switchHours() { mode.value = 'hours'; if (form.student && hourDate.value) loadSchedule() }
function clearBlocks() { for (const k of Object.keys(blockChecked)) delete blockChecked[Number(k)] }

async function loadSchedule() {
    schedule.value = []; clearBlocks()
    if (!form.student || !hourDate.value) return
    scheduleLoading.value = true
    try {
        const { data } = await api.get(J.studentSchedule, { params: { student_id: form.student.student_id, date: hourDate.value } })
        schedule.value = data
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo cargar el horario.') }
    finally { scheduleLoading.value = false }
}

function range(): { starts_at: string; ends_at: string } {
    if (mode.value === 'full') {
        return { starts_at: `${dayFrom.value} 00:00:00`, ends_at: `${dayTo.value} 23:59:59` }
    }
    const blocks = selectedBlocks.value
    const start = blocks.reduce((m, b) => b.start_time < m ? b.start_time : m, blocks[0].start_time)
    const end = blocks.reduce((m, b) => b.end_time > m ? b.end_time : m, blocks[0].end_time)
    return { starts_at: `${hourDate.value} ${start}:00`, ends_at: `${hourDate.value} ${end}:00` }
}

async function save() {
    if (!canSave.value) return
    saving.value = true
    try {
        const { starts_at, ends_at } = range()
        const fd = new FormData()
        fd.append('student_id', String(form.student!.student_id))
        fd.append('type', form.type)
        fd.append('reason', reasonValue.value)
        fd.append('starts_at', starts_at)
        fd.append('ends_at', ends_at)
        if (form.evidence) fd.append('evidence', form.evidence)
        await api.post(J.create, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        toast.success('Justificante registrado.')
        resetStudent(); dayFrom.value = ''; dayTo.value = ''; hourDate.value = ''; form.evidence = null
        reasonChoice.value = genericReasons[0]; customReason.value = ''
        await load()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo registrar.') }
    finally { saving.value = false }
}

async function remove(id: number) {
    if (!confirm('¿Eliminar este justificante?')) return
    try { await api.delete(J.remove(id)); await load() }
    catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo eliminar.') }
}

async function openEvidence(id: number) {
    try {
        const res = await api.get(J.evidence(id), { responseType: 'blob' })
        window.open(URL.createObjectURL(res.data as Blob), '_blank')
    } catch { toast.error('No se pudo abrir la evidencia.') }
}

async function load() {
    loading.value = true
    try { const { data } = await api.get(J.list); rows.value = data }
    catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo cargar.') }
    finally { loading.value = false }
}

onMounted(load)
</script>
