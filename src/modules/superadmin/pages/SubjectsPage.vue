<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">
                MATERIAS
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
                REGISTRAR MATERIA
            </button>
        </div>

        <DataTable
            :columns="columns"
            :rows="rows"
            :loading="loading"
            :pagination="pagination"
            :initial-search="initialSearch"
            :sort-by="initialSortBy"
            :sort-direction="initialSortDirection"
            @change="handleChange"
        >
            <!-- Estado activo -->
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

            <!-- Tipo especial -->
            <template #cell-specialType="{ row }">
                <span
                    v-if="row.specialType"
                    class="px-2 py-1 text-xs rounded-full whitespace-nowrap"
                    :class="SPECIAL_TYPE_META[row.specialType]?.class ?? 'bg-slate-100 text-slate-600'"
                >
                    {{ SPECIAL_TYPE_META[row.specialType]?.label ?? row.specialType }}
                </span>
                <span v-else class="text-xs text-slate-400">—</span>
            </template>

            <!-- Estado aprobación -->
            <template #cell-status="{ row }">
                <ApprovalStatusBadge :status="row.approvalStatus" />
            </template>

            <!-- Opciones -->
            <template #cell-opciones="{ row }">
                <div class="flex justify-center gap-2">

                    <button aria-label="Aprobar materia"
                        class="border p-1.5 rounded-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        :disabled="!canApprove(row)"
                        title="Aprobar materia"
                        @click="approve(row)"
                    >
                        ✔
                    </button>

                    <button aria-label="Ver detalles"
                        class="border p-1.5 rounded-md hover:bg-blue-50 cursor-pointer"
                        title="Ver detalles"
                        @click="show(row)"
                    >
                        👁
                    </button>

                    <button aria-label="Editar"
                        class="border p-1.5 rounded-md hover:bg-amber-50 cursor-pointer"
                        title="Editar"
                        @click="edit(row)"
                    >
                        ✏️
                    </button>

                    <button aria-label="Programa de estudio"
                        class="border p-1.5 rounded-md cursor-pointer"
                        :class="(row.programIsLocal || row.programUrl) ? 'hover:bg-emerald-50 text-emerald-700' : 'hover:bg-slate-50 text-slate-400'"
                        title="Programa de estudio"
                        @click="openProgram(row)"
                    >
                        📄
                    </button>

                    <button aria-label="Eliminar"
                        class="border p-1.5 rounded-md hover:bg-red-50 cursor-pointer"
                        title="Eliminar"
                        @click="remove(row)"
                    >
                        🗑
                    </button>
                </div>
            </template>
        </DataTable>

        <SubjectProgramModal
            v-if="programRow"
            v-model="programModalOpen"
            :subject-id="programRow.id"
            :subject-code="programRow.officialCode"
            :subject-name="programRow.name"
            :program-url="programRow.programUrl"
            :program-is-local="programRow.programIsLocal"
            :program-source-url="programRow.programSourceUrl"
            @changed="onProgramChanged"
        />
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import SubjectProgramModal from '@/modules/study-programs/components/SubjectProgramModal.vue'
import { useDataTableFetch } from '@/app/components/ui/datatable/useDataTableFetch'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'

import { API } from '@/shared/api'
import ApprovalStatusBadge from '@/app/components/ui/ApprovalStatusBadge.vue'
import { ApprovalStatusEnum } from '@/shared/enums/approval-status.enum'

import type { SubjectType } from '@/modules/superadmin/types/subject.type'

const router = useRouter()

/* -------------------------------------------------------------------------- */
/* TIPO ESPECIAL — etiqueta + color por valor (null = materia normal) */
/* -------------------------------------------------------------------------- */
const SPECIAL_TYPE_META: Record<string, { label: string; class: string }> = {
    social_service:           { label: 'SERVICIO SOCIAL',        class: 'bg-indigo-100 text-indigo-700' },
    complementary_activities: { label: 'ACT. COMPLEMENTARIAS',   class: 'bg-amber-100 text-amber-700' },
    professional_residency:   { label: 'RESIDENCIA PROFESIONAL', class: 'bg-emerald-100 text-emerald-700' },
}

/* -------------------------------------------------------------------------- */
/* COLUMNS */
/* -------------------------------------------------------------------------- */
const columns: DataTableColumn<SubjectType>[] = [
    { key: 'id', label: '#', field: 'id', sortable: true },
    { key: 'name', label: 'NOMBRE', field: 'name', sortable: true, searchable: true },
    { key: 'shortName', label: 'NOMBRE CORTO', field: 'shortName', searchable: true  },
    { key: 'officialCode', label: 'CLAVE OFICIAL', field: 'officialCode', searchable: true },
    { key: 'ht', label: 'HT', field: 'ht' },
    { key: 'hp', label: 'HP', field: 'hp' },
    { key: 'credits', label: 'CRÉDITOS', field: 'credits' },
    { key: 'specialType', label: 'TIPO ESPECIAL' },
    { key: 'status', label: 'APROBADO' },
    { key: 'isActive', label: 'ESTADO' },
    { key: 'opciones', label: 'OPCIONES' },
]

/* -------------------------------------------------------------------------- */
/* FETCH */
/* -------------------------------------------------------------------------- */
const {
    rows,
    loading,
    pagination,
    handleChange,
    fetchData,
    initialSearch,
    initialSortBy,
    initialSortDirection,
} = useDataTableFetch<SubjectType>({
    endpoint: API.SUPERADMIN_API.subjects.list,
    persistKey: 'superadmin.subjects.table',
})

fetchData()

/* -------------------------------------------------------------------------- */
/* ACTIONS */
/* -------------------------------------------------------------------------- */
function create() {
    router.push({ name: 'superadmin.subjects.create' })
}

function approve(row: SubjectType) {
    router.push({ name: 'superadmin.subjects.approve', params: { id: row.id } })
}

function show(row: SubjectType) {
    router.push({ name: 'superadmin.subjects.show', params: { id: row.id } })
}

function edit(row: SubjectType) {
    router.push({ name: 'superadmin.subjects.edit', params: { id: row.id } })
}

function remove(row: SubjectType) {
    router.push({ name: 'superadmin.subjects.delete', params: { id: row.id } })
}

/* -------------------------------------------------------------------------- */
/* PROGRAMA DE ESTUDIO */
/* -------------------------------------------------------------------------- */
const programModalOpen = ref(false)
const programRow = ref<SubjectType | null>(null)

function openProgram(row: SubjectType) {
    programRow.value = row
    programModalOpen.value = true
}

function onProgramChanged(v: { programUrl: string | null; programIsLocal: boolean; programSourceUrl: string | null }) {
    if (!programRow.value) return
    programRow.value.programUrl = v.programUrl
    programRow.value.programIsLocal = v.programIsLocal
    programRow.value.programSourceUrl = v.programSourceUrl
}

function canApprove(row: SubjectType): boolean {
    return ![
        ApprovalStatusEnum.APPROVED,
        ApprovalStatusEnum.REJECTED,
    ].includes(row.approvalStatus)
}
</script>
