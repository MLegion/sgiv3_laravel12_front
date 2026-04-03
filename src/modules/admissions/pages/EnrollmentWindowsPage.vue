<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Cortes de Inscripción</h1>
            <button
                class="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                @click="openCreate"
            >
                <PlusIcon class="w-4 h-4" />
                NUEVO CORTE
            </button>
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
                placeholder="Selecciona un período para ver los cortes..."
                @update:model-value="onPeriodFilter"
            />
        </div>

        <!-- Placeholder: sin periodo seleccionado -->
        <div v-if="!filterPeriodId" class="py-16 flex flex-col items-center gap-3 text-center text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
            </svg>
            <p class="text-sm">Selecciona un período académico para ver sus cortes de inscripción.</p>
        </div>

        <DataTable
            v-else
            :columns="columns"
            :rows="rows"
            :loading="loading"
            :pagination="pagination"
            @change="onTableChange"
        >
            <template #cell-name="{ row }">
                <div class="flex items-center gap-2">
                    <span class="font-medium text-slate-700">{{ row.name }}</span>
                    <span
                        v-if="row.isActive"
                        class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-green-100 text-green-700"
                    >ACTIVO</span>
                </div>
            </template>

            <template #cell-period="{ row }">
                <span v-if="row.academicPeriod" class="text-sm text-slate-600">
                    {{ row.academicPeriod.shortName }}
                </span>
                <span v-else class="text-xs text-slate-400 italic">—</span>
            </template>

            <template #cell-startsAt="{ row }">
                <span class="text-sm text-slate-600">{{ formatDate(row.startsAt) }}</span>
            </template>

            <template #cell-endsAt="{ row }">
                <span class="text-sm text-slate-600">{{ formatDate(row.endsAt) }}</span>
            </template>

            <template #cell-opciones="{ row }">
                <div class="flex items-center justify-center gap-2">
                    <button
                        type="button"
                        class="border p-1.5 rounded-md text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition"
                        title="Editar"
                        @click="openEdit(row)"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l2.651 2.651M7.5 13.85l-.75 3.75 3.75-.75L19.513 7.138a2.121 2.121 0 00-3-3L7.5 13.85z" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        class="border p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                        title="Eliminar"
                        @click="confirmDelete(row)"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 7.5h12m-10.5 0v10.125A1.875 1.875 0 009.375 19.5h5.25A1.875 1.875 0 0016.5 17.625V7.5M9.75 4.875A1.875 1.875 0 0111.625 3h.75A1.875 1.875 0 0114.25 4.875L15 7.5h-6l.75-2.625z" />
                        </svg>
                    </button>
                </div>
            </template>
        </DataTable>

        <!-- Modal Crear / Editar -->
        <Teleport to="body">
            <Transition enter-active-class="transition-opacity duration-150" leave-active-class="transition-opacity duration-150" enter-from-class="opacity-0" leave-to-class="opacity-0">
                <div v-if="modalOpen" class="fixed inset-0 z-50 flex items-center justify-center">
                    <div class="absolute inset-0 bg-black/40" @click="closeModal" />
                    <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4">
                        <h2 class="text-sm font-bold uppercase tracking-widest text-slate-700">
                            {{ editing ? 'Editar Corte' : 'Nuevo Corte de Inscripción' }}
                        </h2>

                        <div class="space-y-3">
                            <!-- Periodo académico -->
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Período Académico</label>
                                <FormRemoteSelect
                                    v-model="form.academic_period_id"
                                    :endpoint="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.list"
                                    :endpoint-by-id="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.resolveByPeriodId"
                                    :params="{ order_by: 'actual_start_date', order_dir: 'desc' }"
                                    item-label="name"
                                    item-value="academicPeriodId"
                                    placeholder="Seleccionar período académico..."
                                />
                            </div>

                            <!-- Nombre -->
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Nombre del corte</label>
                                <input
                                    v-model="form.name"
                                    type="text"
                                    maxlength="120"
                                    placeholder="Ej. 1ER CORTE, 2DO CORTE..."
                                    class="field-upper"
                                />
                            </div>

                            <!-- Fechas -->
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Inicio</label>
                                    <input v-model="form.starts_at" type="date" class="field" />
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Cierre</label>
                                    <input v-model="form.ends_at" type="date" class="field" />
                                </div>
                            </div>

                            <p v-if="formError" class="text-xs text-red-600">{{ formError }}</p>
                        </div>

                        <div class="flex justify-end gap-2 pt-2">
                            <button class="px-4 py-2 text-sm rounded-lg border hover:bg-slate-50 transition" @click="closeModal">CANCELAR</button>
                            <button
                                class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
                                :disabled="submitting"
                                @click="submitForm"
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
                        <h2 class="text-sm font-bold uppercase tracking-widest text-slate-700">Eliminar Corte</h2>
                        <p class="text-sm text-slate-600">
                            ¿Eliminar el corte <span class="font-semibold">{{ deleteTarget.name }}</span>? Esta acción no se puede deshacer.
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
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { PlusIcon } from '@heroicons/vue/24/outline'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'
import { useDataTableFetch } from '@/app/components/ui/datatable/useDataTableFetch'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { EnrollmentWindow } from '@/modules/admissions/types/enrollment-window.type'

const columns: DataTableColumn<EnrollmentWindow>[] = [
    { key: 'id',       label: '#',       field: 'id',   sortable: true },
    { key: 'name',     label: 'NOMBRE',  field: 'name', sortable: true, searchable: true },
    { key: 'period',   label: 'PERIODO' },
    { key: 'startsAt', label: 'INICIO',  field: 'startsAt', sortable: true },
    { key: 'endsAt',   label: 'CIERRE',  field: 'endsAt',   sortable: true },
    { key: 'opciones', label: 'OPCIONES' },
]

const filterPeriodId  = ref<number | null>(null)
const periodSearch    = ref<Record<string, any>>({})

const { rows, loading, pagination, handleChange, fetchData } =
    useDataTableFetch<EnrollmentWindow>({
        endpoint:    API.ADMISSIONS_API.enrollmentWindows.list,
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

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dt: string): string {
    if (!dt) return '—'
    return new Date(dt).toLocaleDateString('es-MX', {
        day: '2-digit', month: 'short', year: 'numeric',
    })
}

function toDateInput(dt: string): string {
    if (!dt) return ''
    return dt.slice(0, 10)
}

// ── Modal Crear / Editar ──────────────────────────────────────────────────────

const modalOpen  = ref(false)
const editing    = ref<EnrollmentWindow | null>(null)
const submitting = ref(false)
const formError  = ref<string | null>(null)

const form = ref({
    name:               '',
    starts_at:          '',
    ends_at:            '',
    academic_period_id: null as number | null,
})

function openCreate() {
    editing.value   = null
    form.value      = { name: '', starts_at: '', ends_at: '', academic_period_id: filterPeriodId.value }
    formError.value = null
    modalOpen.value = true
}

function openEdit(row: EnrollmentWindow) {
    editing.value = row
    form.value = {
        name:               row.name,
        starts_at:          toDateInput(row.startsAt),
        ends_at:            toDateInput(row.endsAt),
        academic_period_id: row.academicPeriodId ?? null,
    }
    formError.value = null
    modalOpen.value = true
}

function closeModal() {
    modalOpen.value = false
    editing.value   = null
}

async function submitForm() {
    formError.value = null
    if (!form.value.name.trim()) { formError.value = 'El nombre es requerido.'; return }
    if (!form.value.starts_at)   { formError.value = 'La fecha de inicio es requerida.'; return }
    if (!form.value.ends_at)     { formError.value = 'La fecha de cierre es requerida.'; return }
    if (form.value.starts_at > form.value.ends_at) {
        formError.value = 'El cierre debe ser posterior o igual al inicio.'
        return
    }

    submitting.value = true
    try {
        const payload = {
            name:               form.value.name.toUpperCase(),
            starts_at:          form.value.starts_at + ' 00:00:00',
            ends_at:            form.value.ends_at   + ' 23:59:59',
            academic_period_id: form.value.academic_period_id || null,
        }

        if (editing.value) {
            await api.put(API.ADMISSIONS_API.enrollmentWindows.update(editing.value.id), payload)
        } else {
            await api.post(API.ADMISSIONS_API.enrollmentWindows.create, payload)
        }

        closeModal()
        fetchData()
    } catch (e: any) {
        formError.value = e?.response?.data?.message ?? 'Error al guardar.'
    } finally {
        submitting.value = false
    }
}

// ── Eliminar ──────────────────────────────────────────────────────────────────

const deleteTarget = ref<EnrollmentWindow | null>(null)
const deleting     = ref(false)

function confirmDelete(row: EnrollmentWindow) {
    deleteTarget.value = row
}

async function doDelete() {
    if (!deleteTarget.value) return
    deleting.value = true
    try {
        await api.delete(API.ADMISSIONS_API.enrollmentWindows.delete(deleteTarget.value.id))
        deleteTarget.value = null
        fetchData()
    } catch (e: any) {
        console.error('[EnrollmentWindowsPage] Error eliminando:', e)
    } finally {
        deleting.value = false
    }
}

onMounted(() => { /* espera selección de periodo */ })
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
.field-upper {
    composes: field;
    text-transform: uppercase;
}
</style>
