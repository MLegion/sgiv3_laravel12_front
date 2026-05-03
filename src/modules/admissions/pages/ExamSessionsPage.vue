<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Sesiones de Examen de Admisión</h1>
            <div class="flex gap-2">
                <RouterLink
                    v-if="filterPeriodId"
                    :to="{ name: 'admissions.exam-sessions.assign', query: { period: filterPeriodId } }"
                    class="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 transition"
                >
                    DISTRIBUIR ASPIRANTES
                </RouterLink>
                <button
                    class="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                    :disabled="!filterPeriodId"
                    @click="openCreate"
                >
                    <PlusIcon class="w-4 h-4" />
                    NUEVA SESIÓN
                </button>
            </div>
        </div>

        <!-- Filtro por periodo -->
        <div class="max-w-xs">
            <FormRemoteSelect
                v-model="filterPeriodId"
                :endpoint="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.list"
                :endpoint-by-id="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.resolveByPeriodId"
                :params="{ order_by: 'actual_start_date', order_dir: 'desc' }"
                item-label="name"
                item-value="academicPeriodId"
                placeholder="Selecciona un período para ver sesiones..."
                @update:model-value="onPeriodFilter"
            />
        </div>

        <div v-if="!filterPeriodId" class="py-16 flex flex-col items-center gap-3 text-center text-slate-400">
            <CalendarIcon class="w-10 h-10" />
            <p class="text-sm">Selecciona un período académico para listar las sesiones de examen.</p>
        </div>

        <DataTable
            v-else
            :columns="columns"
            :rows="rows"
            :loading="loading"
            :pagination="pagination"
            @change="onTableChange"
        >
            <template #cell-date="{ row }">
                <span class="text-sm text-slate-700">{{ formatDate(row.date) }}</span>
            </template>

            <template #cell-time="{ row }">
                <span class="text-sm text-slate-600">{{ row.startTime?.slice(0, 5) }} – {{ row.endTime?.slice(0, 5) }}</span>
            </template>

            <template #cell-place="{ row }">
                <div class="text-sm text-slate-700">
                    {{ row.place?.name ?? '—' }}
                    <span v-if="row.place?.shortName" class="text-xs text-slate-400 ml-1">({{ row.place.shortName }})</span>
                </div>
            </template>

            <template #cell-capacity="{ row }">
                <span class="text-sm text-slate-700">{{ row.assignedCount }} / {{ row.capacity }}</span>
            </template>

            <template #cell-proctors="{ row }">
                <span class="text-xs text-slate-600">{{ row.proctorsCount }}</span>
            </template>

            <template #cell-status="{ row }">
                <span :class="statusClass(row.status)" class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                    {{ statusLabel(row.status) }}
                </span>
            </template>

            <template #cell-opciones="{ row }">
                <div class="flex items-center justify-center gap-1">
                    <button
                        v-if="row.status === 'SCHEDULED'"
                        type="button"
                        class="border p-1.5 rounded-md text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition"
                        title="Editar"
                        @click="openEdit(row)"
                    >
                        <PencilIcon class="w-4 h-4" />
                    </button>
                    <button
                        v-if="row.status === 'SCHEDULED' || row.status === 'IN_PROGRESS'"
                        type="button"
                        class="border p-1.5 rounded-md text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition"
                        title="Reagendar"
                        @click="openReschedule(row)"
                    >
                        <ArrowPathIcon class="w-4 h-4" />
                    </button>
                    <RouterLink
                        :to="{ name: 'admissions.exam-sessions.detail', params: { id: row.id } }"
                        class="border p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                        title="Detalle / Aspirantes / Cuidadores"
                    >
                        <UsersIcon class="w-4 h-4" />
                    </RouterLink>
                    <button
                        v-if="row.status === 'SCHEDULED'"
                        type="button"
                        class="border p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                        title="Eliminar"
                        @click="confirmDelete(row)"
                    >
                        <TrashIcon class="w-4 h-4" />
                    </button>
                </div>
            </template>
        </DataTable>

        <!-- Modal Crear / Editar / Reagendar -->
        <Teleport to="body">
            <Transition enter-active-class="transition-opacity duration-150" leave-active-class="transition-opacity duration-150" enter-from-class="opacity-0" leave-to-class="opacity-0">
                <div v-if="modalOpen" class="fixed inset-0 z-50 flex items-center justify-center">
                    <div class="absolute inset-0 bg-black/40" @click="closeModal" />
                    <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 space-y-4">
                        <h2 class="text-sm font-bold uppercase tracking-widest text-slate-700">
                            {{ modalTitle }}
                        </h2>

                        <div class="space-y-3">
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Aula</label>
                                <FormRemoteSelect
                                    v-model="form.place_id"
                                    :endpoint="API.SCHOOL_SERVICES_API.places.list"
                                    :endpoint-by-id="API.SCHOOL_SERVICES_API.places.byId"
                                    item-label="name"
                                    item-value="id"
                                    placeholder="Selecciona aula..."
                                    @select="onPlaceSelected"
                                />
                            </div>

                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Fecha</label>
                                    <input v-model="form.date" type="date" class="field" />
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Inicio</label>
                                    <input v-model="form.start_time" type="time" class="field" />
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">
                                        Duración (min)
                                        <span class="text-slate-400 text-[10px] normal-case">— default {{ defaultDuration }}</span>
                                    </label>
                                    <input v-model.number="form.duration_minutes" type="number" min="30" max="480" :placeholder="String(defaultDuration)" class="field" />
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">
                                        Capacidad
                                        <span v-if="placeCapacity" class="text-slate-400 text-[10px] normal-case">— aula {{ placeCapacity }}</span>
                                    </label>
                                    <input v-model.number="form.capacity" type="number" min="1" max="1000" class="field" />
                                </div>
                            </div>

                            <div v-if="reschedulingTarget">
                                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Razón del reagendado *</label>
                                <textarea v-model="form.reason" rows="2" maxlength="500" class="field"></textarea>
                            </div>

                            <div>
                                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Notas</label>
                                <textarea v-model="form.notes" rows="2" maxlength="1000" class="field"></textarea>
                            </div>

                            <p v-if="formError" class="text-xs text-red-600">{{ formError }}</p>
                        </div>

                        <div class="flex justify-end gap-2 pt-2">
                            <button class="px-4 py-2 text-sm rounded-lg border hover:bg-slate-50 transition" @click="closeModal">CANCELAR</button>
                            <button
                                class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
                                :disabled="submitting"
                                @click="onSubmit"
                            >
                                {{ submitting ? 'GUARDANDO...' : 'GUARDAR' }}
                            </button>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>

        <!-- Modal Confirmar Eliminar -->
        <Teleport to="body">
            <Transition enter-active-class="transition-opacity duration-150" leave-active-class="transition-opacity duration-150" enter-from-class="opacity-0" leave-to-class="opacity-0">
                <div v-if="deleteTarget" class="fixed inset-0 z-50 flex items-center justify-center">
                    <div class="absolute inset-0 bg-black/40" @click="deleteTarget = null" />
                    <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-4">
                        <h2 class="text-sm font-bold uppercase tracking-widest text-slate-700">Eliminar sesión</h2>
                        <p class="text-sm text-slate-600">
                            ¿Eliminar la sesión del <strong>{{ formatDate(deleteTarget.date) }}</strong>
                            en <strong>{{ deleteTarget.place?.name }}</strong>?
                            Se quitarán todas las asignaciones de aspirantes y cuidadores. No se puede deshacer.
                        </p>
                        <div class="flex justify-end gap-2">
                            <button class="px-4 py-2 text-sm rounded-lg border hover:bg-slate-50 transition" @click="deleteTarget = null">CANCELAR</button>
                            <button
                                class="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition"
                                :disabled="deleting"
                                @click="doDelete"
                            >
                                {{ deleting ? 'ELIMINANDO...' : 'ELIMINAR' }}
                            </button>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>

        <!-- Modal Conflictos -->
        <ExamConflictsModal
            :open="conflictsOpen"
            :report="conflictsReport"
            :date="form.date"
            :start-time="conflictsStartTime"
            :end-time="conflictsEndTime"
            :submitting="submitting"
            @cancel="conflictsOpen = false"
            @confirm="onConflictsConfirmed"
        />
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { PlusIcon, PencilIcon, TrashIcon, ArrowPathIcon, UsersIcon, CalendarIcon } from '@heroicons/vue/24/outline'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'
import { useDataTableFetch } from '@/app/components/ui/datatable/useDataTableFetch'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import ExamConflictsModal from '@/modules/admissions/components/ExamConflictsModal.vue'
import type {
    ExamSession,
    ExamConflictReport,
    PartialOverrideInput,
    PreviewConflictsResponse,
} from '@/modules/admissions/types/exam-session.type'

const columns: DataTableColumn<ExamSession>[] = [
    { key: 'id',        label: '#',          field: 'id',   sortable: true },
    { key: 'date',      label: 'FECHA',      field: 'date', sortable: true },
    { key: 'time',      label: 'HORARIO' },
    { key: 'place',     label: 'AULA' },
    { key: 'capacity',  label: 'OCUPACIÓN' },
    { key: 'proctors',  label: 'CUIDADORES' },
    { key: 'status',    label: 'ESTADO' },
    { key: 'opciones',  label: 'OPCIONES' },
]

const filterPeriodId = ref<number | null>(null)
const periodSearch   = ref<Record<string, any>>({})
const defaultDuration = ref<number>(120)

const { rows, loading, pagination, handleChange, fetchData } =
    useDataTableFetch<ExamSession>({
        endpoint:    API.ADMISSIONS_API.examSessions.list,
        extraSearch: periodSearch,
    })

function onPeriodFilter(val: number | null) {
    periodSearch.value = val ? { academic_period_id: val } : {}
    if (val) fetchData()
}

function onTableChange(event: any) {
    if (!filterPeriodId.value) return
    handleChange(event)
}

function formatDate(s: string): string {
    if (!s) return '—'
    return new Date(s).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function statusLabel(s: string): string {
    const map: Record<string, string> = {
        SCHEDULED:   'Programada',
        IN_PROGRESS: 'En curso',
        COMPLETED:   'Concluida',
        CANCELLED:   'Cancelada',
        RESCHEDULED: 'Reagendada',
    }
    return map[s] ?? s
}

function statusClass(s: string): string {
    const map: Record<string, string> = {
        SCHEDULED:   'bg-blue-100 text-blue-700',
        IN_PROGRESS: 'bg-emerald-100 text-emerald-700',
        COMPLETED:   'bg-slate-200 text-slate-600',
        CANCELLED:   'bg-red-100 text-red-700',
        RESCHEDULED: 'bg-purple-100 text-purple-700',
    }
    return map[s] ?? 'bg-slate-100 text-slate-600'
}

// ── Modal Crear / Editar / Reagendar ─────────────────────────────────────────

const modalOpen          = ref(false)
const editing            = ref<ExamSession | null>(null)
const reschedulingTarget = ref<ExamSession | null>(null)
const submitting         = ref(false)
const formError          = ref<string | null>(null)
const placeCapacity      = ref<number | null>(null)

const form = ref({
    place_id:         null as number | null,
    date:             '',
    start_time:       '',
    duration_minutes: null as number | null,
    capacity:         40 as number,
    reason:           '',
    notes:            '' as string | null,
})

const modalTitle = computed(() => {
    if (reschedulingTarget.value) return 'Reagendar sesión'
    if (editing.value)            return 'Editar sesión'
    return 'Nueva sesión de examen'
})

function resetForm() {
    form.value = {
        place_id:         null,
        date:             '',
        start_time:       '',
        duration_minutes: null,
        capacity:         40,
        reason:           '',
        notes:            '',
    }
    placeCapacity.value = null
    formError.value     = null
}

function openCreate() {
    if (!filterPeriodId.value) return
    editing.value            = null
    reschedulingTarget.value = null
    resetForm()
    modalOpen.value = true
}

function openEdit(row: ExamSession) {
    editing.value            = row
    reschedulingTarget.value = null
    resetForm()
    form.value.place_id   = row.placeId
    form.value.date       = row.date?.slice(0, 10) ?? ''
    form.value.start_time = row.startTime?.slice(0, 5) ?? ''
    form.value.capacity   = row.capacity
    form.value.notes      = row.notes ?? ''
    placeCapacity.value   = row.place?.capacity ?? null
    modalOpen.value       = true
}

function openReschedule(row: ExamSession) {
    editing.value            = null
    reschedulingTarget.value = row
    resetForm()
    form.value.place_id   = row.placeId
    form.value.date       = row.date?.slice(0, 10) ?? ''
    form.value.start_time = row.startTime?.slice(0, 5) ?? ''
    form.value.capacity   = row.capacity
    form.value.notes      = row.notes ?? ''
    placeCapacity.value   = row.place?.capacity ?? null
    modalOpen.value       = true
}

function closeModal() {
    modalOpen.value          = false
    editing.value            = null
    reschedulingTarget.value = null
}

function onPlaceSelected(item: any) {
    placeCapacity.value = item?.capacity ?? null
    if (placeCapacity.value && !editing.value && !reschedulingTarget.value) {
        form.value.capacity = placeCapacity.value
    }
}

// ── Submit con preview de conflictos ─────────────────────────────────────────

const conflictsOpen      = ref(false)
const conflictsReport    = ref<ExamConflictReport>({
    scolarized: [], semiSchoolarized: [], complementary: [], otherExams: [], other: [],
})
const conflictsStartTime = ref('')
const conflictsEndTime   = ref('')

async function onSubmit() {
    formError.value = null
    if (!form.value.place_id)   { formError.value = 'Aula es requerida.';   return }
    if (!form.value.date)       { formError.value = 'Fecha es requerida.';  return }
    if (!form.value.start_time) { formError.value = 'Hora de inicio es requerida.'; return }
    if (!form.value.capacity || form.value.capacity < 1) { formError.value = 'Capacidad inválida.'; return }
    if (reschedulingTarget.value && !form.value.reason?.trim()) {
        formError.value = 'La razón del reagendado es requerida.'
        return
    }

    // 1) Preview de conflictos
    try {
        const { data } = await api.post<PreviewConflictsResponse>(API.ADMISSIONS_API.examSessions.previewConflicts, {
            place_id:           form.value.place_id,
            date:               form.value.date,
            start_time:         form.value.start_time,
            duration_minutes:   form.value.duration_minutes,
            exclude_session_id: editing.value?.id ?? null,
        })

        if (data.hasConflicts) {
            conflictsReport.value    = data.conflicts
            conflictsStartTime.value = data.startTime
            conflictsEndTime.value   = data.endTime
            conflictsOpen.value      = true
            return
        }
    } catch (e: any) {
        formError.value = e?.response?.data?.message ?? 'No se pudo verificar conflictos.'
        return
    }

    // 2) Sin conflictos → guardar directo
    await persist({})
}

async function onConflictsConfirmed(overrides: Record<number, PartialOverrideInput>) {
    conflictsOpen.value = false
    await persist(overrides)
}

async function persist(partialOverrides: Record<number, PartialOverrideInput>) {
    submitting.value = true
    try {
        const basePayload = {
            academic_period_id: filterPeriodId.value,
            place_id:           form.value.place_id,
            date:               form.value.date,
            start_time:         form.value.start_time,
            capacity:           form.value.capacity,
            duration_minutes:   form.value.duration_minutes ?? null,
            notes:              form.value.notes ?? null,
            confirm_conflicts:  Object.keys(partialOverrides).length > 0 || conflictsHadAny(),
            partial_overrides:  partialOverrides,
        }

        if (reschedulingTarget.value) {
            await api.post(API.ADMISSIONS_API.examSessions.reschedule(reschedulingTarget.value.id), {
                ...basePayload,
                reason: form.value.reason,
            })
        } else if (editing.value) {
            await api.put(API.ADMISSIONS_API.examSessions.update(editing.value.id), basePayload)
        } else {
            await api.post(API.ADMISSIONS_API.examSessions.create, basePayload)
        }

        closeModal()
        fetchData()
    } catch (e: any) {
        formError.value = e?.response?.data?.message ?? 'Error al guardar.'
    } finally {
        submitting.value = false
    }
}

function conflictsHadAny(): boolean {
    const r = conflictsReport.value
    return Boolean(
        r.scolarized?.length ||
        r.semiSchoolarized?.length ||
        r.complementary?.length ||
        r.other?.length,
    )
}

// ── Eliminar ─────────────────────────────────────────────────────────────────

const deleteTarget = ref<ExamSession | null>(null)
const deleting     = ref(false)

function confirmDelete(row: ExamSession) {
    deleteTarget.value = row
}

async function doDelete() {
    if (!deleteTarget.value) return
    deleting.value = true
    try {
        await api.delete(API.ADMISSIONS_API.examSessions.delete(deleteTarget.value.id))
        deleteTarget.value = null
        fetchData()
    } catch (e: any) {
        console.error('[ExamSessionsPage] delete error:', e)
    } finally {
        deleting.value = false
    }
}
</script>

<style scoped>
.field {
    width: 100%;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 13px;
    outline: none;
    transition: box-shadow 0.15s;
}
.field:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 2px #e0e7ff;
}
</style>
