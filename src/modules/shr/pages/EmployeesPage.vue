<template>
    <div class="space-y-4">
        <h1 class="text-xl font-semibold text-slate-800">
            Empleados
        </h1>

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
            <!-- Ejemplo de celda personalizada -->
            <template #cell-name="{ row }">
                <span class="font-medium text-slate-800">
                    {{ row.names }} {{ row.firstSurname }} {{ row.secondSurname ?? '' }}
                </span>
            </template>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import DataTable from '@/app/components/datatable/DataTable.vue'
import type {
    DataTableColumn,
    DataTableExportEvent,
} from '@/app/components/datatable/types'
import { useDataTableFetch } from '@/app/components/datatable/useDataTableFetch'

/**
 * Modelo mínimo de Empleado para la tabla
 */
interface Employee {
    id: number
    names: string
    firstSurname: string
    secondSurname: string
    email: string
    currentJobPosition?: {
        name: string
    }
}

/**
 * Definición de columnas
 */
const columns: DataTableColumn<Employee>[] = [
    {
        key: 'id',
        label: '#',
        sortable: true,
    },
    {
        key: 'name',
        label: 'Nombre Completo',
        sortable: true,
        formatter: (_, row) =>
            `${row.names} ${row.firstSurname} ${row.secondSurname ?? ''}`.trim(),
    },
    {
        key: 'email',
        label: 'Correo',
        field: 'email',
        sortable: true,
    },
    {
        key: 'position',
        label: 'Puesto',
        formatter: (_, row) =>
            row.currentJobPosition?.name ?? '—',
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
    endpoint: '/api/v1/shr/employees',
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
 * Exportación de página actual
 */
function handleExport(event: DataTableExportEvent<Employee>) {
    console.log('Exportar:', event.type)
    console.table(event.rows)

    // Próximo paso:
    // exportEmployeesCsv(event.rows, event.columns)
    // exportEmployeesXlsx(...)
    // exportEmployeesPdf(...)
}
</script>
