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
                <span class="text-xs text-slate-600">
                    {{ row.period?.shortName ?? row.period?.name ?? '—' }}
                </span>
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
                <button aria-label="rowActionLabel(row.status)" type="button"
                    class="border w-8 h-8 inline-flex items-center justify-center rounded-md hover:bg-slate-50 transition"
                    :class="rowActionClass(row.status)"
                    :title="rowActionLabel(row.status)"
                    @click="router.push({ name: 'advising.review.detail', params: { id: row.id } })">
                    <component :is="rowActionIcon(row.status)" class="w-4 h-4" />
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
import {
    PencilSquareIcon, ArrowPathIcon, EyeIcon,
} from '@heroicons/vue/24/outline'
import type { AdvisingSession, AdvisingStatus } from '@/modules/advising/types/advising.type'
import { useQueryFilter } from '@/shared/composables/useQueryFilter'

const router = useRouter()

// Default 'submitted' = POR REVISAR. Persistido en URL: el asesor entra
// desde el menú sin query y aterriza en POR REVISAR; si cambia el filtro,
// queda en la URL y sobrevive refresh / link compartido.
type ReviewStatus = 'submitted' | 'approved' | 'rejected' | 'all'
const statusFilter = useQueryFilter<ReviewStatus>(
    'status',
    'submitted',
    {
        read:  (raw) => (raw === 'approved' || raw === 'rejected' || raw === 'all' ? raw : 'submitted'),
        write: (v)   => (v === 'submitted' ? null : v),
    },
)
const extraSearch  = computed(() => ({ status: statusFilter.value }))

const columns: DataTableColumn<AdvisingSession>[] = [
    { key: 'id',          label: '#',          field: 'id', sortable: true },
    { key: 'student',     label: 'ALUMNO' },
    { key: 'period',      label: 'PERIODO' },
    { key: 'status',      label: 'ESTADO' },
    { key: 'submittedAt', label: 'ENVIADA',     sortable: true, field: 'submitted_at' },
    { key: 'reviewer',    label: 'REVISA' },
    { key: 'opciones',    label: 'OPCIONES' },
]

const { rows, loading, pagination, handleChange, fetchData } = useDataTableFetch<AdvisingSession>({
    endpoint: API.ADVISING_API.sessions.pendingReview,
    extraSearch,
})

fetchData()

function onStatusChange() {
    pagination.value.page = 1
    fetchData()
}

const pageTitle = computed(() => {
    switch (statusFilter.value) {
        case 'approved': return 'Asesorías Aprobadas'
        case 'rejected': return 'Asesorías Rechazadas'
        case 'all':      return 'Asesorías de Mi Carrera'
        default:         return 'Asesorías por Revisar'
    }
})

function rowActionLabel(status: AdvisingStatus): string {
    if (status === 'approved') return 'VER / REABRIR'
    if (status === 'rejected') return 'VER'
    return 'REVISAR'
}
function rowActionClass(status: AdvisingStatus): string {
    if (status === 'approved') return 'text-amber-700 hover:border-amber-300 hover:bg-amber-50'
    if (status === 'rejected') return 'text-slate-700 hover:border-slate-300'
    return 'text-blue-600 hover:border-blue-300 hover:bg-blue-50'
}
function rowActionIcon(status: AdvisingStatus) {
    if (status === 'approved') return ArrowPathIcon
    if (status === 'rejected') return EyeIcon
    return PencilSquareIcon
}

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
