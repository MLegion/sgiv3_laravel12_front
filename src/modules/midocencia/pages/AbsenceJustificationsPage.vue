<template>
    <div class="p-4 md:p-6 max-w-5xl mx-auto">
        <h1 class="text-xl font-semibold text-slate-800">Justificantes de inasistencia</h1>
        <p class="text-sm text-slate-500 mb-4">Registra un justificante para un alumno de tu carrera; se refleja automáticamente en la asistencia de sus docentes en los días/horas indicados.</p>

        <!-- Alta -->
        <div class="bg-white rounded-xl border border-slate-200 p-4 mb-5">
            <h2 class="text-sm font-semibold text-slate-700 mb-3">Nuevo justificante</h2>

            <!-- Alumno (FormRemoteSelect + botón de búsqueda avanzada) -->
            <div class="mb-3">
                <label class="block text-xs font-medium text-slate-600">Alumno</label>
                <div class="mt-1 flex gap-2">
                    <div class="flex-1">
                        <FormRemoteSelect
                            v-model="studentId"
                            :endpoint="J.students"
                            :endpoint-by-id="J.studentById"
                            :item-label="studentLabel"
                            item-value="student_id"
                            :item-searchs="['nombre', 'num_control']"
                            placeholder="Buscar por nombre o número de control…"
                        />
                    </div>
                    <button type="button" @click="openModal" title="Búsqueda avanzada"
                        class="px-3 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-sm flex items-center gap-1.5">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                        Buscar
                    </button>
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
                    <div class="mt-1 flex items-center gap-2">
                        <input ref="fileInput" type="file" accept="application/pdf,image/jpeg,image/png" @change="onFile" class="flex-1 text-xs" />
                        <button v-if="form.evidence" type="button" @click="previewSelected" title="Ver evidencia"
                            class="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 shrink-0">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Alcance -->
            <div class="mt-4">
                <div class="inline-flex rounded-lg border border-slate-200 overflow-hidden text-sm mb-3">
                    <button type="button" @click="mode = 'full'" :class="mode === 'full' ? 'bg-slate-700 text-white' : 'bg-white text-slate-600'" class="px-3 py-1.5">Día(s) completo(s)</button>
                    <button type="button" @click="switchHours" :class="mode === 'hours' ? 'bg-slate-700 text-white' : 'bg-white text-slate-600'" class="px-3 py-1.5 border-l border-slate-200">Horas específicas</button>
                </div>

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

                <div v-else>
                    <div class="flex items-end gap-3 mb-2">
                        <div>
                            <label class="block text-xs font-medium text-slate-600">Día</label>
                            <input type="date" v-model="hourDate" @change="loadSchedule" :disabled="!studentId"
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

            <!-- Descripción -->
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
                <button v-if="row.has_evidence" @click="openSavedEvidence(row.id)" title="Ver evidencia"
                    class="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                </button>
                <span v-else class="text-slate-300 text-xs">—</span>
            </template>
            <template #cell-acciones="{ row }">
                <button @click="remove(row.id)" title="Eliminar justificante" class="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
            </template>
        </DataTable>

        <!-- Modal de búsqueda avanzada: DataTable paginado + filtros -->
        <div v-if="searchOpen" class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" @click.self="searchOpen = false">
            <div class="bg-white rounded-xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden">
                <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <h3 class="text-sm font-semibold text-slate-700">Buscar alumno</h3>
                    <button @click="searchOpen = false" class="text-slate-400 hover:text-slate-600">✕</button>
                </div>
                <!-- Filtros -->
                <div class="px-4 py-3 grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-slate-100 bg-slate-50/50">
                    <div>
                        <label class="block text-xs font-medium text-slate-600">Carrera</label>
                        <select v-model="mfCareer" class="mt-1 w-full rounded-lg border-slate-300 text-sm">
                            <option :value="''">Todas</option>
                            <option v-for="c in scopeCareers" :key="c.id" :value="c.id">{{ c.name }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-600">Modalidad</label>
                        <select v-model="mfModality" class="mt-1 w-full rounded-lg border-slate-300 text-sm">
                            <option :value="''">Todas</option>
                            <option v-for="m in scopeModalities" :key="m.id" :value="m.id">{{ m.name }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-600">Semestre</label>
                        <select v-model="mfSemester" class="mt-1 w-full rounded-lg border-slate-300 text-sm">
                            <option :value="''">Todos</option>
                            <option v-for="n in 12" :key="n" :value="n">{{ n }}</option>
                        </select>
                    </div>
                </div>
                <div class="flex-1 overflow-auto p-4">
                    <DataTable
                        :columns="modalColumns"
                        :rows="modalRows"
                        :loading="modalLoading"
                        :pagination="modalPagination"
                        search-placeholder="Buscar por nombre o número de control…"
                        @change="modalOnChange"
                    >
                        <template #cell-num_control="{ row }"><span class="font-mono text-xs">{{ row.num_control }}</span></template>
                        <template #cell-accion="{ row }">
                            <button @click="selectFromModal(row)" class="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-medium">Seleccionar</button>
                        </template>
                    </DataTable>
                </div>
            </div>
        </div>

        <!-- Drawer de evidencia -->
        <div v-if="drawer.open" class="fixed inset-0 z-50 flex">
            <div class="flex-1 bg-black/40" @click="closeDrawer"></div>
            <div class="w-full max-w-2xl bg-white h-full flex flex-col shadow-xl">
                <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <h3 class="text-sm font-semibold text-slate-700">Evidencia</h3>
                    <button @click="closeDrawer" class="text-slate-400 hover:text-slate-600">✕</button>
                </div>
                <div class="flex-1 overflow-auto bg-slate-50 flex items-center justify-center">
                    <p v-if="drawer.loading" class="text-sm text-slate-500">Cargando…</p>
                    <img v-else-if="drawer.kind === 'image'" :src="drawer.url!" class="max-w-full max-h-full object-contain" />
                    <iframe v-else-if="drawer.kind === 'pdf'" :src="drawer.url!" class="w-full h-full" />
                    <p v-else class="text-sm text-slate-500">No se pudo mostrar.</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'
import { useDataTableFetch } from '@/app/components/ui/datatable/useDataTableFetch'
import type { DataTableColumn, DataTableChangeEvent } from '@/app/components/ui/datatable/types'

const toast = useToast()
const J = API.MIDOCENCIA_API.justifications

interface Student { student_id: number; num_control: string; nombre: string }
interface Block { start_time: string; end_time: string; materia: string; docente: string }
interface Row { id: number; type: string; reason: string; starts_at: string; ends_at: string; has_evidence: number; num_control: string; alumno: string }

const genericReasons = [
    'Cita o incapacidad médica', 'Enfermedad', 'Asunto familiar', 'Duelo familiar',
    'Trámite escolar', 'Participación en evento institucional',
    'Actividad deportiva/cultural representando al plantel',
]

const rows = ref<Row[]>([])
const loading = ref(false)
const saving = ref(false)

// Alumno seleccionado (FormRemoteSelect por id).
const studentId = ref<number | null>(null)
function studentLabel(s: Student): string { return `${s.nombre} · ${s.num_control}` }

const form = reactive<{ type: string; evidence: File | null }>({ type: 'medical', evidence: null })
const fileInput = ref<HTMLInputElement | null>(null)

// Alcance
const mode = ref<'full' | 'hours'>('full')
const dayFrom = ref(''); const dayTo = ref(''); const hourDate = ref('')
const schedule = ref<Block[]>([])
const blockChecked = reactive<Record<number, boolean>>({})
const scheduleLoading = ref(false)

// Descripción
const reasonChoice = ref(genericReasons[0]); const customReason = ref('')
const reasonValue = computed(() => reasonChoice.value === '__custom__' ? customReason.value.trim() : reasonChoice.value)

// Modal búsqueda (DataTable paginado + filtros)
const searchOpen = ref(false)
const scopeCareers = ref<Array<{ id: number; name: string }>>([])
const scopeModalities = ref<Array<{ id: number; name: string }>>([])
const mfCareer = ref<number | ''>('')
const mfModality = ref<number | ''>('')
const mfSemester = ref<number | ''>('')

const modalExtraSearch = computed(() => {
    const s: Record<string, any> = {}
    if (mfCareer.value !== '') s.career_id = mfCareer.value
    if (mfModality.value !== '') s.modality_id = mfModality.value
    if (mfSemester.value !== '') s.semester = mfSemester.value
    return s
})
const modalColumns: DataTableColumn<any>[] = [
    { key: 'num_control', label: 'No. Control', searchable: true },
    { key: 'nombre', label: 'Alumno', searchable: true },
    { key: 'carrera', label: 'Carrera' },
    { key: 'modalidad', label: 'Modalidad' },
    { key: 'semestre', label: 'Sem.', align: 'center' },
    { key: 'accion', label: '' },
]
const {
    rows: modalRows, loading: modalLoading, pagination: modalPagination, handleChange: modalOnChange, fetchData: modalFetch,
} = useDataTableFetch<any>({ endpoint: J.studentsPaged, searchableFields: ['num_control', 'nombre'], extraSearch: modalExtraSearch })

// Drawer evidencia
const drawer = reactive<{ open: boolean; loading: boolean; kind: 'image' | 'pdf' | null; url: string | null }>({ open: false, loading: false, kind: null, url: null })

const selectedBlocks = computed(() => schedule.value.filter((_, i) => blockChecked[i]))
const canSave = computed(() => {
    if (!studentId.value || !reasonValue.value) return false
    if (mode.value === 'full') return !!dayFrom.value && !!dayTo.value && dayTo.value >= dayFrom.value
    return !!hourDate.value && selectedBlocks.value.length > 0
})

const page = ref(1); const perPage = ref(25); const term = ref('')
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

function onFile(e: Event) { form.evidence = (e.target as HTMLInputElement).files?.[0] ?? null }

function switchHours() { mode.value = 'hours'; if (studentId.value && hourDate.value) loadSchedule() }
function clearBlocks() { for (const k of Object.keys(blockChecked)) delete blockChecked[Number(k)] }

async function loadSchedule() {
    schedule.value = []; clearBlocks()
    if (!studentId.value || !hourDate.value) return
    scheduleLoading.value = true
    try {
        const { data } = await api.get(J.studentSchedule, { params: { student_id: studentId.value, date: hourDate.value } })
        schedule.value = data
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo cargar el horario.') }
    finally { scheduleLoading.value = false }
}

function range(): { starts_at: string; ends_at: string } {
    if (mode.value === 'full') return { starts_at: `${dayFrom.value} 00:00:00`, ends_at: `${dayTo.value} 23:59:59` }
    const b = selectedBlocks.value
    const start = b.reduce((m, x) => x.start_time < m ? x.start_time : m, b[0].start_time)
    const end = b.reduce((m, x) => x.end_time > m ? x.end_time : m, b[0].end_time)
    return { starts_at: `${hourDate.value} ${start}:00`, ends_at: `${hourDate.value} ${end}:00` }
}

async function save() {
    if (!canSave.value) return
    saving.value = true
    try {
        const { starts_at, ends_at } = range()
        const fd = new FormData()
        fd.append('student_id', String(studentId.value))
        fd.append('type', form.type)
        fd.append('reason', reasonValue.value)
        fd.append('starts_at', starts_at)
        fd.append('ends_at', ends_at)
        if (form.evidence) fd.append('evidence', form.evidence)
        await api.post(J.create, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        toast.success('Justificante registrado.')
        studentId.value = null; dayFrom.value = ''; dayTo.value = ''; hourDate.value = ''
        form.evidence = null; if (fileInput.value) fileInput.value.value = ''
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

// Modal: abrir (carga catálogo + primera página) y re-fetch al cambiar filtros.
let catalogLoaded = false
async function openModal() {
    searchOpen.value = true
    if (!catalogLoaded) {
        try {
            const { data } = await api.get(J.filters)
            scopeCareers.value = data.careers ?? []
            scopeModalities.value = data.modalities ?? []
            catalogLoaded = true
        } catch { /* noop */ }
    }
    modalFetch()
}
watch([mfCareer, mfModality, mfSemester], () => { modalPagination.value.page = 1; modalFetch() })

function selectFromModal(s: Student) {
    studentId.value = s.student_id
    searchOpen.value = false
}

// Drawer de evidencia
function closeDrawer() {
    if (drawer.url) URL.revokeObjectURL(drawer.url)
    drawer.open = false; drawer.url = null; drawer.kind = null
}
function previewSelected() {
    if (!form.evidence) return
    if (drawer.url) URL.revokeObjectURL(drawer.url)
    drawer.kind = form.evidence.type === 'application/pdf' ? 'pdf' : 'image'
    drawer.url = URL.createObjectURL(form.evidence)
    drawer.loading = false; drawer.open = true
}
async function openSavedEvidence(id: number) {
    drawer.open = true; drawer.loading = true; drawer.kind = null
    if (drawer.url) { URL.revokeObjectURL(drawer.url); drawer.url = null }
    try {
        const res = await api.get(J.evidence(id), { responseType: 'blob' })
        const blob = res.data as Blob
        drawer.kind = blob.type === 'application/pdf' ? 'pdf' : 'image'
        drawer.url = URL.createObjectURL(blob)
    } catch { toast.error('No se pudo abrir la evidencia.'); drawer.kind = null }
    finally { drawer.loading = false }
}

async function load() {
    loading.value = true
    try { const { data } = await api.get(J.list); rows.value = data }
    catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo cargar.') }
    finally { loading.value = false }
}

onMounted(load)
</script>
