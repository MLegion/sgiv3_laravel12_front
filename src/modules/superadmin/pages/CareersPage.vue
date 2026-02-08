<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">
                CARRERAS PROFESIONALES
            </h1>

            <button
                type="button"
                class="flex items-center gap-2 px-4 py-2 text-sm
                       rounded-lg bg-blue-600 text-white
                       hover:bg-blue-700 transition"
                @click="create"
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none"
                     viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                          d="M12 4.5v15m7.5-7.5h-15"/>
                </svg>
                REGISTRAR CARRERA PROFESIONAL
            </button>
        </div>

        <DataTable
            :columns="columns"
            :rows="rows"
            :loading="loading"
            :pagination="pagination"
            @change="handleChange"
        >
            <template #cell-isActive="{ row }">
                <span
                    class="px-2 py-1 text-xs rounded-full"
                    :class="row.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'"
                >
                    {{ row.isActive ? 'ACTIVO' : 'INACTIVO' }}
                </span>
            </template>

            <template #cell-status="{ row }">
                <ApprovalStatusBadge :status="row.approvalStatus" />
            </template>

            <template #cell-opciones="{ row }">
                <div class="flex justify-center gap-2">

                    <button
                        class="border p-1.5 rounded-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        :disabled="!canApprove(row)"
                        title="Aprobar carrera"
                        @click="approve(row)"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 0 1 9 9v.375M10.125 2.25A3.375 3.375 0 0 1 13.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 0 1 3.375 3.375M9 15l2.25 2.25L15 12" />
                        </svg>
                    </button>

                    <button
                        class="border p-1.5 rounded-md hover:bg-blue-50 cursor-pointer"
                        title="Ver detalles"
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

                    <button
                        class="border p-1.5 rounded-md hover:bg-amber-50 cursor-pointer"
                        title="Editar"
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

                    <button
                        class="border p-1.5 rounded-md hover:bg-red-50 cursor-pointer"
                        title="Eliminar"
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
import { API } from '@/shared/api'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'
import type { CareerType } from '@/modules/superadmin/types/career.type'
import ApprovalStatusBadge from "@/app/components/ui/ApprovalStatusBadge.vue";
import { ApprovalStatusEnum } from '@/shared/enums/approval-status.enum.ts'

const router = useRouter()

const columns: DataTableColumn<Career>[] = [
    { key: 'id', label: '#', field: 'id', sortable: true },
    { key: 'name', label: 'NOMBRE', field: 'name', sortable: true },
    { key: 'shortName', label: 'NOMBRE CORTO', field: 'shortName' },
    { key: 'officialCode', label: 'CLAVE OFICIAL', field: 'officialCode' },
    { key: 'status', label:'APROBADO' },
    { key: 'isActive', label: 'ESTADO' },
    { key: 'opciones', label: 'OPCIONES' },
]

const {
    rows,
    loading,
    pagination,
    handleChange,
    fetchData,
} = useDataTableFetch<Career>({
    endpoint: API.SUPERADMIN_API.careers.list,
})

fetchData()

function create() {
    router.push({ name: 'superadmin.careers.create' })
}


function approve(row: Career) {
    router.push({ name: 'superadmin.careers.approve', params: { id: row.id } })
}

function show(row: Career) {
    router.push({ name: 'superadmin.careers.show', params: { id: row.id } })
}

function edit(row: Career) {
    router.push({ name: 'superadmin.careers.edit', params: { id: row.id } })
}

function remove(row: Career) {
    router.push({ name: 'superadmin.careers.delete', params: { id: row.id } })
}

function canApprove(row: Career): boolean {
    return ![
        ApprovalStatusEnum.APPROVED,
        ApprovalStatusEnum.REJECTED,
    ].includes(row.approvalStatus)
}
</script>
