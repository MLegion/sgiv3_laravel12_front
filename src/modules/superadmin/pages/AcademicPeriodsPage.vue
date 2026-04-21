<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">PERIODOS ACADÉMICOS</h1>
            <button
                class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                @click="router.push({ name: 'superadmin.academic-periods.create' })"
            >
                NUEVO PERIODO
            </button>
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
            <template #cell-status="{ row }">
                <span
                    class="px-2 py-1 text-xs font-semibold rounded-full"
                    :class="STATUS_CLASSES[row.status]"
                >
                    {{ row.statusLabel }}
                </span>
            </template>

            <template #cell-opciones="{ row }">
                <div class="flex items-center justify-center gap-2">
                    <!-- Ver -->
                    <button
                        type="button"
                        class="border p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                        title="Ver periodo"
                        @click="router.push({ name: 'superadmin.academic-periods.show', params: { id: row.id } })"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12s3.75-7.5 9.75-7.5S21.75 12 21.75 12s-3.75 7.5-9.75 7.5S2.25 12 2.25 12z" />
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                    <!-- Editar -->
                    <button
                        type="button"
                        class="border p-1.5 rounded-md text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                        title="Editar periodo"
                        @click="router.push({ name: 'superadmin.academic-periods.edit', params: { id: row.id } })"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l2.651 2.651M7.5 13.85l-.75 3.75 3.75-.75L19.513 7.138a2.121 2.121 0 00-3-3L7.5 13.85z" />
                        </svg>
                    </button>
                    <!-- Eliminar -->
                    <button
                        type="button"
                        class="border p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Eliminar periodo"
                        @click="router.push({ name: 'superadmin.academic-periods.delete', params: { id: row.id } })"
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
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import { useDataTableFetch } from '@/app/components/ui/datatable/useDataTableFetch'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'
import { API } from '@/shared/api'
import type { AcademicPeriod } from '@/modules/superadmin/types/academic-period.type'
import { ACADEMIC_PERIOD_STATUS_CLASSES as STATUS_CLASSES } from '@/modules/superadmin/types/academic-period.type'

const router = useRouter()

const columns: DataTableColumn<AcademicPeriod>[] = [
    { key: 'id',                 label: '#',             field: 'id',        sortable: true },
    { key: 'name',               label: 'NOMBRE',        field: 'name',      sortable: true, searchable: true },
    { key: 'short_name',         label: 'CLAVE',         field: 'shortName',                 searchable: true },
    { key: 'suggestedStartDate', label: 'INICIO SUGER.', field: 'suggestedStartDate' },
    { key: 'suggestedEndDate',   label: 'FIN SUGER.',    field: 'suggestedEndDate' },
    { key: 'status',             label: 'ESTADO' },
    { key: 'opciones',           label: 'OPCIONES' },
]

const showArchived = ref(false)
const extraSearch = computed<Record<string, any>>(() =>
    showArchived.value ? {} : { status_exclude: 'archived' }
)

const { rows, loading, pagination, handleChange, fetchData } =
    useDataTableFetch<AcademicPeriod>({
        endpoint: API.SUPERADMIN_API.academicPeriods.list,
        extraSearch,
    })

function onToggleArchived() {
    pagination.value.page = 1
    fetchData()
}

fetchData()
</script>
