<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Reportes</h1>
            <button
                type="button"
                class="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                :disabled="creating"
                @click="createReport"
            >
                <PlusIcon class="w-4 h-4" />
                NUEVO REPORTE
            </button>
        </div>

        <DataTable
            :columns="columns"
            :rows="rows"
            :loading="loading"
            :pagination="pagination"
            @change="handleChange"
        >
            <template #cell-is_template="{ row }">
                <span v-if="row.isTemplate" class="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">
                    PLANTILLA
                </span>
                <span v-else class="px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600">
                    REPORTE
                </span>
            </template>

            <template #cell-status="{ row }">
                <span class="px-2 py-1 text-xs font-semibold rounded-full"
                    :class="row.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                    {{ row.status ? 'ACTIVO' : 'INACTIVO' }}
                </span>
            </template>

            <template #cell-opciones="{ row }">
                <div class="flex items-center justify-center gap-2">
                    <button aria-label="Ver" type="button" class="border p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition" title="Ver reporte"
                        @click="previewReportId = row.id">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>
                    <button v-if="hasTemplateBuilder(row.code)" aria-label="Afinar plantilla" type="button" class="border p-1.5 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition" title="Afinar plantilla"
                        @click="router.push({ name: 'reports.reports.tune', params: { id: row.id } })">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>
                    </button>
                    <button aria-label="Editar" type="button" class="border p-1.5 rounded-md text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition" title="Editar"
                        @click="router.push({ name: 'reports.reports.edit', params: { id: row.id } })">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l2.651 2.651M7.5 13.85l-.75 3.75 3.75-.75L19.513 7.138a2.121 2.121 0 00-3-3L7.5 13.85z" /></svg>
                    </button>
                    <button aria-label="Eliminar" type="button" class="border p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition" title="Eliminar"
                        @click="router.push({ name: 'reports.reports.delete', params: { id: row.id } })">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M6 7.5h12m-10.5 0v10.125A1.875 1.875 0 009.375 19.5h5.25A1.875 1.875 0 0016.5 17.625V7.5M9.75 4.875A1.875 1.875 0 0111.625 3h.75A1.875 1.875 0 0114.25 4.875L15 7.5h-6l.75-2.625z" /></svg>
                    </button>
                </div>
            </template>
        </DataTable>

        <!-- Modal: pedir parámetros y renderizar el reporte en PDF -->
        <ReportPreviewModal :report-id="previewReportId" @close="previewReportId = null" />
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { PlusIcon } from '@heroicons/vue/24/outline'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import ReportPreviewModal from '@/modules/reports/components/ReportPreviewModal.vue'
import { hasTemplateBuilder } from '@/modules/reports/templateBuilders'
import { useDataTableFetch } from '@/app/components/ui/datatable/useDataTableFetch'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'
import { API } from '@/shared/api'
import { api } from '@/shared/services/api'
import type { Report } from '@/modules/reports/types/report.type'

const router  = useRouter()
const creating = ref(false)

/* ── Ver reporte: modal que pide parámetros y renderiza el PDF ── */
const previewReportId = ref<number | string | null>(null)

async function createReport() {
    creating.value = true
    try {
        const res = await api.post(API.REPORTS_API.reports.create, {
            name:   'Reporte sin título',
            status: false,
        })
        router.push({ name: 'reports.reports.edit', params: { id: res.data.id } })
    } finally {
        creating.value = false
    }
}

const columns: DataTableColumn<Report>[] = [
    { key: 'id',          label: '#',       field: 'id',          sortable: true },
    { key: 'name',        label: 'NOMBRE',  field: 'name',        sortable: true },
    { key: 'code',        label: 'CÓDIGO',  field: 'code' },
    { key: 'is_template', label: 'TIPO' },
    { key: 'status',      label: 'ESTADO' },
    { key: 'opciones',    label: 'OPCIONES' },
]

const { rows, loading, pagination, handleChange, fetchData } = useDataTableFetch<Report>({
    endpoint: API.REPORTS_API.reports.list,
})

fetchData()
</script>
