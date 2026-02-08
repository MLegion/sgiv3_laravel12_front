<template>
    <div class="space-y-4">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">
                Áreas de trabajo
            </h1>

            <button
                type="button"
                class="px-4 py-2 text-sm rounded-lg
                       bg-blue-600 text-white hover:bg-blue-700"
                @click="createWorkArea"
            >
                Registrar área
            </button>
        </div>

        <!-- DataTable -->
        <DataTable
            :columns="columns"
            :rows="rows"
            :loading="loading"
            :pagination="pagination"
            :perPageOptions="[10, 15, 30, 50]"
            searchPlaceholder="Buscar área…"
            @change="handleChange"
        >
            <!-- ID -->
            <template #cell-id="{ value }">
                <div class="text-center font-medium">
                    {{ value }}
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
                        type="button"
                        class="border p-1.5 rounded-md text-slate-500
                               hover:text-blue-600 hover:bg-blue-50 transition
                               cursor-pointer"
                        title="Ver"
                        @click="viewWorkArea(row)"
                    >
                        <EyeIcon class="w-4 h-4" />
                    </button>

                    <!-- Editar -->
                    <button
                        type="button"
                        class="border p-1.5 rounded-md text-slate-500
                               hover:text-amber-600 hover:bg-amber-50 transition
                               cursor-pointer"
                        title="Editar"
                        @click="editWorkArea(row)"
                    >
                        <PencilSquareIcon class="w-4 h-4" />
                    </button>

                    <!-- Eliminar -->
                    <button
                        type="button"
                        class="border p-1.5 rounded-md text-slate-500
                               hover:text-red-600 hover:bg-red-50 transition
                               cursor-pointer"
                        title="Eliminar"
                        @click="deleteWorkArea(row)"
                    >
                        <TrashIcon class="w-4 h-4" />
                    </button>
                </div>
            </template>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import { API } from '@/shared/api'
import { useRouter } from 'vue-router'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import { useDataTableFetch } from '@/app/components/ui/datatable/useDataTableFetch'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'

import {
    EyeIcon,
    PencilSquareIcon,
    TrashIcon,
} from '@heroicons/vue/24/outline'

/* -------------------------------------------------------------------------- */
/* TYPES */
/* -------------------------------------------------------------------------- */
interface WorkArea {
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
const columns: DataTableColumn<WorkArea>[] = [
    {
        key: 'id',
        label: '#',
        field: 'id',
        align: 'center',
        sortable: true,
        width: '80px',
    },
    {
        key: 'name',
        label: 'NOMBRE',
        field: 'name',
        sortable: true,
    },
    {
        key: 'description',
        label: 'DESCRIPCIÓN',
        field: 'description',
    },
    {
        key: 'status',
        label: 'ESTADO',
        field: 'status',
        align: 'center',
        sortable: true,
        width: '120px',
    },
    {
        key: 'opciones',
        label: 'OPCIONES',
        align: 'center',
        width: '160px',
    },
]

/* -------------------------------------------------------------------------- */
/* DATATABLE FETCH */
/* -------------------------------------------------------------------------- */
const {
    rows,
    loading,
    pagination,
    fetchData,
    handleChange,
} = useDataTableFetch<WorkArea>({
    endpoint: API.SHR_API.workArea.list,
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
function createWorkArea() {
    router.push({
        name: 'shr.humanresources.workareas.create',
    })
}

function viewWorkArea(row: WorkArea) {
    router.push({
        name: 'shr.humanresources.workareas.show',
        params: { id: row.id },
    })
}

function editWorkArea(row: WorkArea) {
    router.push({
        name: 'shr.humanresources.workareas.edit',
        params: { id: row.id },
    })
}

function deleteWorkArea(row: WorkArea) {
    router.push({
        name: 'shr.humanresources.workareas.delete',
        params: { id: row.id },
    })
}
</script>

