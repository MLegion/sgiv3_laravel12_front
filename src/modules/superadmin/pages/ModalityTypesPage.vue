<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">
                TIPOS DE MODALIDAD
            </h1>

            <button
                class="px-4 py-2 text-sm rounded-lg
                       bg-blue-600 text-white hover:bg-blue-700"
                @click="create"
            >
                NUEVO TIPO DE MODALIDAD
            </button>
        </div>

        <DataTable
            :columns="columns"
            :rows="rows"
            :loading="loading"
            :pagination="pagination"
            @change="handleChange"
        >
            <template #cell-isActive="{ value }">
                <span
                    class="px-2 py-1 text-xs rounded-full"
                    :class="value
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'"
                >
                    {{ value ? 'ACTIVO' : 'INACTIVO' }}
                </span>
            </template>

            <template #cell-opciones="{ row }">
                <div class="flex items-center justify-center gap-2">
                    <!-- Ver -->
                    <button
                        type="button"
                        class="border p-1.5 rounded-md text-slate-500
                               hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                        title="Ver tipo de modalidad"
                        @click="show(row)"
                    >
                        <!-- Heroicon Eye -->
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            class="w-4 h-4"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M2.25 12s3.75-7.5 9.75-7.5S21.75 12 21.75 12s-3.75 7.5-9.75 7.5S2.25 12 2.25 12z"
                            />
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                        </svg>
                    </button>

                    <!-- Editar -->
                    <button
                        type="button"
                        class="border p-1.5 rounded-md text-slate-500
                               hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                        title="Editar tipo de modalidad"
                        @click="edit(row)"
                    >
                        <!-- Heroicon Pencil -->
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            class="w-4 h-4"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M16.862 4.487l2.651 2.651M7.5 13.85l-.75 3.75 3.75-.75L19.513 7.138a2.121 2.121 0 00-3-3L7.5 13.85z"
                            />
                        </svg>
                    </button>

                    <!-- Eliminar -->
                    <button
                        type="button"
                        class="border p-1.5 rounded-md text-slate-500
                               hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Eliminar tipo de modalidad"
                        @click="remove(row)"
                    >
                        <!-- Heroicon Trash -->
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            class="w-4 h-4"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M6 7.5h12m-10.5 0v10.125A1.875 1.875 0 009.375 19.5h5.25A1.875 1.875 0 0016.5 17.625V7.5M9.75 4.875A1.875 1.875 0 0111.625 3h.75A1.875 1.875 0 0114.25 4.875L15 7.5h-6l.75-2.625z"
                            />
                        </svg>
                    </button>
                </div>
            </template>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import { useDataTableFetch } from '@/app/components/ui/datatable/useDataTableFetch'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'
import { API } from '@/shared/api'
import type { ModalityType } from '@/modules/superadmin/types/modality-type'

const router = useRouter()

const columns: DataTableColumn<ModalityType>[] = [
    { key: 'id', label: '#', field: 'id' },
    { key: 'name', label: 'NOMBRE', field: 'name', sortable: true },
    { key: 'shortName', label: 'CLAVE', field: 'shortName' },
    { key: 'isActive', label: 'ESTADO', field: 'isActive' },
    { key: 'opciones', label: 'OPCIONES' },
]

const {
    rows,
    loading,
    pagination,
    handleChange,
    fetchData,
} = useDataTableFetch<ModalityType>({
    endpoint: API.SUPERADMIN_API.modalityTypes.list,
})

fetchData()

function create() {
    router.push({ name: 'superadmin.modalitytypes.create' })
}

function show(row: ModalityType) {
    router.push({ name: 'superadmin.modalitytypes.show', params: { id: row.id } })
}

function edit(row: ModalityType) {
    router.push({ name: 'superadmin.modalitytypes.edit', params: { id: row.id } })
}

function remove(row: ModalityType) {
    router.push({ name: 'superadmin.modalitytypes.delete', params: { id: row.id } })
}
</script>
