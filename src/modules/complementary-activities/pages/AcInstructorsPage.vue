<template>
    <div class="space-y-5">
        <div>
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Instructores</h1>
            <p class="text-xs text-slate-400">Pool de instructores de actividades complementarias y extraescolares (distinto de los docentes). Se dan de alta desde el personal del instituto; también se registran solos al asignarlos a una actividad.</p>
        </div>

        <!-- Alta desde personal -->
        <section class="rounded-xl border bg-white p-4 space-y-2">
            <h2 class="text-sm font-bold uppercase text-slate-500">Agregar instructor desde el personal</h2>
            <div class="max-w-md">
                <FormRemoteSelect
                    v-model="picked"
                    :endpoint="AC.personnel"
                    :endpoint-by-id="AC.personnelById"
                    item-value="user_id"
                    item-label="full_name"
                    :item-searchs="['full_name']"
                    placeholder="Ver listado o buscar personal…"
                    @update:model-value="onPick" />
            </div>
        </section>

        <DataTable
            :columns="columns"
            :rows="rows"
            :loading="loading"
            :pagination="pagination"
            :initial-search="initialSearch"
            search-placeholder="Buscar instructor por nombre o correo…"
            @change="handleChange">

            <template #cell-email="{ row }">{{ row.email ?? '—' }}</template>
            <template #cell-is_active="{ row }">
                <span class="px-2 py-1 text-xs font-semibold rounded-full" :class="row.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'">
                    {{ row.is_active ? 'ACTIVO' : 'INACTIVO' }}
                </span>
            </template>
            <template #cell-opciones="{ row }">
                <div class="flex items-center justify-center gap-2">
                    <button v-if="row.is_active" @click="toggle(row)" aria-label="Desactivar" title="Desactivar"
                        class="border p-1.5 rounded-md text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition">
                        <NoSymbolIcon class="w-4 h-4" />
                    </button>
                    <button v-else @click="toggle(row)" aria-label="Activar" title="Activar"
                        class="border p-1.5 rounded-md text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition">
                        <CheckCircleIcon class="w-4 h-4" />
                    </button>
                </div>
            </template>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NoSymbolIcon, CheckCircleIcon } from '@heroicons/vue/24/outline'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import { useDataTableFetch } from '@/app/components/ui/datatable/useDataTableFetch'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'

const AC = API.AC_API
const toast = useToast()
const picked = ref<number | null>(null)

const columns: DataTableColumn[] = [
    { key: 'name',      label: 'INSTRUCTOR', field: 'name', sortable: true, searchable: true },
    { key: 'email',     label: 'CORREO' },
    { key: 'is_active', label: 'ESTADO',     field: 'is_active', sortable: true, align: 'center' },
    { key: 'opciones',  label: 'OPCIONES',   align: 'center' },
]
const { rows, loading, pagination, handleChange, fetchData, initialSearch } = useDataTableFetch<any>({
    endpoint: AC.acInstructors,
})

async function onPick(userId: number | null) {
    if (!userId) return
    try {
        await api.post(AC.acInstructors, { user_id: userId })
        toast.success('Instructor agregado.')
        picked.value = null
        await fetchData()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo agregar.') }
}
async function toggle(r: any) {
    try {
        await api.put(AC.acInstructorItem(r.id), { is_active: !r.is_active })
        await fetchData()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo actualizar.') }
}

fetchData()
</script>
