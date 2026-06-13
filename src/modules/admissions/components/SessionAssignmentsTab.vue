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
        <Teleport to="body">
            <Transition enter-active-class="transition-opacity duration-150" leave-active-class="transition-opacity duration-150" enter-from-class="opacity-0" leave-to-class="opacity-0">
                <div v-if="showPicker" class="fixed inset-0 z-50 flex items-center justify-center">
                    <div class="absolute inset-0 bg-black/40" @click="showPicker = false" />
                    <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 space-y-3">
                        <h3 class="text-sm font-bold uppercase tracking-widest text-slate-700">Asignar aspirante</h3>

                        <input
                            v-model="searchTerm"
                            type="text"
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

                        <div class="flex justify-end pt-1">
                            <button class="px-3 py-1.5 text-xs rounded-lg border hover:bg-slate-50" @click="showPicker = false">
                                CERRAR
                            </button>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>

        <!-- Lista -->
        <div v-if="loading" class="text-xs text-slate-400 italic">Cargando...</div>
        <div class="overflow-x-auto w-full"><table v-else-if="assignments.length > 0" class="w-full text-xs border border-slate-200 rounded-md overflow-hidden">
            <thead class="bg-slate-50">
                <tr class="text-slate-600">
                    <th scope="col" class="px-2 py-1 text-left">#</th>
                    <th scope="col" class="px-2 py-1 text-left">Aspirante</th>
                    <th scope="col" class="px-2 py-1 text-left">Folio</th>
                    <th scope="col" class="px-2 py-1 text-left">Asignación</th>
                    <th scope="col" class="px-2 py-1 text-center">Asiento</th>
                    <th scope="col" class="px-2 py-1 text-center">Asistencia</th>
                    <th scope="col" class="px-2 py-1 text-center">Acciones</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(a, idx) in assignments" :key="a.id" class="border-t border-slate-100 hover:bg-slate-50">
                    <td class="px-2 py-1 text-slate-500">{{ idx + 1 }}</td>
                    <td class="px-2 py-1 text-slate-800">
                        {{ a.applicant?.firstSurname }} {{ a.applicant?.secondSurname || '' }} {{ a.applicant?.names }}
                    </td>
                    <td class="px-2 py-1 text-slate-600">{{ a.applicant?.preApplicationFolio || '—' }}</td>
                    <td class="px-2 py-1">
                        <span
                            class="text-[9px] px-1.5 py-0.5 rounded uppercase"
                            :class="a.assignmentMethod === 'AUTO' ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700'"
                        >
                            {{ a.assignmentMethod }}
                        </span>
                    </td>
                    <td class="px-2 py-1 text-center text-slate-600">{{ a.seatNumber ?? '—' }}</td>
                    <td class="px-2 py-1 text-center">
                        <span :class="attendanceClass(a.attendanceStatus || 'PENDING')" class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded">
                            {{ attendanceLabel(a.attendanceStatus || 'PENDING') }}
                        </span>
                    </td>
                    <td class="px-2 py-1 text-center">
                        <button aria-label="Quitar"
                            class="border p-1 rounded text-slate-500 hover:text-red-600 hover:bg-red-50"
                            title="Quitar"
                            @click="unassign(a)"
                        >
                            <TrashIcon class="w-3.5 h-3.5" />
                        </button>
                    </td>
                </tr>
            </tbody>
        </table></div>
        <p v-else class="text-xs text-slate-400 italic">Aún no hay aspirantes asignados.</p>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useConfirm } from '@/app/composables/useConfirm'
import { PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { ExamSession } from '@/modules/admissions/types/exam-session.type'
import type { ApplicantExamAssignment } from '@/modules/admissions/types/applicant-exam-assignment.type'

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
