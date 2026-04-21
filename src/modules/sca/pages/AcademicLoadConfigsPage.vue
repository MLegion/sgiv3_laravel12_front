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

        <div v-if="errorMsg" class="text-sm px-4 py-3 rounded-lg bg-red-50 text-red-700 border border-red-100">
            {{ errorMsg }}
        </div>

        <div class="bg-white rounded-lg shadow px-4 py-3 flex items-center gap-3">
            <label class="inline-flex items-center gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    v-model="showArchived"
                    @change="onToggleArchived"
                />
                <span class="text-sm text-slate-700">Incluir configuraciones de periodos archivados</span>
            </label>
            <span class="text-xs text-slate-400">
                (ocultas por defecto para facilitar la búsqueda)
            </span>
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

            <template #cell-campus="{ row }">
                {{ row.modality?.campus?.name ?? row.modality?.campus?.shortName ?? '—' }}
            </template>

            <template #cell-modality="{ row }">
                {{ row.modality?.modalityType?.name ?? '—' }}
            </template>

            <template #cell-period_status="{ row }">
                <span class="px-2 py-1 text-[10px] font-semibold rounded-full"
                    :class="periodStatusClass(row.collegeAcademicPeriod?.status)">
                    {{ periodStatusLabel(row.collegeAcademicPeriod?.status) }}
                </span>
            </template>

            <template #cell-status="{ row }">
                <div class="flex items-center gap-2">
                    <select
                        :value="row.status"
                        :disabled="savingIds.has(row.id)"
                        class="text-[10px] font-semibold rounded-full border-0 focus:ring-2 focus:ring-blue-400 px-3 py-1 cursor-pointer disabled:opacity-60"
                        :class="configStatusClass(row.status)"
                        @change="onStatusChange(row, ($event.target as HTMLSelectElement).value)"
                    >
                        <option v-for="opt in CONFIG_STATUS_OPTIONS" :key="opt.value" :value="opt.value">
                            {{ opt.label }}
                        </option>
                    </select>
                    <span v-if="savingIds.has(row.id)" class="text-[10px] text-slate-400">Guardando…</span>
                    <span v-else-if="savedIds.has(row.id)" class="text-[10px] text-emerald-600">✓ Guardado</span>
                </div>
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
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { PlusIcon } from '@heroicons/vue/24/outline'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import { useDataTableFetch } from '@/app/components/ui/datatable/useDataTableFetch'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'
import { API } from '@/shared/api'
import { api } from '@/shared/services/api'
import type { AcademicLoadConfig } from '@/modules/sca/types/academicLoadConfig.type'
import { STATUS_OPTIONS as PERIOD_STATUS_OPTIONS } from '@/modules/school-services/types/college-academic-period.type'

const CONFIG_STATUS_OPTIONS = [
    { value: 'draft',  label: 'Borrador' },
    { value: 'active', label: 'Activo' },
    { value: 'closed', label: 'Cerrado' },
]

const PERIOD_LABEL_MAP: Record<string, string> = Object.fromEntries(
    PERIOD_STATUS_OPTIONS.map(o => [o.value, o.label])
)

const router = useRouter()

const columns: DataTableColumn<AcademicLoadConfig>[] = [
    { key: 'id',             label: '#',             field: 'id', sortable: true },
    { key: 'period',         label: 'PERIODO' },
    { key: 'campus',         label: 'CAMPUS' },
    { key: 'modality',       label: 'MODALIDAD' },
    { key: 'period_status',  label: 'PERIODO' },
    { key: 'status',         label: 'CONFIG' },
    { key: 'phases_active',  label: 'FASES' },
    { key: 'last_synced',    label: 'ÚLT. SYNC' },
    { key: 'opciones',       label: 'OPCIONES' },
]

const showArchived = ref(false)
const extraSearch = computed<Record<string, any>>(() =>
    showArchived.value ? {} : { period_status_exclude: 'archived' }
)

const { rows, loading, pagination, handleChange, fetchData } = useDataTableFetch<AcademicLoadConfig>({
    endpoint: API.SCA_API.academicLoadConfigs.list,
    extraSearch,
})

function onToggleArchived() {
    pagination.value.page = 1
    fetchData()
}

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

function periodStatusLabel(status?: string | null): string {
    if (!status) return '—'
    return (PERIOD_LABEL_MAP[status] ?? status).toUpperCase()
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

/* ---------- Cambio de estado inline ---------- */
const savingIds = reactive(new Set<number>())
const savedIds  = reactive(new Set<number>())
const errorMsg  = ref('')

async function onStatusChange(row: AcademicLoadConfig, newStatus: string) {
    if (newStatus === row.status) return

    const prevStatus = row.status
    row.status = newStatus as AcademicLoadConfig['status']
    savingIds.add(row.id)
    errorMsg.value = ''

    try {
        const { data } = await api.patch(
            API.SCA_API.academicLoadConfigs.updateStatus(row.id),
            { status: newStatus },
        )
        row.status = data.status ?? newStatus
        savedIds.add(row.id)
        setTimeout(() => savedIds.delete(row.id), 2000)
    } catch (e: any) {
        row.status = prevStatus
        errorMsg.value = e?.response?.data?.message
            || e?.response?.data?.errors?.status?.[0]
            || 'Error al cambiar el estado.'
    } finally {
        savingIds.delete(row.id)
    }
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
