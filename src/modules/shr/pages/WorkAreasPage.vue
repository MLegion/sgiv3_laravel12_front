<template>
    <div class="space-y-4">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">
                Áreas de trabajo
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
                    class="px-4 py-2 text-sm rounded-lg
                           bg-blue-600 text-white hover:bg-blue-700"
                    @click="createWorkArea"
                >
                    Registrar área
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
                        <h2 class="text-lg font-semibold text-slate-800">Importar áreas de trabajo</h2>
                        <p class="text-sm text-slate-500">Sube el archivo CSV con el formato descargado.</p>
                    </div>
                    <button aria-label="Cerrar" class="text-slate-400 hover:text-slate-600" @click="closeImport">
                        <XMarkIcon class="w-5 h-5" />
                    </button>
                </div>

                <p class="text-xs text-slate-500">
                    Columnas: <code class="bg-slate-100 px-1 rounded">name</code>,
                    <code class="bg-slate-100 px-1 rounded">description</code>,
                    <code class="bg-slate-100 px-1 rounded">parent_name</code> (opcional).
                    El área padre debe existir o venir en el mismo archivo.
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

                <!-- Resultado -->
                <div v-if="importResult" class="rounded-lg border p-3 text-sm"
                    :class="importResult.applied ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'">
                    <p v-if="importResult.applied" class="font-medium">
                        Importación exitosa: {{ importResult.created }} creada(s), {{ importResult.updated }} actualizada(s).
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
                    <button aria-label="Ver"
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
                    <button aria-label="Editar"
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
                    <button aria-label="Eliminar"
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
import { ref } from 'vue'
import { API } from '@/shared/api'
import { api } from '@/shared/services/api'
import { useRouter } from 'vue-router'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import { useDataTableFetch } from '@/app/components/ui/datatable/useDataTableFetch'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'

import {
    EyeIcon,
    PencilSquareIcon,
    TrashIcon,
    ArrowDownTrayIcon,
    ArrowUpTrayIcon,
    XMarkIcon,
} from '@heroicons/vue/24/outline'

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

/* -------------------------------------------------------------------------- */
/* IMPORTAR / FORMATO */
/* -------------------------------------------------------------------------- */
const importOpen = ref(false)
const importFile = ref<File | null>(null)
const importing = ref(false)
const importResult = ref<ImportResult | null>(null)

function downloadTemplate() {
    const content =
        'name,description,parent_name\n' +
        'DIRECCIÓN ACADÉMICA,Área rectora académica,\n' +
        'DEPARTAMENTO DE SISTEMAS,Adscrito a la dirección académica,DIRECCIÓN ACADÉMICA\n'
    const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'formato_areas_de_trabajo.csv'
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
        const { data } = await api.post(API.SHR_API.workArea.import, fd)
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

