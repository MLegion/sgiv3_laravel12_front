<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Mis Periodos Académicos</h1>
            <button
                type="button"
                class="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                @click="openCreate"
            >
                <PlusIcon class="w-4 h-4" />
                ADOPTAR PERIODO
            </button>
        </div>

        <div v-if="errorMsg" class="text-sm px-4 py-3 rounded-lg bg-red-50 text-red-700 border border-red-100">
            {{ errorMsg }}
        </div>

        <div class="bg-white rounded-lg shadow px-4 py-3 flex items-center gap-3">
            <label class="inline-flex items-center gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    v-model="showArchived"
                    @change="onToggleArchived"
                />
                <span class="text-sm text-slate-700">Incluir periodos archivados</span>
            </label>
            <span class="text-xs text-slate-400">
                (ocultos por defecto para facilitar la búsqueda)
            </span>
        </div>

        <DataTable
            :columns="columns"
            :rows="rows"
            :loading="loading"
            :pagination="pagination"
            @change="handleChange"
        >
            <template #cell-name="{ row }">
                {{ row.academicPeriod?.name ?? '-' }}
                <span v-if="row.academicPeriod" class="text-xs text-slate-400 ml-1">({{ row.academicPeriod.shortName }})</span>
            </template>

            <template #cell-status="{ row }">
                <div class="flex items-center gap-2">
                    <select
                        :value="row.status"
                        :disabled="savingIds.has(row.id)"
                        class="text-xs font-semibold rounded-full border-0 focus:ring-2 focus:ring-blue-400 px-3 py-1 cursor-pointer disabled:opacity-60"
                        :class="STATUS_CLASSES[row.status]"
                        @change="onStatusChange(row, ($event.target as HTMLSelectElement).value)"
                    >
                        <option v-for="opt in STATUS_OPTIONS" :key="opt.value" :value="opt.value">
                            {{ opt.label }}
                        </option>
                    </select>
                    <span v-if="savingIds.has(row.id)" class="text-[10px] text-slate-400">Guardando…</span>
                    <span v-else-if="savedIds.has(row.id)" class="text-[10px] text-emerald-600">✓ Guardado</span>
                </div>
            </template>

            <template #cell-opciones="{ row }">
                <div class="flex items-center justify-center gap-2">
                    <button aria-label="Ver"
                        type="button"
                        class="border p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                        title="Ver"
                        @click="router.push({ name: 'school-services.college-academic-periods.show', params: { id: row.id } })"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12s3.75-7.5 9.75-7.5S21.75 12 21.75 12s-3.75 7.5-9.75 7.5S2.25 12 2.25 12z" />
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                    <button aria-label="Ajustar fechas"
                        type="button"
                        class="border p-1.5 rounded-md text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition"
                        title="Ajustar fechas"
                        @click="openEdit(row)"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l2.651 2.651M7.5 13.85l-.75 3.75 3.75-.75L19.513 7.138a2.121 2.121 0 00-3-3L7.5 13.85z" />
                        </svg>
                    </button>
                    <button aria-label="Eliminar"
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

        <BaseModal
            v-model="modalOpen"
            :title="editing ? 'Ajustar Periodo Institucional' : 'Adoptar Periodo Académico'"
            size="lg"
            persistent
        >
            <div class="space-y-5">
                <!-- Alta: selector de periodo global -->
                <FormRemoteSelect
                    v-if="!editing"
                    :key="`period-${modalKey}`"
                    label="PERIODO GLOBAL"
                    v-model="form.academicPeriodId"
                    :endpoint="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.available"
                    :endpoint-by-id="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.availableById"
                    item-label="name"
                    item-value="id"
                    :item-searchs="['name']"
                    required
                />

                <!-- Alta: info del periodo seleccionado -->
                <div v-if="!editing && selectedPeriod" class="rounded-lg bg-blue-50 border border-blue-100 p-4 text-sm text-blue-700 space-y-1">
                    <p><span class="font-semibold">Inicio sugerido:</span> {{ selectedPeriod.suggested_start_date ?? selectedPeriod.suggestedStartDate ?? '—' }}</p>
                    <p><span class="font-semibold">Fin sugerido:</span> {{ selectedPeriod.suggested_end_date ?? selectedPeriod.suggestedEndDate ?? '—' }}</p>
                </div>

                <!-- Edición: periodo global solo lectura -->
                <div v-if="editing && globalPeriod" class="rounded-lg bg-slate-50 border p-4 space-y-1">
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Periodo Global</p>
                    <p class="text-sm font-semibold text-slate-700">{{ globalPeriod.name }} <span class="text-slate-400">({{ globalPeriod.shortName }})</span></p>
                    <p class="text-xs text-slate-500">Sugerido: {{ globalPeriod.suggestedStartDate ?? '—' }} — {{ globalPeriod.suggestedEndDate ?? '—' }}</p>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="space-y-1">
                        <label class="text-xs font-medium text-slate-600">FECHA DE INICIO REAL <span class="text-red-500">*</span></label>
                        <input
                            type="date"
                            v-model="form.actualStartDate"
                            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div class="space-y-1">
                        <label class="text-xs font-medium text-slate-600">FECHA DE FIN REAL <span class="text-red-500">*</span></label>
                        <input
                            type="date"
                            v-model="form.actualEndDate"
                            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <FormSelect
                    label="ESTADO"
                    v-model="form.status"
                    :options="STATUS_OPTIONS"
                />

                <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>
            </div>

            <template #footer>
                <button type="button" class="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="modalOpen = false">
                    CANCELAR
                </button>
                <button
                    type="button"
                    class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    :disabled="submitting"
                    @click="submitForm"
                >
                    {{ submitting ? 'GUARDANDO...' : (editing ? 'ACTUALIZAR' : 'ADOPTAR PERIODO') }}
                </button>
            </template>
        </BaseModal>
    </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { PlusIcon } from '@heroicons/vue/24/outline'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import { useDataTableFetch } from '@/app/components/ui/datatable/useDataTableFetch'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'
import BaseModal from '@/app/components/ui/modal/BaseModal.vue'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'
import FormSelect from '@/app/components/ui/form/FormSelect.vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { AcademicPeriodStatus, CollegeAcademicPeriod } from '@/modules/school-services/types/college-academic-period.type'
import { STATUS_CLASSES, STATUS_OPTIONS } from '@/modules/school-services/types/college-academic-period.type'
import { useConfirm } from '@/app/composables/useConfirm'
import { useToast } from '@/app/composables/useToast'

const router = useRouter()
const { confirm } = useConfirm()
const toast = useToast()

const columns: DataTableColumn<CollegeAcademicPeriod>[] = [
    { key: 'id',              label: '#',              field: 'id',        sortable: true },
    { key: 'name',            label: 'PERIODO GLOBAL', field: 'academicPeriodId',            searchable: true },
    { key: 'actualStartDate', label: 'INICIO REAL',    field: 'actualStartDate' },
    { key: 'actualEndDate',   label: 'FIN REAL',       field: 'actualEndDate' },
    { key: 'status',          label: 'ESTADO' },
    { key: 'opciones',        label: 'OPCIONES' },
]

const showArchived = ref(false)
const extraSearch = computed<Record<string, any>>(() =>
    showArchived.value ? {} : { status_exclude: 'archived' }
)

const { rows, loading, pagination, handleChange, fetchData } =
    useDataTableFetch<CollegeAcademicPeriod>({
        endpoint: API.SCHOOL_SERVICES_API.collegeAcademicPeriods.list,
        extraSearch,
    })

function onToggleArchived() {
    pagination.value.page = 1
    fetchData()
}

/* ---------- Alta / edición en modal ---------- */
const modalOpen = ref(false)
const editing = ref<CollegeAcademicPeriod | null>(null)
const submitting = ref(false)
const formError = ref<string | null>(null)
const modalKey = ref(0)
const selectedPeriod = ref<any>(null)
const globalPeriod = ref<any>(null)

const form = reactive({
    collegeId: 0,
    academicPeriodId: null as number | null,
    actualStartDate: '',
    actualEndDate: '',
    status: 'draft' as string,
})

const toDate = (iso: string | null | undefined) => (iso ? String(iso).substring(0, 10) : '')

function resetForm() {
    form.collegeId = 0
    form.academicPeriodId = null
    form.actualStartDate = ''
    form.actualEndDate = ''
    form.status = 'draft'
    selectedPeriod.value = null
    globalPeriod.value = null
    formError.value = null
}

// Alta: al elegir periodo global, sugerir fechas (igual que el Create original).
watch(() => form.academicPeriodId, async (id) => {
    if (editing.value) return
    if (!id) { selectedPeriod.value = null; return }
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.collegeAcademicPeriods.availableById(id))
        const period = data.data ?? data
        selectedPeriod.value = period

        if (!form.actualStartDate && period.suggested_start_date)
            form.actualStartDate = toDate(period.suggested_start_date)
        if (!form.actualEndDate && period.suggested_end_date)
            form.actualEndDate = toDate(period.suggested_end_date)
    } catch {
        selectedPeriod.value = null
    }
})

function openCreate() {
    editing.value = null
    resetForm()
    modalKey.value++
    modalOpen.value = true
}

async function openEdit(row: CollegeAcademicPeriod) {
    editing.value = row
    resetForm()
    // Hidratar por id antes de abrir.
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.collegeAcademicPeriods.byId(row.id))
        form.collegeId        = data.collegeId
        form.academicPeriodId = data.academicPeriodId
        form.actualStartDate  = toDate(data.actualStartDate)
        form.actualEndDate    = toDate(data.actualEndDate)
        form.status           = data.status
        globalPeriod.value    = data.academicPeriod ?? null
    } catch {
        editing.value = null
        toast.error('No se pudo cargar el periodo.')
        return
    }
    modalKey.value++
    modalOpen.value = true
}

async function submitForm() {
    formError.value = null

    if (!editing.value && !form.academicPeriodId) {
        formError.value = 'Selecciona el periodo global.'
        return
    }
    if (!form.actualStartDate || !form.actualEndDate) {
        formError.value = 'Las fechas de inicio y fin reales son requeridas.'
        return
    }
    if (form.actualStartDate > form.actualEndDate) {
        formError.value = 'La fecha de inicio no puede ser posterior a la fecha de fin.'
        return
    }

    submitting.value = true
    try {
        if (editing.value) {
            await api.put(API.SCHOOL_SERVICES_API.collegeAcademicPeriods.update(editing.value.id), {
                college_id:         form.collegeId,
                academic_period_id: form.academicPeriodId,
                actual_start_date:  form.actualStartDate,
                actual_end_date:    form.actualEndDate,
                status:             form.status,
            })
            toast.success('Periodo actualizado.')
        } else {
            await api.post(API.SCHOOL_SERVICES_API.collegeAcademicPeriods.create, {
                academic_period_id: form.academicPeriodId,
                actual_start_date:  form.actualStartDate,
                actual_end_date:    form.actualEndDate,
                status:             form.status,
            })
            toast.success('Periodo adoptado.')
        }
        modalOpen.value = false
        fetchData()
    } catch (e: any) {
        formError.value = e?.response?.data?.message ?? 'Error al guardar el periodo.'
    } finally {
        submitting.value = false
    }
}

/* ---------- Cambio de estado inline ---------- */
const savingIds = reactive(new Set<number>())
const savedIds  = reactive(new Set<number>())
const errorMsg  = ref('')

async function onStatusChange(row: CollegeAcademicPeriod, newStatus: string) {
    if (newStatus === row.status) return

    const prevStatus = row.status
    // Optimista (también corrige el valor mostrado en el select).
    row.status = newStatus as AcademicPeriodStatus

    // Confirmación para transiciones sensibles / irreversibles.
    if (newStatus === 'closed' || newStatus === 'archived') {
        const ok = await confirm({
            title: newStatus === 'closed' ? 'Cerrar periodo' : 'Archivar periodo',
            message: newStatus === 'closed'
                ? `¿Cerrar "${(row as any).name ?? 'este periodo'}"? Pasa a solo lectura: ya no se podrán cargar ni editar calificaciones. Queda auditado.`
                : `¿Archivar "${(row as any).name ?? 'este periodo'}"? Pasa a histórico.`,
            variant: 'danger',
            confirmText: newStatus === 'closed' ? 'Cerrar' : 'Archivar',
        })
        if (!ok) { row.status = prevStatus; return }
    }

    savingIds.add(row.id)
    errorMsg.value = ''

    try {
        const { data } = await api.patch(
            API.SCHOOL_SERVICES_API.collegeAcademicPeriods.updateStatus(row.id),
            { status: newStatus },
        )
        row.status      = data.status ?? newStatus
        row.statusLabel = data.statusLabel ?? row.statusLabel
        savedIds.add(row.id)
        setTimeout(() => savedIds.delete(row.id), 2000)
    } catch (e: any) {
        row.status = prevStatus
        errorMsg.value = e?.response?.data?.message
            || e?.response?.data?.errors?.status?.[0]
            || 'Error al cambiar el estado.'
    } finally {
        savingIds.delete(row.id)
    }
}

/* ---------- Eliminar con modal inline ---------- */
async function confirmDelete(row: CollegeAcademicPeriod) {
    const ok = await confirm({
        title: 'Eliminar periodo',
        message: `¿Eliminar "${(row as any).name ?? 'este periodo'}" del plantel? No se puede deshacer.`,
        variant: 'danger',
        confirmText: 'Eliminar',
    })
    if (!ok) return
    try {
        await api.delete(API.SCHOOL_SERVICES_API.collegeAcademicPeriods.delete(row.id))
        toast.success('Periodo eliminado.')
        fetchData()
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo eliminar el periodo.')
    }
}

fetchData()
</script>
