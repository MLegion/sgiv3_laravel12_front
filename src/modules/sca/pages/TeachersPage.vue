<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-3">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Docentes</h1>
            <div class="flex items-center gap-3">
                <div class="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                    <button
                        type="button"
                        class="px-3 py-1.5 text-xs font-semibold rounded-md transition"
                        :class="filterVacancy === null ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
                        @click="setFilter(null)"
                    >Todos</button>
                    <button
                        type="button"
                        class="px-3 py-1.5 text-xs font-semibold rounded-md transition"
                        :class="filterVacancy === false ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
                        @click="setFilter(false)"
                    >Docentes</button>
                    <button
                        type="button"
                        class="px-3 py-1.5 text-xs font-semibold rounded-md transition"
                        :class="filterVacancy === true ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
                        @click="setFilter(true)"
                    >Solo Vacantes</button>
                </div>
                <button
                    type="button"
                    class="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                    @click="router.push({ name: 'sca.teachers.create' })"
                >
                    <PlusIcon class="w-4 h-4" />
                    REGISTRAR DOCENTE
                </button>
            </div>
        </div>

        <DataTable
            :columns="columns"
            :rows="rows"
            :loading="loading"
            :pagination="pagination"
            @change="handleChange"
        >
            <template #cell-employee="{ row }">
                <div class="flex items-center gap-2">
                    <span class="font-medium">{{ teacherFullName(row) }}</span>
                    <span v-if="row.isVacancy" class="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">VACANTE</span>
                </div>
            </template>

            <template #cell-career="{ row }">
                <span v-if="row.isVacancy && row.career" class="text-xs text-slate-600">{{ row.career.shortName || row.career.name }}</span>
                <span v-else class="text-slate-300">—</span>
            </template>

            <template #cell-status="{ row }">
                <span class="px-2 py-1 text-xs font-semibold rounded-full"
                    :class="row.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                    {{ row.status ? 'ACTIVO' : 'INACTIVO' }}
                </span>
            </template>

            <template #cell-opciones="{ row }">
                <div class="flex items-center justify-center gap-2">
                    <button type="button"
                        class="border p-1.5 rounded-md text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition"
                        title="Editar"
                        @click="router.push({ name: 'sca.teachers.edit', params: { id: row.id } })">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l2.651 2.651M7.5 13.85l-.75 3.75 3.75-.75L19.513 7.138a2.121 2.121 0 00-3-3L7.5 13.85z" /></svg>
                    </button>
                    <button type="button"
                        class="border p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                        title="Eliminar"
                        @click="router.push({ name: 'sca.teachers.delete', params: { id: row.id } })">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M6 7.5h12m-10.5 0v10.125A1.875 1.875 0 009.375 19.5h5.25A1.875 1.875 0 0016.5 17.625V7.5M9.75 4.875A1.875 1.875 0 0111.625 3h.75A1.875 1.875 0 0114.25 4.875L15 7.5h-6l.75-2.625z" /></svg>
                    </button>
                </div>
            </template>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { PlusIcon } from '@heroicons/vue/24/outline'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import { useDataTableFetch } from '@/app/components/ui/datatable/useDataTableFetch'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'
import { API } from '@/shared/api'
import type { Teacher } from '@/modules/sca/types/teacher.type'
import { teacherFullName } from '@/modules/sca/types/teacher.type'

const router = useRouter()

const columns: DataTableColumn<Teacher>[] = [
    { key: 'id',        label: '#',        field: 'id',       sortable: true },
    { key: 'employee',  label: 'DOCENTE' },
    { key: 'career',    label: 'CARRERA (VACANTE)' },
    { key: 'customId',  label: 'ID EXTERNO', field: 'customId' },
    { key: 'status',    label: 'ESTADO' },
    { key: 'opciones',  label: 'OPCIONES' },
]

const filterVacancy = ref<boolean | null>(null)

const extraSearch = computed<Record<string, any>>(() =>
    filterVacancy.value === null ? {} : { is_vacancy: filterVacancy.value ? 'true' : 'false' }
)

const { rows, loading, pagination, handleChange, fetchData } = useDataTableFetch<Teacher>({
    endpoint: API.SCA_API.teachers.list,
    extraSearch,
})

function setFilter(v: boolean | null) {
    filterVacancy.value = v
    pagination.value.page = 1
    fetchData()
}

fetchData()
</script>
