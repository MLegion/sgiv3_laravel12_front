<template>
    <div class="space-y-4">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">
                ESPECIALIDADES
            </h1>

            <button
                type="button"
                class="flex items-center gap-2 px-4 py-2 text-sm
                       rounded-lg bg-blue-600 text-white
                       hover:bg-blue-700 transition uppercase"
                @click="create"
            >
                +
                Registrar especialidades
            </button>
        </div>

        <DataTable
            :columns="columns"
            :rows="rows"
            :loading="loading"
            :pagination="pagination"
            @change="handleChange"
        >
            <!-- Plan de Estudio -->
            <template #cell-studyPlan="{ row }">
                {{ row.studyPlan?.officialCode }}
            </template>

            <!-- Estado aprobación -->
            <template #cell-status="{ row }">
                <ApprovalStatusBadge :status="row.approvalStatus" />
            </template>

            <!-- Opciones -->
            <template #cell-opciones="{ row }">
                <div class="flex justify-center gap-2">
                    <button
                        class="border p-1.5 rounded-md  cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Validar"
                        :disabled="!canApprove(row)"
                        @click="approve(row)"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 0 1 9 9v.375M10.125 2.25A3.375 3.375 0 0 1 13.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 0 1 3.375 3.375M9 15l2.25 2.25L15 12" />
                        </svg>
                    </button>

                    <button
                        class="border p-1.5 rounded-md cursor-pointer"
                        title="Editor de curricula"
                        @click="openEditorCurriculum(row)"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 0 0 2.25-2.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v2.25A2.25 2.25 0 0 0 6 10.5Zm0 9.75h2.25A2.25 2.25 0 0 0 10.5 18v-2.25a2.25 2.25 0 0 0-2.25-2.25H6a2.25 2.25 0 0 0-2.25 2.25V18A2.25 2.25 0 0 0 6 20.25Zm9.75-9.75H18a2.25 2.25 0 0 0 2.25-2.25V6A2.25 2.25 0 0 0 18 3.75h-2.25A2.25 2.25 0 0 0 13.5 6v2.25a2.25 2.25 0 0 0 2.25 2.25Z" />
                        </svg>
                    </button>

                    <button
                        class="border p-1.5 rounded-md cursor-pointer"
                        title="Ver"
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
                        class="border p-1.5 rounded-md cursor-pointer"
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
import type { DataTableColumn } from '@/app/components/ui/datatable/types'
import { API } from '@/shared/api'
import ApprovalStatusBadge from '@/app/components/ui/ApprovalStatusBadge.vue'
import { ApprovalStatusEnum } from '@/shared/enums/approval-status.enum.ts'
import type { StudyPlanType } from '@/modules/superadmin/types/study-plan.type'

const router = useRouter()

const columns: DataTableColumn<StudyPlanType>[] = [
    { key: 'id', label: '#', field: 'id', sortable: true },
    { key: 'officialCode', label: 'CLAVE OFICIAL', field: 'officialCode', sortable: true },
    { key: 'name', label: 'NOMBRE', field: 'name', sortable: true },
    { key: 'shortName', label: 'NOMBRE CORTO', field: 'shortName', sortable: true },
    { key: 'studyPlan', label: 'PLAN DE ESTUDIO' },
    { key: 'status', label: 'APROBACIÓN' },
    { key: 'opciones', label: 'OPCIONES' },
]

const {
    rows,
    loading,
    pagination,
    handleChange,
    fetchData,
} = useDataTableFetch<StudyPlanType>({
    endpoint: API.SUPERADMIN_API.specialties.list,
})

fetchData()

function create() {
    router.push({ name: 'superadmin.specialties.create' })
}

function show(row: StudyPlanType) {
    console.log("show", row)
    router.push({ name: 'superadmin.specialties.show', params: { id: row.id } })
}

function edit(row: StudyPlanType) {
    console.log("edit", row)
    router.push({ name: 'superadmin.specialties.edit', params: { id: row.id } })
}

function approve(row: StudyPlanType) {
    console.log("approve", row)
    router.push({ name: 'superadmin.specialties.approve', params: { id: row.id } })
}

function openEditorCurriculum(row: StudyPlanType) {
    console.log("openEditorCurriculum", row)
    router.push({ name: 'superadmin.specialties.editor', params: { id: row.id } })
}

function canApprove(row: StudyPlanType): boolean {
    return ![
        ApprovalStatusEnum.APPROVED,
        ApprovalStatusEnum.REJECTED,
    ].includes(row.approvalStatus)
}
</script>
