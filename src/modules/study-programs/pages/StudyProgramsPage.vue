<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">Programas de estudio</h1>
            <button
                type="button"
                class="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                @click="router.push({ name: 'study-programs.create' })"
            >
                <PlusIcon class="w-4 h-4" />
                NUEVO PROGRAMA
            </button>
        </div>

        <DataTable
            :columns="columns"
            :rows="rows"
            :loading="loading"
            :pagination="pagination"
            @change="handleChange"
        >
            <template #cell-clave="{ row }">
                {{ row.claveNormalized }}
            </template>

            <template #cell-status="{ row }">
                <span class="px-2 py-1 text-xs font-semibold rounded-full" :class="statusClass(row.approvalStatus)">
                    {{ statusLabel(row.approvalStatus) }}
                </span>
            </template>

            <template #cell-opciones="{ row }">
                <div class="flex items-center justify-center gap-2">
                    <button type="button" class="border p-1.5 rounded-md text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer" title="Editar"
                        @click="router.push({ name: 'study-programs.edit', params: { id: row.id } })">
                        <PencilSquareIcon class="w-4 h-4" />
                    </button>
                </div>
            </template>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { PlusIcon, PencilSquareIcon } from '@heroicons/vue/24/outline'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import { useDataTableFetch } from '@/app/components/ui/datatable/useDataTableFetch'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'
import { API } from '@/shared/api'

const router = useRouter()

const columns: DataTableColumn<any>[] = [
    { key: 'id',        label: '#',       field: 'id', sortable: true },
    { key: 'clave',     label: 'CLAVE',   field: 'clave_normalized' },
    { key: 'name',      label: 'NOMBRE',  field: 'name' },
    { key: 'status',    label: 'ESTADO' },
    { key: 'opciones',  label: 'OPCIONES' },
]

const { rows, loading, pagination, handleChange, fetchData } = useDataTableFetch<any>({
    endpoint: API.STUDY_PROGRAMS_API.studyPrograms.list,
})

function statusLabel(s: string): string {
    return ({ draft: 'BORRADOR', pending: 'EN REVISIÓN', approved: 'APROBADO', rejected: 'RECHAZADO' } as Record<string, string>)[s] ?? s
}
function statusClass(s: string): string {
    return ({
        draft: 'bg-slate-100 text-slate-600',
        pending: 'bg-amber-100 text-amber-700',
        approved: 'bg-green-100 text-green-700',
        rejected: 'bg-red-100 text-red-700',
    } as Record<string, string>)[s] ?? 'bg-slate-100 text-slate-600'
}

fetchData()
</script>
