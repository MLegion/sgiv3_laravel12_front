<template>
    <div class="space-y-5 max-w-3xl">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Bandeja de documentos</h1>
            <router-link :to="{ name: 'service-desk.request' }" class="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold">+ Solicitar</router-link>
        </div>

        <div class="rounded-xl border bg-white overflow-hidden">
            <table class="w-full text-sm">
                <thead><tr class="text-left text-[10px] uppercase text-slate-400 bg-slate-50 border-b">
                    <th class="px-4 py-2">Documento</th><th>Estado</th><th>Folio</th><th></th>
                </tr></thead>
                <tbody>
                    <tr v-for="r in rows" :key="r.id" class="border-b last:border-0">
                        <td class="px-4 py-2 text-slate-700">{{ r.document_name }}<div v-if="r.reject_reason" class="text-xs text-red-500">{{ r.reject_reason }}</div></td>
                        <td><span class="px-2 py-0.5 rounded-full text-xs font-bold" :class="cls(r.status)">{{ lbl(r.status) }}</span></td>
                        <td class="font-mono text-xs text-slate-500">{{ r.folio ?? '—' }}</td>
                        <td class="text-right pr-4">
                            <button v-if="r.status === 'issued'" @click="download(r.id)" class="text-xs text-blue-600 font-semibold">Descargar</button>
                        </td>
                    </tr>
                    <tr v-if="!rows.length"><td colspan="4" class="px-4 py-6 text-center text-slate-400">Aún no tienes solicitudes. Usa “+ Solicitar” para pedir un documento.</td></tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { DeskRequest } from '@/modules/service-desk/types/service-desk.type'

const D = API.SERVICE_DESK_API
const rows = ref<DeskRequest[]>([])

function lbl(s: string) { return ({ requested: 'Solicitado', issued: 'Emitido', rejected: 'Rechazado', cancelled: 'Cancelado' } as Record<string,string>)[s] ?? s }
function cls(s: string) { return ({ requested: 'bg-amber-100 text-amber-700', issued: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-red-600', cancelled: 'bg-slate-200 text-slate-500' } as Record<string,string>)[s] ?? 'bg-slate-100 text-slate-500' }

async function download(id: number) {
    const { data } = await api.get(D.myRequestDocument(id), { responseType: 'text' })
    const url = URL.createObjectURL(new Blob([data], { type: 'text/html' }))
    window.open(url, '_blank'); setTimeout(() => URL.revokeObjectURL(url), 60000)
}

onMounted(async () => { rows.value = (await api.get(D.myRequests)).data ?? [] })
</script>
