<template>
    <div class="space-y-5">
        <div class="flex flex-wrap gap-2 items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Expedientes de Titulación</h1>
            <button @click="openNew" class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold">+ Registrar</button>
        </div>

        <div class="rounded-xl border bg-white p-4 grid sm:grid-cols-4 gap-3">
            <select v-model="filters.period_id" aria-label="Periodo" class="rounded-lg border-slate-300 text-sm">
                <option value="">Todos los periodos</option>
                <option v-for="p in options.periods" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
            <select v-model="filters.career_id" aria-label="Carrera" class="rounded-lg border-slate-300 text-sm">
                <option value="">Todas las carreras</option>
                <option v-for="c in options.careers" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
            <select v-model="filters.status" aria-label="Estado" class="rounded-lg border-slate-300 text-sm">
                <option value="">Todos los estados</option>
                <option value="registered">Registrado</option>
                <option value="scheduled">Programado</option>
                <option value="presented">Presentado</option>
                <option value="titulado">Titulado</option>
                <option value="dropped">Baja</option>
            </select>
            <button @click="fetchList" class="px-4 py-2 rounded-lg border text-sm font-semibold text-slate-600">Filtrar</button>
        </div>

        <DataTable :columns="columns" :rows="rows" hide-search caption="Expedientes de Titulación" empty-text="Sin expedientes.">
            <template #cell-student="{ row: r }">
                <div @click="goDetail(r.id)" class="cursor-pointer">
                    <div class="font-semibold text-slate-700">{{ r.student_name }}</div>
                    <div class="text-xs text-slate-400">{{ r.num_control }}</div>
                </div>
            </template>
            <template #cell-career="{ row: r }"><span @click="goDetail(r.id)" class="text-slate-600 cursor-pointer">{{ r.career_name ?? '—' }}</span></template>
            <template #cell-option="{ row: r }"><span @click="goDetail(r.id)" class="text-slate-600 cursor-pointer">{{ r.option_name ?? '—' }}</span></template>
            <template #cell-period="{ row: r }"><span @click="goDetail(r.id)" class="text-slate-600 cursor-pointer">{{ r.period_name ?? '—' }}</span></template>
            <template #cell-status="{ row: r }"><span @click="goDetail(r.id)" class="px-2 py-0.5 rounded-full text-xs font-bold cursor-pointer" :class="statusClass(r.status)">{{ statusLabel(r.status) }}</span></template>
        </DataTable>

        <!-- Modal alta -->
        <BaseModal v-model="showNew" title="Registrar expediente" size="lg">
            <div class="space-y-3">
                <label class="block"><span class="text-xs font-semibold text-slate-500">Buscar alumno (nombre o núm. control)</span>
                    <input v-model="studentQuery" @input="searchStudents" placeholder="Escribe para buscar…" class="mt-1 w-full rounded-lg border-slate-300 text-sm" />
                </label>
                <div v-if="studentResults.length && !form.student_id" class="border rounded-lg max-h-40 overflow-auto text-sm">
                    <div v-for="s in studentResults" :key="s.id" @click="pickStudent(s)" class="px-3 py-2 hover:bg-slate-50 cursor-pointer">
                        <span class="font-semibold text-slate-700">{{ (s.names + ' ' + (s.firstSurname ?? '') + ' ' + (s.secondSurname ?? '')).trim() }}</span>
                        <span class="text-xs text-slate-400"> · {{ s.numControl }}</span>
                    </div>
                </div>
                <div v-if="form.student_id" class="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 flex justify-between items-center">
                    <span>{{ pickedStudentLabel }}</span>
                    <button @click="clearStudent" class="text-xs text-slate-500">cambiar</button>
                </div>

                <label class="block"><span class="text-xs font-semibold text-slate-500">Periodo</span>
                    <select v-model="form.college_academic_period_id" class="mt-1 w-full rounded-lg border-slate-300 text-sm">
                        <option :value="null">— Selecciona —</option>
                        <option v-for="p in options.periods" :key="p.id" :value="p.id">{{ p.name }}</option>
                    </select></label>

                <label class="block"><span class="text-xs font-semibold text-slate-500">Opción de titulación</span>
                    <select v-model="form.titulacion_option_id" @change="onOptionChange" class="mt-1 w-full rounded-lg border-slate-300 text-sm">
                        <option :value="null">— Selecciona —</option>
                        <option v-for="o in opts" :key="o.id" :value="o.id">{{ o.name }}</option>
                    </select></label>

                <div v-if="selectedOption?.requires_residency">
                    <label class="block"><span class="text-xs font-semibold text-slate-500">Residencia concluida</span>
                        <select v-model="form.residency_id" class="mt-1 w-full rounded-lg border-slate-300 text-sm">
                            <option :value="null">— Selecciona —</option>
                            <option v-for="res in eligibleResidencies" :key="res.id" :value="res.id">
                                {{ res.project_title || ('Residencia #' + res.id) }} — {{ res.career_name ?? '' }}
                            </option>
                        </select>
                    </label>
                    <p v-if="form.student_id && !eligibleResidencies.length" class="text-xs text-amber-600 mt-1">
                        El alumno no tiene residencias concluidas.
                    </p>
                </div>

                <label class="block"><span class="text-xs font-semibold text-slate-500">Título del proyecto (opcional)</span>
                    <input v-model="form.project_title" class="mt-1 w-full rounded-lg border-slate-300 text-sm" /></label>

                <p v-if="modalMsg" class="text-sm text-red-600">{{ modalMsg }}</p>
            </div>
            <template #footer>
                <button @click="showNew = false" class="px-4 py-2 rounded-lg border text-sm">Cancelar</button>
                <button @click="create" :disabled="!canCreate || saving" class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">Registrar</button>
            </template>
        </BaseModal>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { TitulacionRecord, TitulacionOption, EligibleResidency } from '@/modules/titulacion/types/titulacion.type'
import { statusLabel, statusClass } from '@/modules/titulacion/pages/status'
import BaseModal from '@/app/components/ui/modal/BaseModal.vue'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'

const T = API.TITULACION_API
const SS = API.SCHOOL_SERVICES_API
const router = useRouter()

const rows = ref<TitulacionRecord[]>([])
const columns: DataTableColumn<TitulacionRecord>[] = [
    { key: 'student', label: 'Alumno' },
    { key: 'career', label: 'Carrera' },
    { key: 'option', label: 'Opción' },
    { key: 'period', label: 'Periodo' },
    { key: 'status', label: 'Estado' },
]
const options = reactive<{ periods: any[]; careers: any[] }>({ periods: [], careers: [] })
const opts = ref<TitulacionOption[]>([])
const filters = reactive({ period_id: '', career_id: '', status: '' })

const showNew = ref(false), saving = ref(false), modalMsg = ref('')
const form = reactive({ student_id: null as number | null, college_academic_period_id: null as number | null, titulacion_option_id: null as number | null, residency_id: null as number | null, project_title: '' })
const studentQuery = ref(''), pickedStudentLabel = ref('')
const studentResults = ref<any[]>([])
const eligibleResidencies = ref<EligibleResidency[]>([])
let searchTimer: any = null

const selectedOption = computed(() => opts.value.find(o => o.id === form.titulacion_option_id) || null)
const canCreate = computed(() => !!form.student_id && !!form.college_academic_period_id && !!form.titulacion_option_id
    && (!selectedOption.value?.requires_residency || !!form.residency_id))

function goDetail(id: number) { router.push({ name: 'titulacion.record-detail', params: { id } }) }

async function fetchList() {
    const { data } = await api.get(T.records.list, { params: { period_id: filters.period_id || undefined, career_id: filters.career_id || undefined, status: filters.status || undefined, per_page: 50 } })
    rows.value = data.data ?? []
}
async function fetchOptions() {
    const { data } = await api.get(T.records.filterOptions)
    options.periods = data.periods ?? []; options.careers = data.careers ?? []
}
async function fetchOpts() { opts.value = (await api.get(T.options)).data ?? [] }

function openNew() {
    Object.assign(form, { student_id: null, college_academic_period_id: null, titulacion_option_id: null, residency_id: null, project_title: '' })
    studentQuery.value = ''; studentResults.value = []; eligibleResidencies.value = []; pickedStudentLabel.value = ''; modalMsg.value = ''
    showNew.value = true
}
function searchStudents() {
    clearTimeout(searchTimer)
    if (studentQuery.value.trim().length < 2) { studentResults.value = []; return }
    searchTimer = setTimeout(async () => {
        const { data } = await api.get(SS.students.list, { params: { 'search[num_control]': studentQuery.value, per_page: 8 } })
        studentResults.value = data.items ?? data.data ?? []
    }, 300)
}
async function pickStudent(s: any) {
    form.student_id = s.id
    pickedStudentLabel.value = `${(s.names + ' ' + (s.firstSurname ?? '')).trim()} · ${s.numControl}`
    studentResults.value = []
    eligibleResidencies.value = (await api.get(T.eligibleResidencies(s.id))).data ?? []
}
function clearStudent() { form.student_id = null; form.residency_id = null; eligibleResidencies.value = [] }
function onOptionChange() { if (!selectedOption.value?.requires_residency) form.residency_id = null }

async function create() {
    saving.value = true; modalMsg.value = ''
    try {
        await api.post(T.records.create, {
            student_id: form.student_id, college_academic_period_id: form.college_academic_period_id,
            titulacion_option_id: form.titulacion_option_id, residency_id: form.residency_id,
            project_title: form.project_title || null,
        })
        showNew.value = false; await fetchList()
    } catch (e: any) { modalMsg.value = e?.response?.data?.message ?? 'No se pudo registrar.' }
    finally { saving.value = false }
}

onMounted(async () => { await Promise.all([fetchOptions(), fetchOpts(), fetchList()]) })
</script>
