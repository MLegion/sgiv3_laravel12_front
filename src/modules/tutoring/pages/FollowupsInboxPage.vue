<template>
    <div class="space-y-5">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Seguimientos por revisar</h1>
            <p class="text-xs text-slate-400">Hitos del PAT entregados por los tutores (Cap. 15).</p>
        </div>

        <DataTable :columns="columns" :rows="rows" hide-search caption="Seguimientos por revisar" empty-text="Sin hitos por revisar.">
            <template #cell-tutor_name="{ row }"><span class="font-semibold text-slate-700">{{ row.tutor_name }}</span></template>
            <template #cell-scope="{ row }"><span class="text-slate-600">{{ row.scope === 'grupal' ? 'Grupal' : 'Individual' }}</span></template>
            <template #cell-career_name="{ row }"><span class="text-slate-600">{{ row.career_name ?? '—' }}</span></template>
            <template #cell-stage_label="{ row }"><span class="text-slate-600">{{ row.stage_label }}</span></template>
            <template #cell-submitted_at="{ row }"><span class="text-slate-500 text-xs">{{ fmt(row.submitted_at) }}</span></template>
            <template #cell-actions="{ row }">
                <router-link :to="`/tutoring/assignments/${row.assignment_id}/followups`" class="px-2 py-1 rounded border text-[11px] text-slate-600">Ver</router-link>
                <button @click="review(row)" :disabled="busy" class="px-2 py-1 rounded bg-emerald-600 text-white text-[11px] font-semibold ml-1 disabled:opacity-50">Revisar</button>
            </template>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'

const columns: DataTableColumn<any>[] = [
    { key: 'tutor_name', label: 'Tutor' },
    { key: 'scope', label: 'Ámbito' },
    { key: 'career_name', label: 'Carrera' },
    { key: 'stage_label', label: 'Hito' },
    { key: 'submitted_at', label: 'Entregado' },
    { key: 'actions', label: '', align: 'right' },
]

const T = API.TUTORING_API
const toast = useToast()
const rows = ref<any[]>([])
const busy = ref(false)

function fmt(d: string | null) { return d ? new Date(d).toLocaleDateString() : '—' }

async function load() {
    const { data } = await api.get(T.followups.pending)
    rows.value = data.data ?? []
}
async function review(r: any) {
    busy.value = true
    try {
        await api.post(T.followups.review(r.id))
        toast.success('Hito revisado.')
        await load()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'Operación no permitida.') }
    finally { busy.value = false }
}

onMounted(load)
</script>
