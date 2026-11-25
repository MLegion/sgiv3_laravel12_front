<template>
    <div class="space-y-3">
        <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold uppercase tracking-widest text-slate-700">
                Aspirantes asignados ({{ assignments.length }} / {{ session.capacity }})
            </h3>
            <button
                v-if="canAssignMore"
                class="flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                @click="showPicker = true"
            >
                <PlusIcon class="w-4 h-4" />
                ASIGNAR ASPIRANTE
            </button>
        </div>

        <!-- Picker modal -->
        <BaseModal v-model="showPicker" title="Asignar aspirante" size="lg">
            <div class="space-y-3">
                <input
                    v-model="searchTerm"
                    type="text"
                    aria-label="Buscar por nombre, folio, CURP"
                    placeholder="Buscar por nombre, folio, CURP..."
                    class="field-sm"
                    @input="onSearch"
                />

                <ul v-if="applicantResults.length > 0" class="max-h-64 overflow-y-auto border border-slate-200 rounded-md text-xs">
                    <li
                        v-for="a in applicantResults"
                        :key="a.id"
                        class="px-3 py-2 hover:bg-blue-50 cursor-pointer flex items-center justify-between"
                        @click="assignApplicant(a)"
                    >
                        <div>
                            <div class="font-medium text-slate-800">
                                {{ a.firstSurname }} {{ a.secondSurname || '' }} {{ a.names }}
                            </div>
                            <div class="text-[10px] text-slate-500">
                                Folio {{ a.preApplicationFolio || '—' }}
                            </div>
                        </div>
                    </li>
                </ul>
                <p v-else-if="searched" class="text-xs text-slate-500 italic">Sin resultados.</p>

                <p v-if="error" class="text-xs text-red-600">{{ error }}</p>
            </div>

            <template #footer>
                <button class="px-3 py-1.5 text-xs rounded-lg border hover:bg-slate-50" @click="showPicker = false">
                    CERRAR
                </button>
            </template>
        </BaseModal>

        <!-- Lista -->
        <SkeletonTable v-if="loading" :rows="5" :cols="7" />
        <DataTable
            v-else
            :columns="columns"
            :rows="assignments"
            hide-search
            caption="Aspirantes asignados"
            empty-text="Aún no hay aspirantes asignados."
        >
            <template #cell-index="{ index }">
                <span class="text-slate-500">{{ index + 1 }}</span>
            </template>
            <template #cell-applicant="{ row }">
                <span class="text-slate-800">
                    {{ row.applicant?.firstSurname }} {{ row.applicant?.secondSurname || '' }} {{ row.applicant?.names }}
                </span>
            </template>
            <template #cell-folio="{ row }">
                <span class="text-slate-600">{{ row.applicant?.preApplicationFolio || '—' }}</span>
            </template>
            <template #cell-assignmentMethod="{ row }">
                <span
                    class="text-[9px] px-1.5 py-0.5 rounded uppercase"
                    :class="row.assignmentMethod === 'AUTO' ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700'"
                >
                    {{ row.assignmentMethod }}
                </span>
            </template>
            <template #cell-seatNumber="{ row }">
                <span class="text-slate-600">{{ row.seatNumber ?? '—' }}</span>
            </template>
            <template #cell-attendanceStatus="{ row }">
                <span :class="attendanceClass(row.attendanceStatus || 'PENDING')" class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded">
                    {{ attendanceLabel(row.attendanceStatus || 'PENDING') }}
                </span>
            </template>
            <template #cell-actions="{ row }">
                <button aria-label="Quitar"
                    class="border p-1 rounded text-slate-500 hover:text-red-600 hover:bg-red-50"
                    title="Quitar"
                    @click="unassign(row)"
                >
                    <TrashIcon class="w-3.5 h-3.5" />
                </button>
            </template>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useConfirm } from '@/app/composables/useConfirm'
import { PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'
import BaseModal from '@/app/components/ui/modal/BaseModal.vue'
import SkeletonTable from '@/app/components/ui/SkeletonTable.vue'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { ExamSession } from '@/modules/admissions/types/exam-session.type'
import type { ApplicantExamAssignment } from '@/modules/admissions/types/applicant-exam-assignment.type'

const columns: DataTableColumn<ApplicantExamAssignment>[] = [
    { key: 'index', label: '#' },
    { key: 'applicant', label: 'Aspirante' },
    { key: 'folio', label: 'Folio' },
    { key: 'assignmentMethod', label: 'Asignación' },
    { key: 'seatNumber', label: 'Asiento', align: 'center' },
    { key: 'attendanceStatus', label: 'Asistencia', align: 'center' },
    { key: 'actions', label: 'Acciones', align: 'center' },
]

interface ApplicantResult {
    id: number
    names: string
    firstSurname: string
    secondSurname: string | null
    preApplicationFolio: string | null
}

const props = defineProps<{ session: ExamSession }>()
const emit = defineEmits<{ (e: 'changed'): void }>()

const assignments = ref<ApplicantExamAssignment[]>([])
const loading     = ref(false)

const showPicker      = ref(false)
const searchTerm      = ref('')
const applicantResults = ref<ApplicantResult[]>([])
const searched        = ref(false)
const error           = ref<string | null>(null)
let searchTimer: number | undefined

const canAssignMore = computed(() =>
    props.session.status === 'SCHEDULED' && assignments.value.length < props.session.capacity,
)

async function load() {
    loading.value = true
    try {
        const { data } = await api.get(API.ADMISSIONS_API.examSessions.assignments.list(props.session.id))
        assignments.value = data
    } finally {
        loading.value = false
    }
}

function onSearch() {
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = window.setTimeout(searchApplicants, 300)
}

async function searchApplicants() {
    error.value = null
    if (!searchTerm.value.trim()) {
        applicantResults.value = []
        searched.value = false
        return
    }
    try {
        const { data } = await api.get(API.ADMISSIONS_API.applicants.list, {
            params: {
                page:      1,
                per_page:  10,
                search:    { name: searchTerm.value },
                order_by:  'first_surname',
                order_dir: 'asc',
            },
        })
        applicantResults.value = data?.data ?? []
        searched.value = true
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudo buscar.'
    }
}

async function assignApplicant(a: ApplicantResult) {
    error.value = null
    try {
        await api.post(API.ADMISSIONS_API.examSessions.assignments.create(props.session.id), {
            applicant_id: a.id,
        })
        showPicker.value      = false
        searchTerm.value      = ''
        applicantResults.value = []
        await load()
        emit('changed')
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudo asignar.'
    }
}

async function unassign(a: ApplicantExamAssignment) {
    if (!await useConfirm().confirm({ title: 'Quitar de la sesión', message: `¿Quitar a ${a.applicant?.firstSurname} ${a.applicant?.names} de esta sesión?`, variant: 'danger', confirmText: 'Quitar' })) return
    await api.delete(API.ADMISSIONS_API.examSessions.assignments.delete(props.session.id, a.id))
    await load()
    emit('changed')
}

function attendanceLabel(s: string): string {
    return ({
        PENDING: 'Pendiente',
        PRESENT: 'Presente',
        ABSENT:  'Ausente',
        INCOMPLETE: 'No term.',
    } as Record<string, string>)[s] ?? s
}

function attendanceClass(s: string): string {
    return ({
        PENDING: 'bg-slate-100 text-slate-600',
        PRESENT: 'bg-emerald-100 text-emerald-700',
        ABSENT:  'bg-red-100 text-red-700',
        INCOMPLETE: 'bg-amber-100 text-amber-700',
    } as Record<string, string>)[s] ?? 'bg-slate-100 text-slate-600'
}

onMounted(load)
</script>

<style scoped>
.field-sm {
    width: 100%;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 13px;
    outline: none;
}
.field-sm:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 2px #e0e7ff;
}
</style>
