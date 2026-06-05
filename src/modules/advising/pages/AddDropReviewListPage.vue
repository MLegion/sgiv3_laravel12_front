<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-3">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">{{ pageTitle }}</h1>

            <div class="flex items-center gap-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Estado</label>
                <select
                    v-model="statusFilter"
                    class="border rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                    @change="onStatusChange">
                    <option value="submitted">POR REVISAR</option>
                    <option value="approved">APROBADAS</option>
                    <option value="rejected">RECHAZADAS</option>
                    <option value="all">TODAS</option>
                </select>
            </div>
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

            <template #cell-period="{ row }">
                <span class="text-xs text-slate-600">{{ row.period?.shortName ?? row.period?.name ?? '—' }}</span>
            </template>

            <template #cell-status="{ row }">
                <span class="px-2 py-1 text-[10px] font-semibold rounded-full" :class="statusClass(row.status)">
                    {{ statusLabel(row.status) }}
                </span>
            </template>

            <template #cell-submittedAt="{ row }">
                <span class="text-xs text-slate-500">{{ formatDate(row.submittedAt) }}</span>
            </template>

            <template #cell-opciones="{ row }">
                <button type="button"
                    class="border w-8 h-8 inline-flex items-center justify-center rounded-md hover:bg-blue-50 text-blue-600 hover:border-blue-300 transition"
                    title="Revisar"
                    @click="router.push({ name: 'advising.add-drop.review.detail', params: { id: row.id } })">
                    <component :is="row.status === 'submitted' ? PencilSquareIcon : EyeIcon" class="w-4 h-4" />
                </button>
            </template>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import { useDataTableFetch } from '@/app/components/ui/datatable/useDataTableFetch'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'
import { API } from '@/shared/api'
import { PencilSquareIcon, EyeIcon } from '@heroicons/vue/24/outline'
import type { AddDropRequest, AdvisingStatus } from '@/modules/advising/types/advising.type'
import { useQueryFilter } from '@/shared/composables/useQueryFilter'

const router = useRouter()

type ReviewStatus = 'submitted' | 'approved' | 'rejected' | 'all'
const statusFilter = useQueryFilter<ReviewStatus>(
    'status',
    'submitted',
    {
        read:  (raw) => (raw === 'approved' || raw === 'rejected' || raw === 'all' ? raw : 'submitted'),
        write: (v)   => (v === 'submitted' ? null : v),
    },
)
const extraSearch = computed(() => ({ status: statusFilter.value }))

const columns: DataTableColumn<AddDropRequest>[] = [
    { key: 'id',          label: '#', field: 'id', sortable: true },
    { key: 'student',     label: 'ALUMNO' },
    { key: 'period',      label: 'PERIODO' },
    { key: 'status',      label: 'ESTADO' },
    { key: 'submittedAt', label: 'ENVIADA', sortable: true, field: 'submitted_at' },
    { key: 'opciones',    label: 'OPCIONES' },
]

const { rows, loading, pagination, handleChange, fetchData } = useDataTableFetch<AddDropRequest>({
    endpoint: API.ADVISING_API.addDrop.pending,
    extraSearch,
})

fetchData()

function onStatusChange() {
    pagination.value.page = 1
    fetchData()
}

const pageTitle = computed(() => {
    switch (statusFilter.value) {
        case 'approved': return 'Altas y Bajas Aprobadas'
        case 'rejected': return 'Altas y Bajas Rechazadas'
        case 'all':      return 'Altas y Bajas de Mi Carrera'
        default:         return 'Altas y Bajas por Revisar'
    }
})

function statusLabel(status: AdvisingStatus): string {
    return ({
        draft: 'BORRADOR', submitted: 'ENVIADA', approved: 'APROBADA', rejected: 'RECHAZADA', cancelled: 'CANCELADA',
    } as Record<AdvisingStatus, string>)[status] ?? status.toUpperCase()
}
function statusClass(status: AdvisingStatus): string {
    return ({
        draft: 'bg-slate-100 text-slate-600',
        submitted: 'bg-blue-100 text-blue-700',
        approved: 'bg-emerald-100 text-emerald-700',
        rejected: 'bg-red-100 text-red-700',
        cancelled: 'bg-slate-200 text-slate-500',
    } as Record<AdvisingStatus, string>)[status] ?? 'bg-slate-100 text-slate-600'
}
function formatDate(s: string | null): string {
    if (!s) return '—'
    return new Date(s).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}
</script>
