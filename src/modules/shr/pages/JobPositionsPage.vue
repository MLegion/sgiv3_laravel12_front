<template>
    <div class="space-y-4">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">
                Puestos
            </h1>

            <button
                class="px-4 py-2 text-sm rounded-lg
                       bg-blue-600 text-white hover:bg-blue-700"
                @click="goToCreate"
            >
                Registrar puesto
            </button>
        </div>

        <!-- Tabla -->
        <DataTable
            :columns="columns"
            :rows="rows"
            :loading="loading"
            :pagination="pagination"
            :perPageOptions="[10, 15, 30, 50]"
            search-placeholder="Buscar puesto…"
            @change="handleChange"
        >
            <!-- Nombre -->
            <template #cell-name="{ value }">
                <span class="font-medium text-slate-800">
                    {{ value }}
                </span>
            </template>

            <!-- RoleNames -->
            <template #cell-role="{ row }">
                <div
                    class="px-2 py-1 text-xs rounded-full text-center font-medium text-slate-800"
                    :class="row.role_name
                        ? 'bg-green-100'
                        : 'bg-gray-100'"
                >
                    {{ row.role_name || '-------' }}
                </div>
            </template>

            <!-- Estado -->
            <template #cell-status="{ value }">
                <span
                    class="inline-flex px-2 py-1 text-xs rounded-full"
                    :class="value
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'"
                >
                    {{ value ? 'Activo' : 'Inactivo' }}
                </span>
            </template>

            <!-- Opciones -->
            <template #cell-opciones="{ row }">
                <div class="flex items-center justify-center gap-2">
                    <!-- Ver -->
                    <button
                        class="border p-1.5 rounded-md
                               cursor-pointer
                               text-slate-500
                               hover:text-blue-600 hover:bg-blue-50"
                        title="Ver"
                        @click="viewJob(row)"
                    >
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
                        class="border p-1.5 rounded-md
                               cursor-pointer
                               text-slate-500
                               hover:text-amber-600 hover:bg-amber-50"
                        title="Editar"
                        @click="editJob(row)"
                    >
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
                        class="border p-1.5 rounded-md
                               cursor-pointer
                               text-slate-500
                               hover:text-red-600 hover:bg-red-50"
                        title="Eliminar"
                        @click="deleteJob(row)"
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
import { API } from '@/shared/api'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'
import { useDataTableFetch } from '@/app/components/ui/datatable/useDataTableFetch'

/* -------------------------------------------------------------------------- */
/* TYPES */
/* -------------------------------------------------------------------------- */
interface JobPosition {
    id: number
    name: string
    description?: string
    status: boolean
}

/* -------------------------------------------------------------------------- */
/* ROUTER */
/* -------------------------------------------------------------------------- */
const router = useRouter()

/* -------------------------------------------------------------------------- */
/* COLUMNS */
/* -------------------------------------------------------------------------- */
const columns: DataTableColumn<JobPosition>[] = [
    {
        key: 'id',
        label: '#',
        field: 'id',
        align: 'center',
        sortable: true,
    },
    {
        key: 'name',
        label: 'PUESTO',
        field: 'name',
        sortable: true,
    },
    {
        key: 'role',
        label: 'ROL',
        formatter: (_, row) => row.role_name || 'N/A',
    },
    {
        key: 'status',
        label: 'ESTADO',
        field: 'status',
        align: 'center',
        sortable: true,
    },
    {
        key: 'opciones',
        label: 'OPCIONES',
        align: 'center',
    },
]

/* -------------------------------------------------------------------------- */
/* DATA */
/* -------------------------------------------------------------------------- */
const {
    rows,
    loading,
    pagination,
    fetchData,
    handleChange,
} = useDataTableFetch<JobPosition>({
    endpoint: API.SHR_API.jobPosition.list,
    initialPerPage: 15,
    mapResponse: data => ({
        items: data.items,
        total: data.total,
        page: data.page,
        perPage: data.perPage,
    }),
})

fetchData()

/* -------------------------------------------------------------------------- */
/* ACTIONS */
/* -------------------------------------------------------------------------- */
function goToCreate() {
    router.push({ name: 'shr.humanresources.jobpositions.create' })
}

function viewJob(row: JobPosition) {
    router.push({
        name: 'shr.humanresources.jobpositions.show',
        params: { id: row.id },
    })
}

function editJob(row: JobPosition) {
    router.push({
        name: 'shr.humanresources.jobpositions.edit',
        params: { id: row.id },
    })
}

function deleteJob(row: JobPosition) {
    router.push({
        name: 'shr.humanresources.jobpositions.delete',
        params: { id: row.id },
    })
}
</script>

