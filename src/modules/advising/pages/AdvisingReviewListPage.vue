<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Asesorías por Revisar</h1>
        </div>

        <DataTable
            :columns="columns"
            :rows="rows"
            :loading="loading"
            :pagination="pagination"
            @change="handleChange"
        >
            <template #cell-student="{ row }">
                <div class="flex flex-col">
                    <span class="text-sm font-bold text-slate-700">{{ row.student?.fullName ?? '—' }}</span>
                    <span class="text-[10px] font-mono text-slate-400">{{ row.student?.numControl ?? '' }}</span>
                </div>
            </template>

            <template #cell-status="{ row }">
                <span class="px-2 py-1 text-[10px] font-semibold rounded-full"
                      :class="statusClass(row.status)">
                    {{ statusLabel(row.status) }}
                </span>
            </template>

            <template #cell-submittedAt="{ row }">
                <span class="text-xs text-slate-500">{{ formatDate(row.submittedAt) }}</span>
            </template>

            <template #cell-reviewer="{ row }">
                <span v-if="row.reviewer" class="text-xs text-slate-600">{{ row.reviewer.name }}</span>
                <span v-else class="text-xs text-slate-400 italic">Sin tomar</span>
            </template>

            <template #cell-opciones="{ row }">
                <button type="button"
                    class="border px-3 py-1.5 rounded-md text-xs text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition"
                    @click="router.push({ name: 'advising.review.detail', params: { id: row.id } })">
                    REVISAR
                </button>
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
import type { AdvisingSession, AdvisingStatus } from '@/modules/advising/types/advising.type'

const router = useRouter()

const columns: DataTableColumn<AdvisingSession>[] = [
    { key: 'id',          label: '#',          field: 'id', sortable: true },
    { key: 'student',     label: 'ALUMNO' },
    { key: 'status',      label: 'ESTADO' },
    { key: 'submittedAt', label: 'ENVIADA',     sortable: true, field: 'submitted_at' },
    { key: 'reviewer',    label: 'REVISA' },
    { key: 'opciones',    label: 'OPCIONES' },
]

const { rows, loading, pagination, handleChange, fetchData } = useDataTableFetch<AdvisingSession>({
    endpoint: API.ADVISING_API.sessions.pendingReview,
})

fetchData()

function statusLabel(status: AdvisingStatus): string {
    return ({
        draft:     'BORRADOR',
        submitted: 'ENVIADA',
        approved:  'APROBADA',
        rejected:  'RECHAZADA',
        cancelled: 'CANCELADA',
    } as Record<AdvisingStatus, string>)[status] ?? status.toUpperCase()
}

function statusClass(status: AdvisingStatus): string {
    return ({
        draft:     'bg-slate-100 text-slate-600',
        submitted: 'bg-blue-100 text-blue-700',
        approved:  'bg-emerald-100 text-emerald-700',
        rejected:  'bg-red-100 text-red-700',
        cancelled: 'bg-slate-200 text-slate-500',
    } as Record<AdvisingStatus, string>)[status] ?? 'bg-slate-100 text-slate-600'
}

function formatDate(s: string | null): string {
    if (!s) return '—'
    const d = new Date(s)
    return d.toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}
</script>
