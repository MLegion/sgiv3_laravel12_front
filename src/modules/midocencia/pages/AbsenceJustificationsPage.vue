<template>
    <div class="p-4 md:p-6 max-w-5xl mx-auto">
        <h1 class="text-xl font-semibold text-slate-800">Justificantes de inasistencia</h1>
        <p class="text-sm text-slate-500 mb-4">Registra un justificante para un alumno de tu carrera; se refleja automáticamente en la asistencia de sus docentes en los días/horas indicados.</p>

        <!-- Alta -->
        <div class="bg-white rounded-xl border border-slate-200 p-4 mb-5">
            <h2 class="text-sm font-semibold text-slate-700 mb-3">Nuevo justificante</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <!-- Alumno -->
                <div class="sm:col-span-2">
                    <label class="block text-xs font-medium text-slate-600">Alumno</label>
                    <div v-if="form.student" class="mt-1 flex items-center justify-between px-3 py-2 rounded-lg bg-slate-100 text-sm">
                        <span>{{ form.student.nombre }} · <span class="font-mono text-xs">{{ form.student.num_control }}</span></span>
                        <button @click="form.student = null" class="text-slate-400 hover:text-slate-600 text-xs">cambiar</button>
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
                <!-- Tipo -->
                <div>
                    <label class="block text-xs font-medium text-slate-600">Tipo</label>
                    <select v-model="form.type" class="mt-1 w-full rounded-lg border-slate-300 text-sm">
                        <option value="medical">Médico</option>
                        <option value="other">Otro</option>
                    </select>
                </div>
                <!-- Evidencia -->
                <div>
                    <label class="block text-xs font-medium text-slate-600">Evidencia PDF o imagen (opcional)</label>
                    <input type="file" accept="application/pdf,image/jpeg,image/png" @change="onFile" class="mt-1 w-full text-xs" />
                </div>
                <!-- Desde -->
                <div>
                    <label class="block text-xs font-medium text-slate-600">Desde</label>
                    <input type="datetime-local" v-model="form.starts_at" class="mt-1 w-full rounded-lg border-slate-300 text-sm" />
                </div>
                <!-- Hasta -->
                <div>
                    <label class="block text-xs font-medium text-slate-600">Hasta</label>
                    <input type="datetime-local" v-model="form.ends_at" class="mt-1 w-full rounded-lg border-slate-300 text-sm" />
                </div>
                <!-- Motivo (obligatorio) -->
                <div class="sm:col-span-2">
                    <label class="block text-xs font-medium text-slate-600">Descripción / motivo <span class="text-rose-500">*</span></label>
                    <textarea v-model="form.reason" rows="2" maxlength="500" class="mt-1 w-full rounded-lg border-slate-300 text-sm" placeholder="Describe el motivo del justificante…"></textarea>
                </div>
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
interface Row { id: number; type: string; reason: string; starts_at: string; ends_at: string; has_evidence: number; num_control: string; alumno: string; carrera?: string; registrado_por?: string }

const rows = ref<Row[]>([])
const loading = ref(false)
const saving = ref(false)

const studentTerm = ref('')
const studentResults = ref<Student[]>([])
let searchTimer: any = null

const form = reactive<{ student: Student | null; type: string; reason: string; starts_at: string; ends_at: string; evidence: File | null }>({
    student: null, type: 'medical', reason: '', starts_at: '', ends_at: '', evidence: null,
})
const canSave = computed(() => !!form.student && !!form.reason.trim() && !!form.starts_at && !!form.ends_at)

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
function pickStudent(s: Student) { form.student = s; studentResults.value = []; studentTerm.value = '' }
function onFile(e: Event) { form.evidence = (e.target as HTMLInputElement).files?.[0] ?? null }

async function save() {
    if (!canSave.value) return
    saving.value = true
    try {
        const fd = new FormData()
        fd.append('student_id', String(form.student!.student_id))
        fd.append('type', form.type)
        fd.append('reason', form.reason.trim())
        fd.append('starts_at', form.starts_at.replace('T', ' ') + ':00')
        fd.append('ends_at', form.ends_at.replace('T', ' ') + ':00')
        if (form.evidence) fd.append('evidence', form.evidence)
        await api.post(J.create, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        toast.success('Justificante registrado.')
        form.student = null; form.reason = ''; form.starts_at = ''; form.ends_at = ''; form.evidence = null
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
