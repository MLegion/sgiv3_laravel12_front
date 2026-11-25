<template>
    <div class="space-y-5">
        <h1 class="text-xl font-semibold text-slate-800 uppercase">Mis Actos (Sínodo)</h1>
        <p class="text-sm text-slate-500">Actos de titulación donde participas como jurado.</p>

        <DataTable :columns="columns" :rows="rows" hide-search caption="Mis Actos (Sínodo)" empty-text="No tienes actos asignados.">
            <template #cell-date="{ row: a }">
                <span class="font-semibold text-slate-700">{{ a.date }}</span><br><span class="text-xs text-slate-400">{{ a.start_time?.slice(0,5) }}–{{ a.end_time?.slice(0,5) }}</span>
            </template>
            <template #cell-student="{ row: a }">
                <div class="text-slate-700">{{ a.student_name }}</div><div class="text-xs text-slate-400">{{ a.project_title }}</div>
            </template>
            <template #cell-place="{ row: a }"><span class="text-slate-600">{{ a.place_name ?? '—' }}</span></template>
            <template #cell-my_role="{ row: a }"><span class="capitalize text-slate-600">{{ a.my_role }}</span></template>
            <template #cell-status="{ row: a }"><span class="px-2 py-0.5 rounded-full text-xs font-bold" :class="actStatusClass(a.status)">{{ actStatusLabel(a.status) }}</span></template>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { TitulacionAct } from '@/modules/titulacion/types/titulacion.type'
import { actStatusLabel, actStatusClass } from '@/modules/titulacion/pages/status'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'

const T = API.TITULACION_API
const rows = ref<TitulacionAct[]>([])
const columns: DataTableColumn<TitulacionAct>[] = [
    { key: 'date', label: 'Fecha / Hora' },
    { key: 'student', label: 'Alumno' },
    { key: 'place', label: 'Aula' },
    { key: 'my_role', label: 'Mi rol' },
    { key: 'status', label: 'Estado' },
]
onMounted(async () => { rows.value = (await api.get(T.myJury)).data ?? [] })
</script>
