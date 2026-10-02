<template>
    <div class="space-y-4">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">
                Puestos
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
                    class="px-4 py-2 text-sm rounded-lg
                           bg-blue-600 text-white hover:bg-blue-700"
                    @click="goToCreate"
                >
                    Registrar puesto
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
                        <h2 class="text-lg font-semibold text-slate-800">Importar puestos</h2>
                        <p class="text-sm text-slate-500">Sube el archivo CSV con el formato descargado.</p>
                    </div>
                    <button aria-label="Cerrar" class="text-slate-400 hover:text-slate-600" @click="closeImport">
                        <XMarkIcon class="w-5 h-5" />
                    </button>
                </div>

                <p class="text-xs text-slate-500">
                    Columnas: <code class="bg-slate-100 px-1 rounded">name</code>,
                    <code class="bg-slate-100 px-1 rounded">description</code>,
                    <code class="bg-slate-100 px-1 rounded">work_area_name</code>,
                    <code class="bg-slate-100 px-1 rounded">parent_name</code>,
                    <code class="bg-slate-100 px-1 rounded">role_code</code>,
                    <code class="bg-slate-100 px-1 rounded">max_holders</code> (todas opcionales salvo <b>name</b>).
                    El área y el rol deben existir; el puesto padre puede venir en el mismo archivo.
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
                    :class="importResult.applied ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'">
                    <p v-if="importResult.applied" class="font-medium">
                        Importación exitosa: {{ importResult.created }} puesto(s) creado(s).
                    </p>
                    <template v-else>
                        <p class="font-medium">No se aplicó ningún cambio ({{ importResult.errors.length }} error(es)). Corrige y reintenta:</p>
                        <ul class="mt-1 list-disc list-inside max-h-40 overflow-auto">
                            <li v-for="(e, idx) in importResult.errors" :key="idx">Fila {{ e.row }}: {{ e.reason }}</li>
                        </ul>
                    </template>
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
                    <button aria-label="Ver"
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
                    <button aria-label="Editar"
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
                    <button aria-label="Eliminar"
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import { API } from '@/shared/api'
import { api } from '@/shared/services/api'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'
import { useDataTableFetch } from '@/app/components/ui/datatable/useDataTableFetch'
import { ArrowDownTrayIcon, ArrowUpTrayIcon, XMarkIcon } from '@heroicons/vue/24/outline'

interface ImportResult {
    total: number
    applied: boolean
    created: number
    updated: number
    errors: { row: number; reason: string }[]
}

/* -------------------------------------------------------------------------- */
/* TYPES */
/* -------------------------------------------------------------------------- */
interface JobPosition {
    id: number
    name: string
    description?: string
    status: boolean
    max_holders: number | null
    role_name?: string | null
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
        searchable: true,
    },
    {
        key: 'role',
        label: 'ROL',
        formatter: (_, row) => row.role_name || 'N/A',
    },
    {
        key: 'max_holders',
        label: 'LÍMITE',
        align: 'center',
        formatter: (_, row) => row.max_holders ? `${row.max_holders}` : '∞',
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

/* -------------------------------------------------------------------------- */
/* IMPORTAR / FORMATO */
/* -------------------------------------------------------------------------- */
const importOpen = ref(false)
const importFile = ref<File | null>(null)
const importing = ref(false)
const importResult = ref<ImportResult | null>(null)

function downloadTemplate() {
    const content =
        'name,description,work_area_name,parent_name,role_code,max_holders\n' +
        'JEFE DE DEPARTAMENTO,Responsable del departamento,DIRECCIÓN ACADÉMICA,,,1\n' +
        'DOCENTE,Personal docente,DIRECCIÓN ACADÉMICA,JEFE DE DEPARTAMENTO,TEACHER,\n'
    const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'formato_puestos.csv'
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
        const { data } = await api.post(API.SHR_API.jobPosition.import, fd)
        importResult.value = data
        if (data.applied) {
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
</script>

