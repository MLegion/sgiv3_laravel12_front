<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">
                Empleados
            </h1>

            <div class="flex items-center gap-2">
                <button
                    type="button"
                    class="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg
                           border border-slate-300 text-slate-600 bg-white
                           hover:border-blue-400 hover:text-blue-600 transition"
                    @click="downloadTemplate"
                >
                    <ArrowDownTrayIcon class="w-4 h-4" />
                    Descargar formato
                </button>

                <button
                    type="button"
                    class="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg
                           border border-slate-300 text-slate-600 bg-white
                           hover:border-emerald-400 hover:text-emerald-600 transition"
                    @click="openImport"
                >
                    <ArrowUpTrayIcon class="w-4 h-4" />
                    Importar
                </button>

                <button
                    type="button"
                    class="flex items-center gap-2 px-4 py-2 text-sm
                   rounded-lg bg-blue-600 text-white
                   hover:bg-blue-700 transition"
                    @click="createEmployee"
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

                    Registrar empleado
                </button>
            </div>
        </div>

        <!-- Modal de importación -->
        <div
            v-if="importOpen"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            @click.self="closeImport"
        >
            <div class="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
                <div class="flex items-start justify-between">
                    <div>
                        <h2 class="text-lg font-semibold text-slate-800">Importar empleados</h2>
                        <p class="text-sm text-slate-500">Sube el archivo CSV con el formato descargado.</p>
                    </div>
                    <button aria-label="Cerrar" class="text-slate-400 hover:text-slate-600" @click="closeImport">
                        <XMarkIcon class="w-5 h-5" />
                    </button>
                </div>

                <p class="text-xs text-slate-500">
                    Columnas: <code class="bg-slate-100 px-1 rounded">names</code>,
                    <code class="bg-slate-100 px-1 rounded">first_surname</code>,
                    <code class="bg-slate-100 px-1 rounded">second_surname</code>,
                    <code class="bg-slate-100 px-1 rounded">email</code>,
                    <code class="bg-slate-100 px-1 rounded">job_position_name</code> (opcional).
                    Cada empleado obtiene una cuenta de acceso (contraseña temporal enviada por correo). El puesto debe existir en el plantel.
                </p>

                <label
                    class="flex flex-col items-center justify-center gap-2 w-full border-2 border-dashed rounded-lg p-8 cursor-pointer transition"
                    :class="importFile ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50'"
                >
                    <ArrowUpTrayIcon class="w-8 h-8" :class="importFile ? 'text-emerald-500' : 'text-slate-400'" />
                    <span class="text-sm" :class="importFile ? 'text-emerald-700 font-medium' : 'text-slate-500'">
                        {{ importFile ? importFile.name : 'Haz clic o arrastra tu archivo .csv aquí' }}
                    </span>
                    <input type="file" accept=".csv,text/csv" class="hidden" @change="onFileSelected" />
                </label>

                <div v-if="importResult" class="rounded-lg border p-3 text-sm"
                    :class="importResult.errors.length === 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'">
                    <p class="font-medium">
                        {{ importResult.created }} empleado(s) creado(s)<template v-if="importResult.errors.length"> · {{ importResult.errors.length }} fila(s) con error</template>.
                    </p>
                    <ul v-if="importResult.errors.length" class="mt-1 list-disc list-inside max-h-40 overflow-auto">
                        <li v-for="(e, idx) in importResult.errors" :key="idx">Fila {{ e.row }}: {{ e.reason }}</li>
                    </ul>
                </div>

                <div class="flex justify-end gap-2 pt-2">
                    <button type="button" class="px-4 py-2 text-sm rounded-lg text-slate-600 hover:bg-slate-100" @click="closeImport">
                        Cerrar
                    </button>
                    <button
                        type="button"
                        class="px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        :disabled="!importFile || importing"
                        @click="submitImport"
                    >
                        {{ importing ? 'Importando…' : 'Importar' }}
                    </button>
                </div>
            </div>
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
            <!-- Nombre completo -->
            <template #cell-name="{ row }">
                <span class="font-medium text-slate-800">
                    {{ row.names }}
                    {{ row.firstSurname }}
                    {{ row.secondSurname ?? '' }}
                </span>
            </template>

            <!-- ID centrado -->
            <template #cell-id="{ value }">
                <div class="font-medium text-center">
                    {{ value }}
                </div>
            </template>

            <!-- Opciones -->
            <template #cell-opciones="{ row }">
                <div class="flex items-center justify-center gap-2">
                    <button aria-label="Ver historial laboral"
                        type="button"
                        class="border p-1.5 rounded-md text-slate-500
                               hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                        title="Ver historial laboral"
                        @click="goToHistory(row)">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" />
                        </svg>

                    </button>

                    <!-- Ver -->
                    <button aria-label="Ver empleado"
                        type="button"
                        class="border p-1.5 rounded-md text-slate-500
                               hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                        title="Ver empleado"
                        @click="viewEmployee(row)"
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
                    <button aria-label="Editar empleado"
                        type="button"
                        class="border p-1.5 rounded-md text-slate-500
                               hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                        title="Editar empleado"
                        @click="editEmployee(row)"
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
                    <button aria-label="Eliminar empleado"
                        type="button"
                        class="border p-1.5 rounded-md text-slate-500
                               hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Eliminar empleado"
                        @click="deleteEmployee(row)"
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import { API } from '@/shared/api'
import { api } from '@/shared/services/api'
import type {
    DataTableColumn,
    DataTableExportEvent,
} from '@/app/components/ui/datatable/types'
import { useDataTableFetch } from '@/app/components/ui/datatable/useDataTableFetch'
import { ArrowDownTrayIcon, ArrowUpTrayIcon, XMarkIcon } from '@heroicons/vue/24/outline'

interface ImportResult {
    total: number
    applied: boolean
    created: number
    updated: number
    errors: { row: number; reason: string }[]
}

/**
 * Router
 */
const router = useRouter()

/**
 * Modelo mínimo de Empleado para la tabla
 */
interface Employee {
    id: number
    names: string
    firstSurname: string
    secondSurname?: string | null
    email: string
    currentJobPosition?: {
        name: string
    }
}

/**
 * Navegación
 */
function createEmployee() {
    router.push({
        name: 'shr.humanresources.employees.create'
    })
}

function goToHistory(row: Employee) {
    router.push({
        name: 'shr.humanresources.employees.history',
        params: { id: row.id },
    })
}

function viewEmployee(row: Employee) {
    router.push({
        name: 'shr.humanresources.employees.show',
        params: { id: row.id },
    })
}

function editEmployee(row: Employee) {
    router.push({
        name: 'shr.humanresources.employees.edit',
        params: { id: row.id },
    })
}

function deleteEmployee(row: Employee) {
    router.push({
        name: 'shr.humanresources.employees.delete',
        params: { id: row.id },
    })
}

/* -------------------------------------------------------------------------- */
/* IMPORTAR / FORMATO */
/* -------------------------------------------------------------------------- */
const importOpen = ref(false)
const importFile = ref<File | null>(null)
const importing = ref(false)
const importResult = ref<ImportResult | null>(null)

function downloadTemplate() {
    const content =
        'names,first_surname,second_surname,email,job_position_name\n' +
        'JUAN,PÉREZ,LÓPEZ,juan.perez@ejemplo.mx,DOCENTE\n' +
        'ANA,RAMÍREZ,,ana.ramirez@ejemplo.mx,\n'
    const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'formato_empleados.csv'
    a.click()
    URL.revokeObjectURL(url)
}

function openImport() {
    importFile.value = null
    importResult.value = null
    importOpen.value = true
}

function closeImport() {
    importOpen.value = false
}

function onFileSelected(e: Event) {
    const files = (e.target as HTMLInputElement).files
    importFile.value = files && files.length ? files[0]! : null
    importResult.value = null
}

async function submitImport() {
    if (!importFile.value) return
    importing.value = true
    importResult.value = null
    try {
        const fd = new FormData()
        fd.append('file', importFile.value)
        const { data } = await api.post(API.SHR_API.employee.import, fd)
        importResult.value = data
        if (data.created > 0) {
            importFile.value = null
            fetchData()
        }
    } catch (e: any) {
        importResult.value = {
            total: 0, applied: false, created: 0, updated: 0,
            errors: [{ row: 0, reason: e?.response?.data?.message ?? 'Error al procesar el archivo.' }],
        }
    } finally {
        importing.value = false
    }
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
        label: 'NOMBRE COMPLETO',
        sortable: true,
        formatter: (_, row) =>
            `${row.names} ${row.firstSurname} ${row.secondSurname ?? ''}`.trim(),
    },
    {
        key: 'email',
        label: 'CORREO',
        field: 'email',
        sortable: true,
    },
    {
        key: 'position',
        label: 'PUESTO',
        formatter: (_, row) =>
            row.currentJobPosition?.name ?? '—',
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
    endpoint: API.SHR_API.employee.list,
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
function handleExport(event: DataTableExportEvent<Employee>) {
    console.log('Exportar:', event.type)
    console.table(event.rows)
}
</script>
