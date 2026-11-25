<template>
    <div class="space-y-5 max-w-3xl">
        <div class="flex flex-wrap items-center justify-between gap-2">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Bandeja de documentos</h1>
            <router-link :to="{ name: 'service-desk.request' }" class="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold">+ Solicitar</router-link>
        </div>

        <DataTable :columns="columns" :rows="rows" hide-search caption="Bandeja de documentos" empty-text="Aún no tienes solicitudes. Usa “+ Solicitar” para pedir un documento.">
            <template #cell-document="{ row: r }"><span class="text-slate-700">{{ r.document_name }}</span><div v-if="r.reject_reason" class="text-xs text-red-500">{{ r.reject_reason }}</div></template>
            <template #cell-status="{ row: r }"><span class="px-2 py-0.5 rounded-full text-xs font-bold" :class="cls(r.status)">{{ lbl(r.status) }}</span></template>
            <template #cell-folio="{ row: r }"><span class="font-mono text-xs text-slate-500">{{ r.folio ?? '—' }}</span></template>
            <template #cell-actions="{ row: r }">
                <button v-if="r.status === 'issued'" @click="download(r.id)" class="text-xs text-blue-600 font-semibold">Descargar</button>
            </template>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { DeskRequest } from '@/modules/service-desk/types/service-desk.type'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'

const D = API.SERVICE_DESK_API
const rows = ref<DeskRequest[]>([])
const columns: DataTableColumn<DeskRequest>[] = [
    { key: 'document', label: 'Documento' },
    { key: 'status', label: 'Estado' },
    { key: 'folio', label: 'Folio' },
    { key: 'actions', label: '', align: 'right' },
]

function lbl(s: string) { return ({ requested: 'Solicitado', issued: 'Emitido', rejected: 'Rechazado', cancelled: 'Cancelado' } as Record<string,string>)[s] ?? s }
function cls(s: string) { return ({ requested: 'bg-amber-100 text-amber-700', issued: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-red-600', cancelled: 'bg-slate-200 text-slate-500' } as Record<string,string>)[s] ?? 'bg-slate-100 text-slate-500' }

async function download(id: number) {
    const { data } = await api.get(D.myRequestDocument(id), { responseType: 'text' })
    const url = URL.createObjectURL(new Blob([data], { type: 'text/html' }))
    window.open(url, '_blank'); setTimeout(() => URL.revokeObjectURL(url), 60000)
}

onMounted(async () => { rows.value = (await api.get(D.myRequests)).data ?? [] })
</script>
