<template>
    <div class="space-y-5">
        <h1 class="text-xl font-semibold text-slate-800 uppercase">Solicitudes de ventanilla</h1>

        <div class="rounded-xl border bg-white p-4 flex gap-3">
            <select v-model="filters.status" @change="fetchList" class="rounded-lg border-slate-300 text-sm">
                <option value="requested">Pendientes</option>
                <option value="issued">Emitidas</option>
                <option value="rejected">Rechazadas</option>
                <option value="">Todas</option>
            </select>
        </div>

        <div class="rounded-xl border bg-white overflow-hidden">
            <table class="w-full text-sm">
                <thead><tr class="text-left text-[10px] uppercase text-slate-400 bg-slate-50 border-b">
                    <th class="px-4 py-2">Alumno</th><th>Documento</th><th>Comentario</th><th>Estado</th><th></th>
                </tr></thead>
                <tbody>
                    <tr v-for="r in rows" :key="r.id" class="border-b last:border-0 hover:bg-slate-50">
                        <td class="px-4 py-2"><div class="text-slate-700">{{ r.student_name }}</div><div class="text-xs text-slate-400">{{ r.num_control }}</div></td>
                        <td class="text-slate-600">{{ r.document_name }}</td>
                        <td class="text-slate-500 text-xs">{{ r.notes ?? '—' }}</td>
                        <td><span class="px-2 py-0.5 rounded-full text-xs font-bold" :class="cls(r.status)">{{ lbl(r.status) }}</span></td>
                        <td class="text-right pr-4 whitespace-nowrap">
                            <template v-if="r.status === 'requested'">
                                <button @click="issue(r.id)" class="text-xs text-emerald-600 font-semibold">Emitir</button>
                                <button @click="reject(r.id)" class="text-xs text-red-500 ml-2">Rechazar</button>
                            </template>
                            <span v-else-if="r.folio" class="font-mono text-xs text-slate-400">{{ r.folio }}</span>
                        </td>
                    </tr>
                    <tr v-if="!rows.length"><td colspan="5" class="px-4 py-6 text-center text-slate-400">Sin solicitudes.</td></tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { DeskRequest } from '@/modules/service-desk/types/service-desk.type'

const D = API.SERVICE_DESK_API
const rows = ref<DeskRequest[]>([])
const filters = reactive({ status: 'requested' })

function lbl(s: string) { return ({ requested: 'Solicitado', issued: 'Emitido', rejected: 'Rechazado', cancelled: 'Cancelado' } as Record<string,string>)[s] ?? s }
function cls(s: string) { return ({ requested: 'bg-amber-100 text-amber-700', issued: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-red-600', cancelled: 'bg-slate-200 text-slate-500' } as Record<string,string>)[s] ?? 'bg-slate-100 text-slate-500' }

async function fetchList() {
    const { data } = await api.get(D.requests, { params: { status: filters.status || undefined, per_page: 50 } })
    rows.value = data.data ?? []
}
async function issue(id: number) { await api.post(D.issueRequest(id)); await fetchList() }
async function reject(id: number) {
    const reason = prompt('Motivo del rechazo (opcional):') ?? ''
    await api.post(D.rejectRequest(id), { reason: reason || null }); await fetchList()
}

onMounted(fetchList)
</script>
