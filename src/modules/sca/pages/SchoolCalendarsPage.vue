<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Calendarios Escolares</h1>
            <button
                type="button"
                class="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                @click="router.push({ name: 'sca.school-calendars.create' })"
            >
                <PlusIcon class="w-4 h-4" />
                REGISTRAR CALENDARIO
            </button>
        </div>

        <div class="bg-white rounded-lg shadow px-4 py-3 flex items-center gap-3">
            <label class="inline-flex items-center gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    v-model="showArchived"
                    @change="onToggleArchived"
                />
                <span class="text-sm text-slate-700">Incluir periodos archivados</span>
            </label>
            <span class="text-xs text-slate-400">
                (ocultos por defecto para facilitar la búsqueda)
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

            <template #cell-period_status="{ row }">
                <span class="px-2 py-1 text-[10px] font-semibold rounded-full"
                    :class="periodStatusClass(row.collegeAcademicPeriod?.status)">
                    {{ periodStatusLabel(row.collegeAcademicPeriod?.status) }}
                </span>
            </template>

            <template #cell-status="{ row }">
                <span class="px-2 py-1 text-xs font-semibold rounded-full"
                    :class="row.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'">
                    {{ row.status === 'published' ? 'PUBLICADO' : 'BORRADOR' }}
                </span>
            </template>

            <template #cell-opciones="{ row }">
                <div class="flex items-center justify-center gap-2">
                    <button type="button"
                        class="border p-1.5 rounded-md text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition"
                        title="Editar"
                        @click="router.push({ name: 'sca.school-calendars.edit', params: { id: row.id } })">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l2.651 2.651M7.5 13.85l-.75 3.75 3.75-.75L19.513 7.138a2.121 2.121 0 00-3-3L7.5 13.85z" /></svg>
                    </button>
                    <button type="button"
                        class="border p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                        title="Eliminar"
                        @click="router.push({ name: 'sca.school-calendars.delete', params: { id: row.id } })">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M6 7.5h12m-10.5 0v10.125A1.875 1.875 0 009.375 19.5h5.25A1.875 1.875 0 0016.5 17.625V7.5M9.75 4.875A1.875 1.875 0 0111.625 3h.75A1.875 1.875 0 0114.25 4.875L15 7.5h-6l.75-2.625z" /></svg>
                    </button>
                </div>
            </template>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { PlusIcon } from '@heroicons/vue/24/outline'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import { useDataTableFetch } from '@/app/components/ui/datatable/useDataTableFetch'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'
import { API } from '@/shared/api'
import type { SchoolCalendar } from '@/modules/sca/types/schoolCalendar.type'
import { STATUS_OPTIONS as PERIOD_STATUS_OPTIONS } from '@/modules/school-services/types/college-academic-period.type'

const PERIOD_LABEL_MAP: Record<string, string> = Object.fromEntries(
    PERIOD_STATUS_OPTIONS.map(o => [o.value, o.label])
)

const router = useRouter()

const columns: DataTableColumn<SchoolCalendar>[] = [
    { key: 'id',             label: '#',       field: 'id', sortable: true },
    { key: 'period',         label: 'PERIODO' },
    { key: 'period_status',  label: 'ESTADO PERIODO' },
    { key: 'status',         label: 'CALENDARIO' },
    { key: 'opciones',       label: 'OPCIONES' },
]

const showArchived = ref(false)
const extraSearch = computed<Record<string, any>>(() =>
    showArchived.value ? {} : { period_status_exclude: 'archived' }
)

const { rows, loading, pagination, handleChange, fetchData } = useDataTableFetch<SchoolCalendar>({
    endpoint: API.SCA_API.schoolCalendars.list,
    extraSearch,
})

function onToggleArchived() {
    pagination.value.page = 1
    fetchData()
}

function periodStatusLabel(status?: string | null): string {
    if (!status) return '—'
    return (PERIOD_LABEL_MAP[status] ?? status).toUpperCase()
}

function periodStatusClass(status?: string | null): string {
    return ({
        draft:    'bg-gray-100 text-gray-600',
        planned:  'bg-blue-100 text-blue-700',
        active:   'bg-green-100 text-green-700',
        closed:   'bg-yellow-100 text-yellow-700',
        archived: 'bg-slate-200 text-slate-600',
    } as Record<string, string>)[status ?? ''] ?? 'bg-slate-100 text-slate-600'
}

fetchData()
</script>
