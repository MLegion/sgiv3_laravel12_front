<template>
    <div class="space-y-6">
        <!-- Header con estilo renovado -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div>
                <h1 class="text-xl font-black text-slate-800 uppercase tracking-tight">
                    GRUPOS DE MATERIAS OPTATIVAS
                </h1>
                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                    Gestión de bloques y requisitos de optatividad
                </p>
            </div>

            <button
                type="button"
                class="flex items-center justify-center gap-2 px-6 py-3 text-[11px] font-black
                       rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-100
                       hover:bg-blue-700 active:scale-95 transition-all uppercase tracking-widest"
                @click="create"
            >
                <PlusIcon class="w-4 h-4 stroke-[3]" />
                Registrar Grupo
            </button>
        </div>

        <!-- Tabla de datos -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <DataTable
                :columns="columns"
                :rows="rows"
                :loading="loading"
                :pagination="pagination"
                @change="handleChange"
            >
                <!-- Plan de Estudio -->
                <template #cell-studyPlan="{ row }">
                    <span class="font-mono text-xs font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded border">
                        {{ row.studyPlan?.officialCode || 'N/A' }}
                    </span>
                </template>

                <!-- Límites de materias -->
                <template #cell-limits="{ row }">
                    <div class="flex items-center gap-1 text-xs font-medium">
                        <span class="text-blue-600">{{ row.minSubjects }}</span>
                        <span class="text-slate-300">/</span>
                        <span class="text-slate-800">{{ row.maxSubjects }}</span>
                        <span class="text-[9px] text-slate-400 uppercase ml-1 font-bold">Asig.</span>
                    </div>
                </template>

                <!-- Créditos Mínimos -->
                <template #cell-minCredits="{ row }">
                    <span class="text-xs font-bold text-slate-700">
                        {{ row.minCredits }} <span class="text-[9px] text-slate-400 uppercase font-bold">Pts</span>
                    </span>
                </template>

                <!-- Estado aprobación -->
                <template #cell-status="{ row }">
                    <ApprovalStatusBadge :status="row.approvalStatus" />
                </template>

                <!-- Opciones / Acciones -->
                <template #cell-opciones="{ row }">
                    <div class="flex justify-center items-center gap-1.5">
                        <!-- Validar -->
                        <button
                            class="p-2 rounded-lg border border-slate-100 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-100 transition-all disabled:opacity-20"
                            title="Validar Grupo"
                            :disabled="!canApprove(row)"
                            @click="approve(row)"
                        >
                            <CheckBadgeIcon class="w-4 h-4" />
                        </button>

                        <!-- Configurar Currícula -->
                        <button
                            class="p-2 rounded-lg border border-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 transition-all"
                            title="Configurar Materias del Grupo"
                            @click="openEditorCurriculum(row)"
                        >
                            <RectangleGroupIcon class="w-4 h-4" />
                        </button>

                        <div class="w-px h-4 bg-slate-100 mx-0.5"></div>

                        <!-- Ver -->
                        <button
                            class="p-2 rounded-lg border border-slate-100 text-slate-400 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-100 transition-all"
                            @click="show(row)"
                        >
                            <EyeIcon class="w-4 h-4" />
                        </button>

                        <!-- Editar -->
                        <button
                            class="p-2 rounded-lg border border-slate-100 text-slate-400 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-100 transition-all"
                            @click="edit(row)"
                        >
                            <PencilSquareIcon class="w-4 h-4" />
                        </button>

                        <!-- Eliminar -->
                        <button
                            class="p-2 rounded-lg border border-slate-100 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-all"
                            @click="remove(row)"
                        >
                            <TrashIcon class="w-4 h-4" />
                        </button>
                    </div>
                </template>
            </DataTable>
        </div>
    </div>
</template>

<style scoped>
:deep(.table-container) {
    @apply border-none shadow-none rounded-none;
}
</style>
<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
    PlusIcon,
    EyeIcon,
    PencilSquareIcon,
    TrashIcon,
    CheckBadgeIcon,
    RectangleGroupIcon
} from '@heroicons/vue/24/outline'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import { useDataTableFetch } from '@/app/components/ui/datatable/useDataTableFetch'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'
import { API } from '@/shared/api'
import ApprovalStatusBadge from '@/app/components/ui/ApprovalStatusBadge.vue'
import { ApprovalStatusEnum } from '@/shared/enums/approval-status.enum'

// Tipado basado en la entidad PHP proporcionada
interface OptionalGroupRow {
    id: number
    name: string
    shortName: string
    officialCode: string
    studyPlan?: { officialCode: string }
    minSubjects: number
    maxSubjects: number
    minCredits: number
    approvalStatus: string
}

const router = useRouter()

const columns: DataTableColumn<OptionalGroupRow>[] = [
    { key: 'officialCode', label: 'CLAVE', field: 'officialCode', sortable: true },
    { key: 'name', label: 'NOMBRE GRUPO', field: 'name', sortable: true },
    { key: 'studyPlan', label: 'PLAN ESTUDIO' },
    { key: 'limits', label: 'MATERIAS (MIN/MAX)' },
    { key: 'minCredits', label: 'CRÉDITOS MIN.' },
    { key: 'status', label: 'ESTADO' },
    { key: 'opciones', label: 'ACCIONES', align: 'center' },
]

const {
    rows,
    loading,
    pagination,
    handleChange,
    fetchData,
} = useDataTableFetch<OptionalGroupRow>({
    endpoint: API.SUPERADMIN_API.optionalGroups.list, // Ajustado a optionalGroups
})

fetchData()

// Acciones de navegación
const create = () => router.push({ name: 'superadmin.optionalgroups.create' })
const show = (row: OptionalGroupRow) => router.push({ name: 'superadmin.optionalgroups.show', params: { id: row.id } })
const edit = (row: OptionalGroupRow) => router.push({ name: 'superadmin.optionalgroups.edit', params: { id: row.id } })
const approve = (row: OptionalGroupRow) => router.push({ name: 'superadmin.optionalgroups.approve', params: { id: row.id } })
const openEditorCurriculum = (row: OptionalGroupRow) => router.push({ name: 'superadmin.optionalgroups.editor', params: { id: row.id } })

const canApprove = (row: OptionalGroupRow): boolean => {
    return ![
        ApprovalStatusEnum.APPROVED,
        ApprovalStatusEnum.REJECTED,
    ].includes(row.approvalStatus as ApprovalStatusEnum)
}

const remove = async (row: OptionalGroupRow) => {
    // Aquí iría tu lógica de confirmación personalizada
    console.log("Eliminar grupo:", row.id)
}
</script>
