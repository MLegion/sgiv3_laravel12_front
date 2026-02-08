<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">
                INSTITUCIONES EDUCATIVAS
            </h1>

            <button
                type="button"
                class="flex items-center gap-2 px-4 py-2 text-sm
               rounded-lg bg-blue-600 text-white
               hover:bg-blue-700 transition"
                @click="createCollege"
            >
                <!-- Heroicon Plus -->
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
                        d="M12 4.5v15m7.5-7.5h-15"
                    />
                </svg>

                REGISTRAR INSTITUTO EDUCATIVA CON ADMINISTRADOR
            </button>
        </div>

        <DataTable
            :columns="columns"
            :rows="rows"
            :loading="loading"
            :pagination="pagination"
            :perPageOptions="[10, 15, 30, 50]"
            :exportable="['csv', 'xlsx', 'pdf']"
            @change="handleChange"
            @export="handleExport"
        >
            <!-- ID centrado -->
            <template #cell-id="{ value }">
                <div class="font-medium text-center">
                    {{ value }}
                </div>
            </template>

            <!-- Nombre -->
            <template #cell-name="{ row }">
                <span class="font-medium text-slate-800">
                    {{ row.name }}
                </span>
            </template>

            <!-- Nombre Corto -->
            <template #cell-shortName="{ row }">
                <span class="font-medium text-slate-800">
                    {{ row.shortName }}
                </span>
            </template>



            <!-- Opciones -->
            <template #cell-opciones="{ row }">
                <div class="flex items-center justify-center gap-2">
                    <!-- Ver -->
                    <button
                        type="button"
                        class="border p-1.5 rounded-md text-slate-500
                               hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                        title="Ver institución educativa"
                        @click="viewCollege(row)"
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
                        title="Editar institución educativa"
                        @click="editCollege(row)"
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
                        title="Eliminar institución educativa"
                        @click="deleteCollege(row)"
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
import type {
    DataTableColumn,
    DataTableExportEvent,
} from '@/app/components/ui/datatable/types'
import { useDataTableFetch } from '@/app/components/ui/datatable/useDataTableFetch'

/**
 * Router
 */
const router = useRouter()

/**
 * Modelo mínimo de Empleado para la tabla
 */
interface College {
    id: number
    name: string
    shortName: string
    status: boolean
}

/**
 * Navegación
 */
function createCollege() {
    router.push({
        name: 'superadmin.colleges.create-with-admin'
    })
}

function viewCollege(row: College) {
    router.push({
        name: 'superadmin.colleges.show',
        params: { id: row.id },
    })
}

function editCollege(row: College) {
    router.push({
        name: 'superadmin.colleges.edit',
        params: { id: row.id },
    })
}

function deleteCollege(row: College) {
    router.push({
        name: 'superadmin.colleges.delete',
        params: { id: row.id },
    })
}

/**
 * Definición de columnas
 */
const columns: DataTableColumn<Employee>[] = [
    {
        key: 'id',
        label: '#',
        field: 'id',
        sortable: true,
    },
    {
        key: 'name',
        label: 'NOMBRE',
        sortable: true,
        field: 'name',
    },
    {
        key: 'shortName',
        label: 'NOMBRE CORTO',
        sortable: true,
        field: 'shortName',
    },
    {
        key: 'opciones',
        label: 'OPCIONES',
    },
]

/**
 * Hook reutilizable para DataTable
 */
const {
    rows,
    loading,
    pagination,
    fetchData,
    handleChange,
} = useDataTableFetch<Employee>({
    endpoint: API.SUPERADMIN_API.colleges.list,
    initialPerPage: 15,
    mapResponse: data => ({
        items: data.items,
        total: data.total,
        page: data.page,
        perPage: data.perPage,
    }),
})

/**
 * Cargar datos iniciales
 */
fetchData()

/**
 * Exportación
 */
function handleExport(event: DataTableExportEvent<College>) {
    console.log('Exportar:', event.type)
    console.table(event.rows)
}
</script>
