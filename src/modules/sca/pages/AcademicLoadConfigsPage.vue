<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Configuración de Carga Académica</h1>
            <button
                type="button"
                class="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                @click="router.push({ name: 'sca.academic-load-configs.create' })"
            >
                <PlusIcon class="w-4 h-4" />
                REGISTRAR CONFIGURACIÓN
            </button>
        </div>

        <DataTable
            :columns="columns"
            :rows="rows"
            :loading="loading"
            :pagination="pagination"
            @change="handleChange"
        >
            <template #cell-period="{ row }">
                {{ row.collegeAcademicPeriod?.academicPeriod?.name ?? '—' }}
            </template>

            <template #cell-modality="{ row }">
                {{ row.modality?.modalityType?.name ?? '—' }}
            </template>

            <template #cell-period_status="{ row }">
                <span class="px-2 py-1 text-[10px] font-semibold rounded-full"
                    :class="periodStatusClass(row.collegeAcademicPeriod?.status)">
                    {{ (row.collegeAcademicPeriod?.status ?? '—').toUpperCase() }}
                </span>
            </template>

            <template #cell-status="{ row }">
                <span class="px-2 py-1 text-[10px] font-semibold rounded-full"
                    :class="configStatusClass(row.status)">
                    {{ statusLabel(row.status) }}
                </span>
            </template>

            <template #cell-phases_active="{ row }">
                <span class="text-xs font-mono font-bold text-slate-600">
                    {{ activePhasesCount(row) }} / 6
                </span>
            </template>

            <template #cell-last_synced="{ row }">
                <span class="text-[10px] text-slate-500">{{ formatSync(row.lastSyncedAt) }}</span>
            </template>

            <template #cell-opciones="{ row }">
                <div class="flex items-center justify-center gap-2">
                    <button type="button"
                        class="border p-1.5 rounded-md text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition"
                        title="Gestionar"
                        @click="router.push({ name: 'sca.academic-load-configs.edit', params: { id: row.id } })">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l2.651 2.651M7.5 13.85l-.75 3.75 3.75-.75L19.513 7.138a2.121 2.121 0 00-3-3L7.5 13.85z" /></svg>
                    </button>
                    <button type="button"
                        class="border p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                        title="Eliminar"
                        @click="confirmDelete(row)">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M6 7.5h12m-10.5 0v10.125A1.875 1.875 0 009.375 19.5h5.25A1.875 1.875 0 0016.5 17.625V7.5M9.75 4.875A1.875 1.875 0 0111.625 3h.75A1.875 1.875 0 0114.25 4.875L15 7.5h-6l.75-2.625z" /></svg>
                    </button>
                </div>
            </template>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { PlusIcon } from '@heroicons/vue/24/outline'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import { useDataTableFetch } from '@/app/components/ui/datatable/useDataTableFetch'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'
import { API } from '@/shared/api'
import { api } from '@/shared/services/api'
import type { AcademicLoadConfig } from '@/modules/sca/types/academicLoadConfig.type'

const router = useRouter()

const columns: DataTableColumn<AcademicLoadConfig>[] = [
    { key: 'id',             label: '#',             field: 'id', sortable: true },
    { key: 'period',         label: 'PERIODO' },
    { key: 'modality',       label: 'MODALIDAD' },
    { key: 'period_status',  label: 'PERIODO' },
    { key: 'status',         label: 'CONFIG' },
    { key: 'phases_active',  label: 'FASES' },
    { key: 'last_synced',    label: 'ÚLT. SYNC' },
    { key: 'opciones',       label: 'OPCIONES' },
]

const { rows, loading, pagination, handleChange, fetchData } = useDataTableFetch<AcademicLoadConfig>({
    endpoint: API.SCA_API.academicLoadConfigs.list,
})

fetchData()

function activePhasesCount(row: AcademicLoadConfig): number {
    return [
        row.phasePackage,
        row.phasePackageValidation,
        row.phaseRequest,
        row.phaseAssignment,
        row.phaseSchedule,
        row.phaseSchedulePublished,
    ].filter(Boolean).length
}

function statusLabel(status: string): string {
    return ({ draft: 'BORRADOR', active: 'ACTIVO', closed: 'CERRADO' } as Record<string, string>)[status] ?? status.toUpperCase()
}

function configStatusClass(status: string): string {
    return ({
        draft:  'bg-slate-100 text-slate-600',
        active: 'bg-green-100 text-green-700',
        closed: 'bg-yellow-100 text-yellow-700',
    } as Record<string, string>)[status] ?? 'bg-slate-100 text-slate-600'
}

function periodStatusClass(status?: string): string {
    return ({
        draft:    'bg-gray-100 text-gray-600',
        planned:  'bg-blue-100 text-blue-700',
        active:   'bg-green-100 text-green-700',
        closed:   'bg-yellow-100 text-yellow-700',
        archived: 'bg-slate-200 text-slate-600',
    } as Record<string, string>)[status ?? ''] ?? 'bg-slate-100 text-slate-600'
}

function formatSync(s: string | null): string {
    if (!s) return 'NUNCA'
    const d = new Date(s)
    return d.toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

async function confirmDelete(row: AcademicLoadConfig) {
    if (!confirm(`¿Eliminar configuración del periodo "${row.collegeAcademicPeriod?.academicPeriod?.name}"?`)) return
    try {
        await api.delete(API.SCA_API.academicLoadConfigs.delete(row.id))
        await fetchData()
    } catch (e: any) {
        alert(e?.response?.data?.message ?? 'Error al eliminar.')
    }
}
</script>
