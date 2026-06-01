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
                    <button
                        v-if="row.subject && (row.subject.programFilePath || row.subject.programUrl)"
                        type="button"
                        class="border p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer disabled:opacity-50"
                        :disabled="openingPdfId === row.id"
                        :title="row.subject.programFilePath ? 'Abrir PDF del programa (respaldado)' : 'Abrir enlace al programa'"
                        @click="openPdf(row)"
                    >
                        <DocumentTextIcon class="w-4 h-4" />
                    </button>
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { PlusIcon, PencilSquareIcon, DocumentTextIcon } from '@heroicons/vue/24/outline'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import { useDataTableFetch } from '@/app/components/ui/datatable/useDataTableFetch'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'
import { API } from '@/shared/api'
import { openSubjectProgram } from '@/modules/study-programs/composables/useSubjectProgram'

const router = useRouter()

const openingPdfId = ref<number | null>(null)

async function openPdf(row: any): Promise<void> {
    if (!row.subject?.id) return
    openingPdfId.value = row.id
    try {
        await openSubjectProgram(row.subject.id, !!row.subject.programFilePath, row.subject.programUrl)
    } finally {
        openingPdfId.value = null
    }
}

const columns: DataTableColumn<any>[] = [
    { key: 'id',        label: '#',       field: 'id', sortable: true },
    { key: 'clave',     label: 'CLAVE',   field: 'clave_normalized', searchable: true },
    { key: 'name',      label: 'NOMBRE',  field: 'name', searchable: true },
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
