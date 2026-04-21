<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Mis Periodos Académicos</h1>
            <button
                class="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                @click="router.push({ name: 'school-services.college-academic-periods.create' })"
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
                    <button
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
                    <button
                        type="button"
                        class="border p-1.5 rounded-md text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition"
                        title="Ajustar fechas"
                        @click="router.push({ name: 'school-services.college-academic-periods.edit', params: { id: row.id } })"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l2.651 2.651M7.5 13.85l-.75 3.75 3.75-.75L19.513 7.138a2.121 2.121 0 00-3-3L7.5 13.85z" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        class="border p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                        title="Eliminar"
                        @click="router.push({ name: 'school-services.college-academic-periods.delete', params: { id: row.id } })"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 7.5h12m-10.5 0v10.125A1.875 1.875 0 009.375 19.5h5.25A1.875 1.875 0 0016.5 17.625V7.5M9.75 4.875A1.875 1.875 0 0111.625 3h.75A1.875 1.875 0 0114.25 4.875L15 7.5h-6l.75-2.625z" />
                        </svg>
                    </button>
                </div>
            </template>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { PlusIcon } from '@heroicons/vue/24/outline'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import { useDataTableFetch } from '@/app/components/ui/datatable/useDataTableFetch'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { AcademicPeriodStatus, CollegeAcademicPeriod } from '@/modules/school-services/types/college-academic-period.type'
import { STATUS_CLASSES, STATUS_OPTIONS } from '@/modules/school-services/types/college-academic-period.type'

const router = useRouter()

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

/* ---------- Cambio de estado inline ---------- */
const savingIds = reactive(new Set<number>())
const savedIds  = reactive(new Set<number>())
const errorMsg  = ref('')

async function onStatusChange(row: CollegeAcademicPeriod, newStatus: string) {
    if (newStatus === row.status) return

    const prevStatus = row.status
    row.status = newStatus as AcademicPeriodStatus
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

fetchData()
</script>
