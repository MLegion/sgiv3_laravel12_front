<template>
    <div class="space-y-5">
        <h1 class="text-xl font-semibold text-slate-800 uppercase">Solicitudes de ventanilla</h1>

        <div class="rounded-xl border bg-white p-4 flex gap-3">
            <select v-model="filters.status" @change="fetchList" aria-label="Estado de la solicitud" class="rounded-lg border-slate-300 text-sm">
                <option value="requested">Pendientes</option>
                <option value="issued">Emitidas</option>
                <option value="rejected">Rechazadas</option>
                <option value="">Todas</option>
            </select>
        </div>

        <DataTable :columns="columns" :rows="rows" hide-search caption="Solicitudes de ventanilla" empty-text="Sin solicitudes.">
            <template #cell-student="{ row: r }"><div class="text-slate-700">{{ r.student_name }}</div><div class="text-xs text-slate-400">{{ r.num_control }}</div></template>
            <template #cell-document="{ row: r }"><span class="text-slate-600">{{ r.document_name }}</span></template>
            <template #cell-notes="{ row: r }"><span class="text-slate-500 text-xs">{{ r.notes ?? '—' }}</span></template>
            <template #cell-status="{ row: r }"><span class="px-2 py-0.5 rounded-full text-xs font-bold" :class="cls(r.status)">{{ lbl(r.status) }}</span></template>
            <template #cell-actions="{ row: r }">
                <template v-if="r.status === 'requested'">
                    <button @click="issue(r.id)" class="text-xs text-emerald-600 font-semibold">Emitir</button>
                    <button @click="reject(r.id)" class="text-xs text-red-500 ml-2">Rechazar</button>
                </template>
                <span v-else-if="r.folio" class="font-mono text-xs text-slate-400">{{ r.folio }}</span>
            </template>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { usePrompt } from '@/app/composables/usePrompt'
import type { DeskRequest } from '@/modules/service-desk/types/service-desk.type'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'

const { prompt } = usePrompt()
const D = API.SERVICE_DESK_API
const rows = ref<DeskRequest[]>([])
const columns: DataTableColumn<DeskRequest>[] = [
    { key: 'student', label: 'Estudiante' },
    { key: 'document', label: 'Documento' },
    { key: 'notes', label: 'Comentario' },
    { key: 'status', label: 'Estado' },
    { key: 'actions', label: '', align: 'right' },
]
const filters = reactive({ status: 'requested' })

function lbl(s: string) { return ({ requested: 'Solicitado', issued: 'Emitido', rejected: 'Rechazado', cancelled: 'Cancelado' } as Record<string,string>)[s] ?? s }
function cls(s: string) { return ({ requested: 'bg-amber-100 text-amber-700', issued: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-red-600', cancelled: 'bg-slate-200 text-slate-500' } as Record<string,string>)[s] ?? 'bg-slate-100 text-slate-500' }

async function fetchList() {
    const { data } = await api.get(D.requests, { params: { status: filters.status || undefined, per_page: 50 } })
    rows.value = data.data ?? []
}
async function issue(id: number) { await api.post(D.issueRequest(id)); await fetchList() }
async function reject(id: number) {
    const reason = await prompt({ title: 'Rechazar solicitud', label: 'Motivo del rechazo (opcional)', inputType: 'textarea', confirmText: 'Rechazar' })
    if (reason === null) return
    await api.post(D.rejectRequest(id), { reason: reason || null }); await fetchList()
}

onMounted(fetchList)
</script>
