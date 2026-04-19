<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-2">
            <div>
                <h1 class="text-xl font-semibold text-slate-800">BITÁCORA DE SIMULACIONES</h1>
                <p class="text-sm text-slate-500 mt-1">
                    Registro de todas las sesiones de simulación iniciadas.
                </p>
            </div>
            <router-link
                to="/superadmin/impersonate"
                class="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
            >
                <EyeIcon class="w-4 h-4" />
                Simular Usuario
            </router-link>
        </div>

        <DataTable
            :columns="columns"
            :rows="rows"
            :loading="loading"
            :pagination="pagination"
            :perPageOptions="[10, 15, 30, 50]"
            @change="handleChange"
        >
            <template #cell-id="{ value }">
                <div class="font-medium text-center">{{ value }}</div>
            </template>

            <template #cell-impersonator="{ row }">
                <div class="min-w-0">
                    <p class="font-medium text-slate-800 truncate">{{ row.impersonator_name || `#${row.impersonator_id}` }}</p>
                    <p class="text-xs text-slate-500 truncate">{{ row.impersonator_email }}</p>
                </div>
            </template>

            <template #cell-impersonated="{ row }">
                <div class="min-w-0">
                    <p class="font-medium text-slate-800 truncate">{{ row.impersonated_name || `#${row.impersonated_id}` }}</p>
                    <p class="text-xs text-slate-500 truncate">{{ row.impersonated_email }}</p>
                </div>
            </template>

            <template #cell-started_at="{ row }">
                <span class="text-slate-600 text-sm">{{ formatDateTime(row.started_at) }}</span>
            </template>

            <template #cell-ended_at="{ row }">
                <span v-if="row.ended_at" class="text-slate-600 text-sm">
                    {{ formatDateTime(row.ended_at) }}
                </span>
                <span v-else class="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold uppercase rounded-full bg-amber-100 text-amber-700">
                    Activa
                </span>
            </template>

            <template #cell-ip="{ row }">
                <span class="text-slate-500 text-xs font-mono">{{ row.ip || '—' }}</span>
            </template>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'
import { useDataTableFetch } from '@/app/components/ui/datatable/useDataTableFetch'
import { API } from '@/shared/api'
import { EyeIcon } from '@heroicons/vue/24/outline'

interface LogRow {
    id: number
    impersonator_id: number
    impersonated_id: number
    impersonator_name: string | null
    impersonator_email: string | null
    impersonated_name: string | null
    impersonated_email: string | null
    token_id: number | null
    started_at: string
    ended_at: string | null
    ip: string | null
    user_agent: string | null
    is_active: boolean
}

const columns: DataTableColumn<LogRow>[] = [
    { key: 'id',             label: '#',              field: 'id',              sortable: true },
    { key: 'impersonator',   label: 'SUPERADMIN'                                                },
    { key: 'impersonated',   label: 'USUARIO SIMULADO'                                         },
    { key: 'started_at',     label: 'INICIO',         field: 'started_at',      sortable: true },
    { key: 'ended_at',       label: 'FIN',            field: 'ended_at',        sortable: true },
    { key: 'ip',             label: 'IP',             field: 'ip'                              },
]

const {
    rows,
    loading,
    pagination,
    fetchData,
    handleChange,
} = useDataTableFetch<LogRow>({
    endpoint: API.SUPERADMIN_API.impersonation.logs,
    initialPerPage: 15,
    mapResponse: data => ({
        items:   data.items,
        total:   data.total,
        page:    data.page,
        perPage: data.perPage,
    }),
})

fetchData()

function formatDateTime(value: string | null | undefined): string {
    if (!value) return '—'
    const d = new Date(value.replace(' ', 'T'))
    if (isNaN(d.getTime())) return value
    return d.toLocaleString('es-MX', {
        year:   'numeric',
        month:  '2-digit',
        day:    '2-digit',
        hour:   '2-digit',
        minute: '2-digit',
    })
}
</script>
